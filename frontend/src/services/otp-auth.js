import { getAuth, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier } from 'firebase/auth';
import axios from 'axios';

const auth = getAuth();
const API_URL = '/api/auth';

export default {
  async sendEmailOTP(email) {
    try {
      const response = await axios.post(`${API_URL}/email/send-otp`, { email });
      return response.data.verificationId;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  async verifyEmailOTP(verificationId, otp) {
    try {
      const response = await axios.post(`${API_URL}/email/verify-otp`, {
        verificationId,
        otp
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      throw new Error(error.response?.data?.message || 'Invalid OTP');
    }
  },

  async sendPhoneOTP(phoneNumber, recaptchaToken = null) {
    try {
      // Check if we should use Firebase or custom implementation
      if (import.meta.env.VITE_USE_FIREBASE === 'true') {
        // Initialize recaptcha if not done already
        if (!window.recaptchaVerifier) {
          this.initRecaptcha();
        }
        
        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(
          phoneNumber,
          window.recaptchaVerifier
        );
        return { verificationId, provider: 'firebase' };
      } else {
        // Use our custom backend implementation
        const response = await axios.post(`${API_URL}/sms/send-otp`, { 
          phone: phoneNumber,
          recaptchaToken: recaptchaToken
        });
        return { 
          verificationId: response.data.verificationId,
          provider: 'custom',
          expiresAt: response.data.expiresAt 
        };
      }
    } catch (error) {
      console.error('Error sending phone OTP:', error);
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later');
      } else if (error.response?.data?.error === 'recaptcha_failed') {
        throw new Error('reCAPTCHA verification failed. Please try again');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to send OTP');
      }
    }
  },

  async verifyPhoneOTP(verificationId, otp, provider = 'custom') {
    try {
      // Check if we should use Firebase or custom implementation
      if (provider === 'firebase' || import.meta.env.VITE_USE_FIREBASE === 'true') {
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        const result = await signInWithCredential(auth, credential);
        return {
          user: {
            phoneNumber: result.user.phoneNumber,
            uid: result.user.uid
          },
          verified: true
        };
      } else {
        // Use our custom backend implementation
        const response = await axios.post(`${API_URL}/sms/verify-otp`, {
          verificationId,
          otp
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error verifying phone OTP:', error);
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('The OTP you entered is incorrect');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('The OTP has expired. Please request a new one');
      } else {
        throw new Error(error.response?.data?.message || 'Invalid OTP');
      }
    }
  },

  // Used for email verification during registration
  async verifyRegistrationOTP(email, otp) {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp,
        type: 'registration'
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying registration OTP:', error);
      throw new Error(error.response?.data?.message || 'Invalid OTP');
    }
  },

  // Used to send both email and SMS OTP simultaneously
  async sendDualOTP(email, phone) {
    try {
      const response = await axios.post(`${API_URL}/dual/send-otp`, { email, phone });
      return response.data;
    } catch (error) {
      console.error('Error sending dual OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send OTPs');
    }
  },

  // Used to verify both email and SMS OTP simultaneously
  async verifyDualOTP(emailVerificationId, emailOTP, phoneVerificationId, phoneOTP) {
    try {
      const response = await axios.post(`${API_URL}/dual/verify-otp`, {
        emailVerificationId,
        emailOTP,
        phoneVerificationId,
        phoneOTP
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying dual OTP:', error);
      throw new Error(error.response?.data?.message || 'Invalid OTP');
    }
  },

  // Request password reset via OTP
  async requestPasswordResetOTP(email) {
    try {
      const response = await axios.post(`${API_URL}/password/request-otp`, { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send password reset OTP');
    }
  },

  // Verify password reset OTP and reset password
  async resetPasswordWithOTP(email, otp, newPassword) {
    try {
      const response = await axios.post(`${API_URL}/password/reset-with-otp`, {
        email,
        otp,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password with OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },

  // Send login OTP (can be used for passwordless login)
  async sendLoginOTP(email) {
    try {
      const response = await axios.post(`${API_URL}/login/send-otp`, { email });
      return response.data;
    } catch (error) {
      console.error('Error sending login OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send login OTP');
    }
  },

  // Verify login OTP (passwordless login)
  async verifyLoginOTP(email, otp) {
    try {
      const response = await axios.post(`${API_URL}/login/verify-otp`, {
        email,
        otp
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying login OTP:', error);
      throw new Error(error.response?.data?.message || 'Invalid login OTP');
    }
  },

  // Verify phone number for account
  async verifyPhoneForAccount(phoneNumber, otp, verificationId) {
    try {
      const response = await axios.post(`${API_URL}/account/verify-phone`, {
        phone: phoneNumber,
        otp,
        verificationId
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying phone for account:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify phone number');
    }
  },

  // Send OTP to verify account changes
  async sendAccountChangeOTP(type = 'email', destination) {
    try {
      const response = await axios.post(`${API_URL}/account/send-change-otp`, {
        type,
        destination // email or phone
      });
      return response.data;
    } catch (error) {
      console.error('Error sending account change OTP:', error);
      throw new Error(error.response?.data?.message || 'Failed to send verification code');
    }
  },

  // Verify OTP for account changes
  async verifyAccountChangeOTP(type = 'email', destination, otp, verificationId) {
    try {
      const response = await axios.post(`${API_URL}/account/verify-change-otp`, {
        type,
        destination,
        otp,
        verificationId
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying account change OTP:', error);
      throw new Error(error.response?.data?.message || 'Invalid verification code');
    }
  },

  initRecaptcha() {
    if (!document.getElementById('recaptcha-container')) {
      const container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log('reCAPTCHA verified');
      }
    }, auth);
  },

  // Get reCAPTCHA token for phone verification
  async getRecaptchaToken() {
    try {
      if (!window.recaptchaVerifier) {
        this.initRecaptcha();
      }
      
      return await window.recaptchaVerifier.verify();
    } catch (error) {
      console.error('Error getting reCAPTCHA token:', error);
      throw new Error('Failed to verify reCAPTCHA');
    }
  }
};