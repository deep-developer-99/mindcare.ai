const Newsletter = require('../models/Newsletter');

exports.subscribe = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required' });
    }

    // Check if email already exists
    let existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ success: false, message: 'You are already subscribed to our newsletter!' });
    }

    // Save new subscriber
    const newSubscriber = new Newsletter({ name, email });
    await newSubscriber.save();

    res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Newsletter Subscription Error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};
