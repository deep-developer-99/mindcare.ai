const express = require('express');
const router = express.Router();

// Track assistant opens for analytics/logging
router.post('/open/:assistantKey', async (req, res) => {
  try {
    const { assistantKey } = req.params;

    // Validate assistant key
    const validAssistants = ['jarvis', 'nutrimate'];
    if (!validAssistants.includes(assistantKey.toLowerCase())) {
      return res.status(400).json({
        message: 'Invalid assistant. Valid options are: ' + validAssistants.join(', ')
      });
    }

    // Log the assistant open event (can be used for analytics in future)
    console.log(`Assistant opened: ${assistantKey}`);

    return res.status(200).json({
      success: true,
      message: `${assistantKey} assistant opened`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error opening assistant:', error);
    return res.status(500).json({
      message: 'Failed to open assistant'
    });
  }
});

module.exports = router;
