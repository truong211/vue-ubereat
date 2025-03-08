interface SocialAuthResponse {
  accessToken: string;
  refreshToken: string;
  provider: 'google' | 'facebook';
  profile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

interface SocialAuthConfig {
  clientId: string;
  scope: string[];
}

interface FacebookProfile {
  id: string;
  email: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

class SocialAuthService {
  private config: {
    google: SocialAuthConfig;
    facebook: SocialAuthConfig;
  };

  constructor() {
    this.config = {
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: ['email', 'profile']
      },
      facebook: {
        clientId: import.meta.env.VITE_FACEBOOK_APP_ID,
        scope: ['email', 'public_profile']
      }
    };
  }

  private async loadScript(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  private async initGoogle(): Promise<void> {
    await this.loadScript(
      'google-platform',
      'https://accounts.google.com/gsi/client'
    );
    return new Promise((resolve) => {
      window.google?.accounts.id.initialize({
        client_id: this.config.google.clientId,
        callback: this.handleGoogleResponse.bind(this)
      });
      resolve();
    });
  }

  private async initFacebook(): Promise<void> {
    await this.loadScript(
      'facebook-jssdk',
      'https://connect.facebook.net/en_US/sdk.js'
    );
    return new Promise((resolve) => {
      window.FB?.init({
        appId: this.config.facebook.clientId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve();
    });
  }

  async login(provider: 'google' | 'facebook'): Promise<SocialAuthResponse> {
    if (provider === 'google') {
      return this.loginWithGoogle();
    } else {
      return this.loginWithFacebook();
    }
  }

  private async loginWithGoogle(): Promise<SocialAuthResponse> {
    await this.initGoogle();
    return new Promise((resolve, reject) => {
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          reject(new Error('Google sign-in popup was blocked'));
        } else if (notification.isSkippedMoment()) {
          reject(new Error('User skipped Google sign-in'));
        }
        // Success is handled by the callback set in initGoogle
      });
    });
  }

  private async loginWithFacebook(): Promise<SocialAuthResponse> {
    await this.initFacebook();
    return new Promise((resolve, reject) => {
      window.FB?.login(
        async (response) => {
          if (response.authResponse) {
            const profile = await this.getFacebookProfile(response.authResponse.accessToken);
            resolve({
              accessToken: response.authResponse.accessToken,
              refreshToken: '', // Facebook doesn't provide refresh tokens
              provider: 'facebook',
              profile: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                picture: profile.picture?.data?.url
              }
            });
          } else {
            reject(new Error('Facebook login failed'));
          }
        },
        { scope: this.config.facebook.scope.join(',') }
      );
    });
  }

  private async getFacebookProfile(accessToken: string): Promise<FacebookProfile> {
    return new Promise((resolve, reject) => {
      window.FB?.api('/me', { fields: 'id,name,email,picture' }, (response: FacebookProfile | { error: any }) => {
        if ('error' in response) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  private handleGoogleResponse(response: any): SocialAuthResponse {
    const payload = this.decodeJWT(response.credential);
    return {
      accessToken: response.credential,
      refreshToken: '', // Google doesn't provide refresh tokens in client flow
      provider: 'google',
      profile: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
    };
  }

  private decodeJWT(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  async initSocialAuth(): Promise<void> {
    try {
      // Load Google SDK
      await this.loadScript(
        'google-platform',
        'https://accounts.google.com/gsi/client'
      );
      
      // Load Facebook SDK
      await this.loadScript(
        'facebook-jssdk',
        'https://connect.facebook.net/en_US/sdk.js'
      );

      // Initialize both SDKs
      await Promise.all([
        this.initGoogle(),
        this.initFacebook()
      ]);
    } catch (error) {
      console.error('Failed to initialize social auth:', error);
      // Non-blocking error - social login will attempt re-init when used
    }
  }
}

// Add type declarations for window object
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
        };
      };
    };
    FB?: {
      init: (config: any) => void;
      login: (callback: (response: any) => void, options: any) => void;
      api: (path: string, params: any, callback: (response: any) => void) => void;
    };
  }
}

export default new SocialAuthService();