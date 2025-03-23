const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for verification, password reset, and notifications
 */
class EmailService {
  constructor() {
    // Create a test account if no credentials are provided
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'email@example.com',
        pass: process.env.EMAIL_PASS || 'password'
      }
    });

    this.from = process.env.EMAIL_FROM || 'Uber Eats Clone <noreply@example.com>';
  }

  /**
   * Send verification email
   * @param {string} to - Recipient email
   * @param {string} verificationToken - Verification token
   * @param {string} name - Recipient name
   */
  async sendVerificationEmail(to, verificationToken, name) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Please verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Thank you for signing up for Uber Eats Clone. To complete your registration, please verify your email address.</p>
          <p>
            <a href="${verificationLink}" style="background-color: #5cb85c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Verify Email
            </a>
          </p>
          <p>If the button above doesn't work, copy and paste the following link in your browser:</p>
          <p>${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't sign up for an account, please ignore this email.</p>
          <p>Thanks,<br>The Uber Eats Clone Team</p>
        </div>
      `
    });
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetToken - Reset token
   * @param {string} name - Recipient name
   */
  async sendPasswordResetEmail(to, resetToken, name) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p>
            <a href="${resetLink}" style="background-color: #5bc0de; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
          </p>
          <p>If the button above doesn't work, copy and paste the following link in your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Thanks,<br>The Uber Eats Clone Team</p>
        </div>
      `
    });
  }

  /**
   * Send order confirmation email
   * @param {string} to - Recipient email
   * @param {Object} order - Order details
   */
  async sendOrderConfirmation(to, order) {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your order!</h2>
          <p>Your order #${order.orderNumber} has been received and is being processed.</p>
          <p>We'll notify you when your order has been prepared and is out for delivery.</p>
          <p>Thanks,<br>The Uber Eats Clone Team</p>
        </div>
      `
    });
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} password - User password
   * @param {string} fullName - Recipient full name
   */
  async sendWelcomeEmail(email, password, fullName) {
    try {
      const subject = 'Chào mừng đến với UberEat';
      const html = `
        <h1>Xin chào ${fullName},</h1>
        <p>Tài khoản của bạn đã được tạo thành công bởi quản trị viên.</p>
        <p>Thông tin đăng nhập của bạn:</p>
        <ul>
          <li>Email: ${email}</li>
          <li>Mật khẩu: ${password}</li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu của bạn để đảm bảo an toàn.</p>
        <p>Trân trọng,<br/>Đội ngũ UberEat</p>
      `;

      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send account suspension email
   * @param {string} email - Recipient email
   * @param {string} reason - Suspension reason
   */
  async sendAccountSuspensionEmail(email, reason) {
    try {
      const subject = 'Tài khoản của bạn đã bị tạm khóa';
      const html = `
        <h1>Thông báo tạm khóa tài khoản</h1>
        <p>Tài khoản của bạn đã bị tạm khóa vì lý do sau:</p>
        <p>${reason}</p>
        <p>Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
        <p>Trân trọng,<br/>Đội ngũ UberEat</p>
      `;

      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending suspension email:', error);
      throw new Error('Failed to send suspension email');
    }
  }
}

module.exports = new EmailService();