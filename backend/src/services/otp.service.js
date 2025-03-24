const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const config = require('../config/config');

// OTP configuration
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const OTP_LENGTH = 6;

// Create a transport for sending emails
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

/**
 * Generate a numeric OTP of specified length
 */
const generateOTP = (length = OTP_LENGTH) => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

/**
 * Generate OTP and save to user record
 */
const createOTP = async (userId, type = 'email') => {
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY);
  
  // Get the field names based on type
  let tokenField, expiryField;
  
  if (type === 'email') {
    tokenField = 'emailVerificationOtp';
    expiryField = 'emailVerificationExpires';
  } else if (type === 'phone') {
    tokenField = 'phoneVerificationOtp';
    expiryField = 'phoneVerificationExpires';
  } else if (type === 'password') {
    tokenField = 'resetPasswordOtp';
    expiryField = 'resetPasswordExpires';
  } else {
    throw new AppError('Invalid OTP type', 400);
  }
  
  // Update the user with the new OTP
  await User.update(
    {
      [tokenField]: otp,
      [expiryField]: otpExpiry
    },
    { where: { id: userId } }
  );
  
  return otp;
};

/**
 * Send OTP via email
 */
const sendOTPEmail = async (email, otp, name, type = 'verification') => {
  let subject, text, html;
  
  if (type === 'verification') {
    subject = 'Email Verification OTP';
    text = `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nRegards,\nThe UberEats Team`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>Regards,<br>The UberEats Team</p>
      </div>
    `;
  } else if (type === 'password-reset') {
    subject = 'Password Reset OTP';
    text = `Hello ${name},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nRegards,\nThe UberEats Team`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hello ${name},</p>
        <p>Your password reset code is:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>Regards,<br>The UberEats Team</p>
      </div>
    `;
  }
  
  const mailOptions = {
    from: `"UberEats" <${config.email.user}>`,
    to: email,
    subject,
    text,
    html
  };
  
  return await transporter.sendMail(mailOptions);
};

/**
 * Send OTP via SMS (stub - implement with your SMS provider)
 */
const sendOTPSMS = async (phone, otp) => {
  // This is a stub. Implement with your SMS provider like Twilio, Nexmo, etc.
  // For demo purposes, we'll just log it
  console.log(`Sending OTP ${otp} to ${phone}`);
  
  // Return a mock success response
  return {
    success: true,
    messageId: 'mock-sms-' + Date.now()
  };
};

/**
 * Verify OTP against stored value
 */
const verifyOTP = async (userId, otp, type = 'email') => {
  // Get the field names based on type
  let tokenField, expiryField, verifiedField;
  
  if (type === 'email') {
    tokenField = 'emailVerificationOtp';
    expiryField = 'emailVerificationExpires';
    verifiedField = 'isEmailVerified';
  } else if (type === 'phone') {
    tokenField = 'phoneVerificationOtp';
    expiryField = 'phoneVerificationExpires';
    verifiedField = 'isPhoneVerified';
  } else if (type === 'password') {
    tokenField = 'resetPasswordOtp';
    expiryField = 'resetPasswordExpires';
    verifiedField = null; // Not updating a verification status for password reset
  } else {
    throw new AppError('Invalid OTP type', 400);
  }
  
  // Find the user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if OTP matches
  if (user[tokenField] !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  
  // Check if OTP has expired
  if (new Date() > new Date(user[expiryField])) {
    throw new AppError('OTP has expired', 400);
  }
  
  // If this is a verification OTP, mark the verification field as true
  if (verifiedField) {
    await user.update({
      [verifiedField]: true,
      [tokenField]: null,
      [expiryField]: null
    });
  } else {
    // Just clear the OTP fields for password reset (verification happens in resetPassword)
    await user.update({
      [tokenField]: null,
      [expiryField]: null
    });
  }
  
  return true;
};

module.exports = {
  generateOTP,
  createOTP,
  sendOTPEmail,
  sendOTPSMS,
  verifyOTP
}; 