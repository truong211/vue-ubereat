interface OTPRequest {
  userId: string;
  method: 'email' | 'sms';
}

interface OTPVerifyRequest extends OTPRequest {
  otp: string;
}

interface OTPResponse {
  success: boolean;
  message: string;
}

class OTPAuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${import.meta.env.VITE_API_URL}/auth/otp`;
  }

  async requestOTP(request: OTPRequest): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to send OTP');
    }

    return response.json();
  }

  async verify(request: OTPVerifyRequest): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Invalid OTP');
    }

    return response.json();
  }

  async resend(request: OTPRequest): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to resend OTP');
    }

    return response.json();
  }
}

export default new OTPAuthService();