const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First Name is required'] },
  lastName: { type: String, required: [true, 'Last Name is required'] },
  dob: { type: String, required: [true, 'Date of Birth is required'] },
  gender: { type: String, required: [true, 'Gender is required'] },
  mobile: { type: String, required: [true, 'Mobile number is required'], unique: true },
  email: { type: String, required: [true, 'Email is required'], unique: true },
  city: { type: String, required: [true, 'City is required'] },
  occupation: { type: String, required: [true, 'Occupation is required'] },
  relationship: { type: String, required: [true, 'Relationship status is required'] },
  mental: { type: String, required: [true, 'Mental status is required'] },
  mentalText: { type: String, required: [true, 'Mental text details are required'] },
  password: { type: String, required: [true, 'Password is required'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
