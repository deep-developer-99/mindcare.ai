const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password/request', authController.requestPasswordResetOtp);
router.post('/forgot-password/verify', authController.verifyPasswordResetOtp);
router.post('/forgot-password/reset', authController.resetForgotPassword);
router.get('/verify', authController.verify);
router.get('/me', authController.getProfile);
router.put('/me', authController.updateProfile);
router.delete('/me', authController.deleteAccount);
router.put('/password', authController.updatePassword);
router.post('/logout', authController.logout);

module.exports = router;
