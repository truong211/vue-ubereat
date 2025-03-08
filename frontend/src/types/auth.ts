export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

export interface VerifyTokenResponse {
  valid: boolean;
  email: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'restaurant' | 'admin' | 'driver';
  avatar?: string;
  verified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  restaurantId?: number;
  driverId?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SocialAuthResponse {
  provider: 'google' | 'facebook';
  accessToken: string;
  profile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ValidationRules {
  required: (v: any) => boolean | string;
  email: (v: string) => boolean | string;
  password: (v: string) => boolean | string;
  phone?: (v: string) => boolean | string;
  passwordMatch: (password: string) => (v: string) => boolean | string;
  [key: string]: any;
}