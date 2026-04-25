const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    confirmed: {
      type: Boolean,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'feedback'
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
