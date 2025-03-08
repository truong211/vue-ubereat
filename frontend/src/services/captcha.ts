/// <reference types="vite/client" />

import axios from 'axios';

interface CaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  error?: string;
}

class CaptchaService {
  private siteKey: string;
  private baseURL: string;

  constructor() {
    this.siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    this.baseURL = `${import.meta.env.VITE_API_URL}/auth/captcha`;
  }

  /**
   * Initialize reCAPTCHA
   */
  async loadRecaptcha(): Promise<void> {
    if (!(window as any).grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      document.head.appendChild(script);

      return new Promise((resolve) => {
        script.onload = () => resolve();
      });
    }
  }

  /**
   * Execute reCAPTCHA verification
   */
  async verify(action: string): Promise<string> {
    await this.loadRecaptcha();
    const token = await (window as any).grecaptcha.execute(this.siteKey, { action });
    return token;
  }

  /**
   * Validate reCAPTCHA token on server
   */
  async validateToken(token: string, action: string): Promise<CaptchaResponse> {
    try {
      const response = await axios.post<CaptchaResponse>(
        `${this.baseURL}/verify`,
        { token, action }
      );
      return response.data;
    } catch (error) {
      console.error('reCAPTCHA validation error:', error);
      throw error;
    }
  }
}

export const captchaService = new CaptchaService();