const User = require('../models/User');
const Feedback = require('../models/Feedback');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const AUTH_COOKIE_NAME = 'mindcare_auth';
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PROFILE_FIELDS = ['firstName', 'lastName', 'dob', 'gender', 'mobile', 'email', 'city', 'occupation', 'relationship'];
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_TOKEN_EXPIRY_SEC = 10 * 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_REGEX = /^(?:\+?\d[\d\s-]{7,}\d)$/;
let emailTransporter = null;
let twilioClient = null;

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const rawCookie = req.headers.cookie || '';
  if (!rawCookie) return null;

  const parsed = rawCookie.split(';').map((entry) => entry.trim());
  const cookiePair = parsed.find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!cookiePair) return null;

  return decodeURIComponent(cookiePair.slice(`${AUTH_COOKIE_NAME}=`.length));
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/'
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
}

function buildPublicProfile(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    dob: user.dob,
    gender: user.gender,
    mobile: user.mobile,
    email: user.email,
    city: user.city,
    occupation: user.occupation,
    relationship: user.relationship
  };
}

async function getAuthenticatedUser(req, res, select = '') {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ authenticated: false, message: 'Not authenticated' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const query = User.findById(decoded.userId);
    const user = select ? await query.select(select) : await query;

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ authenticated: false, message: 'User not found' });
      return null;
    }

    return user;
  } catch (error) {
    clearAuthCookie(res);
    res.status(401).json({ authenticated: false, message: 'Invalid or expired session' });
    return null;
  }
}

function normalizeChannel(channel) {
  if (!channel) return null;
  const normalized = String(channel).trim().toLowerCase();
  return normalized === 'email' || normalized === 'mobile' ? normalized : null;
}

function normalizeIdentifier(channel, identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return '';
  return channel === 'email' ? raw.toLowerCase() : raw;
}

function isValidIdentifier(channel, identifier) {
  if (channel === 'email') return EMAIL_REGEX.test(identifier);
  if (channel === 'mobile') return PHONE_REGEX.test(identifier);
  return false;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskIdentifier(channel, identifier) {
  if (channel === 'email') {
    const [name, domain] = identifier.split('@');
    if (!name || !domain) return identifier;
    const maskedName = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`;
    return `${maskedName}@${domain}`;
  }

  const compact = identifier.replace(/\s+/g, '');
  if (compact.length <= 4) return `***${compact}`;
  return `${compact.slice(0, 2)}***${compact.slice(-2)}`;
}

function createConfigError(message) {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
}

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) return null;

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return emailTransporter;
}

async function sendOtpByEmail(destination, code) {
  const transporter = getEmailTransporter();
  if (!transporter) return false;

  const from = process.env.OTP_EMAIL_FROM || process.env.SMTP_USER;
  if (!from) {
    throw createConfigError('Email OTP sender is not configured');
  }

  await transporter.sendMail({
    from,
    to: destination,
    subject: 'MindCare AI Password Reset OTP',
    text: `Your MindCare AI OTP is ${code}. It will expire in 10 minutes.`,
    html: `<p>Your MindCare AI OTP is <strong>${code}</strong>.</p><p>It will expire in 10 minutes.</p>`
  });

  return true;
}

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

async function sendOtpBySms(destination, code) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) return false;

  await client.messages.create({
    to: destination,
    from,
    body: `Your MindCare AI OTP is ${code}. It expires in 10 minutes.`
  });

  return true;
}

async function postOtpWebhook(url, payload) {
  if (!url) return false;
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in current runtime');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OTP webhook failed with status ${response.status}`);
  }

  return true;
}

async function dispatchOtp(channel, destination, code) {
  const isProduction = process.env.NODE_ENV === 'production';
  const payload = {
    channel,
    destination,
    code,
    purpose: 'password-reset'
  };

  const webhookUrl = channel === 'email'
    ? process.env.OTP_EMAIL_WEBHOOK_URL
    : process.env.OTP_SMS_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await postOtpWebhook(webhookUrl, payload);
      return 'webhook';
    } catch (error) {
      if (isProduction) throw error;
      console.warn(`OTP webhook failed for ${channel}. Falling back to development mode.`, error.message);
    }
  }

  if (channel === 'email') {
    const sentByEmail = await sendOtpByEmail(destination, code);
    if (sentByEmail) return 'smtp';
    if (!isProduction) {
      console.log(`[OTP-DEV] Password reset OTP for email:${destination} is ${code}`);
      return 'dev-log';
    }
    throw createConfigError(
      'Email OTP provider is not configured. Set OTP_EMAIL_WEBHOOK_URL or SMTP_HOST/SMTP_USER/SMTP_PASS.'
    );
  }

  if (channel === 'mobile') {
    const sentBySms = await sendOtpBySms(destination, code);
    if (sentBySms) return 'twilio';
    if (!isProduction) {
      console.log(`[OTP-DEV] Password reset OTP for mobile:${destination} is ${code}`);
      return 'dev-log';
    }
    throw createConfigError(
      'SMS OTP provider is not configured. Set OTP_SMS_WEBHOOK_URL or TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER.'
    );
  }

  throw createConfigError('Unsupported OTP channel');
}

exports.register = async (req, res) => {
  try {
    const { 
      firstName, lastName, dob, gender, mobile, email, 
      city, occupation, relationship, mental, mentalText, password 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      dob,
      gender,
      mobile,
      email,
      city,
      occupation,
      relationship,
      mental,
      mentalText: mentalText || 'None', // Default value if somehow empty
      password: hashedPassword
    });

    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    // Handle mongoose validation errors gracefully
    if (error.name === 'ValidationError') {
       const messages = Object.values(error.errors).map(val => val.message);
       return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    // Find user by email or mobile
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { mobile: identifier }] 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verify = async (req, res) => {
  const user = await getAuthenticatedUser(req, res, 'firstName lastName email');
  if (!user) return;

  return res.json({
    authenticated: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  });
};

exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const channel = normalizeChannel(req.body && req.body.channel);
    const identifier = normalizeIdentifier(channel, req.body && req.body.identifier);

    if (!channel || !identifier) {
      return res.status(400).json({ message: 'Channel and identifier are required' });
    }

    if (!isValidIdentifier(channel, identifier)) {
      return res.status(400).json({ message: `Enter a valid ${channel === 'email' ? 'email' : 'mobile number'}` });
    }

    const query = channel === 'email' ? { email: identifier } : { mobile: identifier };
    const user = await User.findOne(query).select('_id email mobile');
    if (!user) {
      return res.status(404).json({ message: `No account found with this ${channel}` });
    }

    const otpCode = generateOtp();
    const otpDoc = new PasswordResetOtp({
      userId: user._id,
      channel,
      destination: identifier,
      otpHash: hashOtp(otpCode),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS)
    });

    await otpDoc.save();
    let deliveryProvider = null;
    try {
      deliveryProvider = await dispatchOtp(channel, identifier, otpCode);
    } catch (dispatchError) {
      await PasswordResetOtp.deleteOne({ _id: otpDoc._id });
      throw dispatchError;
    }

    return res.json({
      message: `OTP sent to your ${channel}.`,
      channel,
      destination: maskIdentifier(channel, identifier),
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
      ...(process.env.NODE_ENV === 'production' ? {} : { debugOtp: otpCode, deliveryProvider })
    });
  } catch (error) {
    console.error('Request password reset OTP error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const channel = normalizeChannel(req.body && req.body.channel);
    const identifier = normalizeIdentifier(channel, req.body && req.body.identifier);
    const otp = String((req.body && req.body.otp) || '').trim();

    if (!channel || !identifier || !otp) {
      return res.status(400).json({ message: 'Channel, identifier and OTP are required' });
    }

    const userQuery = channel === 'email' ? { email: identifier } : { mobile: identifier };
    const user = await User.findOne(userQuery).select('_id');
    if (!user) {
      return res.status(404).json({ message: `No account found with this ${channel}` });
    }

    const otpDoc = await PasswordResetOtp.findOne({
      userId: user._id,
      channel,
      destination: identifier,
      consumed: false
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: 'No OTP request found. Please request OTP again.' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many invalid OTP attempts. Please request a new OTP.' });
    }

    const receivedHash = hashOtp(otp);
    if (receivedHash !== otpDoc.otpHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpDoc.verifiedAt = new Date();
    await otpDoc.save();

    const resetToken = jwt.sign(
      {
        action: 'password-reset',
        userId: String(user._id),
        otpId: String(otpDoc._id)
      },
      JWT_SECRET,
      { expiresIn: PASSWORD_RESET_TOKEN_EXPIRY_SEC }
    );

    return res.json({
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetForgotPassword = async (req, res) => {
  try {
    const resetToken = String((req.body && req.body.resetToken) || '').trim();
    const newPassword = String((req.body && req.body.newPassword) || '');
    const confirmPassword = String((req.body && req.body.confirmPassword) || '');

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Reset token, new password and confirm password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (!decoded || decoded.action !== 'password-reset' || !decoded.userId || !decoded.otpId) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const otpDoc = await PasswordResetOtp.findOne({
      _id: decoded.otpId,
      userId: decoded.userId,
      consumed: false
    });

    if (!otpDoc || !otpDoc.verifiedAt) {
      return res.status(400).json({ message: 'OTP verification is required before resetting password' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP session has expired. Please request a new OTP.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    otpDoc.consumed = true;
    otpDoc.consumedAt = new Date();
    await otpDoc.save();

    return res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Reset forgot password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  const user = await getAuthenticatedUser(req, res, PROFILE_FIELDS.join(' '));
  if (!user) return;

  return res.json({
    user: buildPublicProfile(user)
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = String(req.body[field] ?? '').trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided' });
    }

    const requiredFieldLabels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      mobile: 'Mobile Number',
      email: 'Email',
      city: 'City',
      occupation: 'Occupation',
      relationship: 'Relationship Status'
    };

    for (const field of PROFILE_FIELDS) {
      const value = updates[field] !== undefined ? updates[field] : user[field];
      if (!value) {
        return res.status(400).json({ message: `${requiredFieldLabels[field]} is required` });
      }
    }

    if (updates.email && updates.email !== user.email) {
      const existingEmail = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    if (updates.mobile && updates.mobile !== user.mobile) {
      const existingMobile = await User.findOne({ mobile: updates.mobile, _id: { $ne: user._id } });
      if (existingMobile) {
        return res.status(400).json({ message: 'User with this mobile already exists' });
      }
    }

    Object.assign(user, updates);
    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: buildPublicProfile(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password and confirm password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const reason = String((req.body && req.body.reason) || '').trim();
    const confirmed = Boolean(req.body && req.body.confirmed);
    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for deleting your account' });
    }
    if (!confirmed) {
      return res.status(400).json({ message: 'Please confirm account deletion' });
    }

    const userId = user._id;
    const feedback = new Feedback({
      userId,
      email: user.email,
      reason,
      confirmed
    });
    await feedback.save();

    await User.deleteOne({ _id: userId });
    clearAuthCookie(res);

    console.log(`Account deleted for user ${userId}. Reason: ${reason}`);
    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out successfully' });
};
