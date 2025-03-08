/**
 * Social Authentication Service
 * Manages OAuth authentication flows for Google and Facebook
 */
import axios from 'axios';

// Configuration
const config = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scope: 'profile email'
  },
  facebook: {
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    redirectUri: `${window.location.origin}/auth/facebook/callback`,
    scope: 'public_profile,email'
  }
};

/**
 * Initialize social auth SDKs
 * @returns {Promise<void>} Promise that resolves when SDKs are loaded
 */
export const initSocialAuth = () => {
  return new Promise((resolve) => {
    // Initialize Google SDK
    window.onGoogleLibraryLoad = () => {
      console.log('Google SDK loaded');
    };

    // Load Google SDK
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    document.head.appendChild(googleScript);

    // Initialize Facebook SDK
    window.fbAsyncInit = () => {
      FB.init({
        appId: config.facebook.appId,
        cookie: true,
        xfbml: true,
        version: 'v17.0'
      });
      console.log('Facebook SDK loaded');
      resolve(); // Resolve the promise when Facebook SDK is loaded
    };

    // Load Facebook SDK
    const fbScript = document.createElement('script');
    fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScript.async = true;
    fbScript.defer = true;
    document.head.appendChild(fbScript);
    
    // Fallback resolution in case Facebook SDK fails to load
    setTimeout(() => {
      resolve();
    }, 5000);
  });
};

/**
 * Sign in with Google
 * @returns {Promise<Object>} User credentials
 */
export const signInWithGoogle = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.google) {
        return reject(new Error('Google SDK not loaded'));
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: config.google.clientId,
        scope: config.google.scope,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error));
          }

          // Get user info
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          })
            .then(response => response.json())
            .then(userInfo => {
              resolve({
                idToken: tokenResponse.access_token,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
              });
            })
            .catch(reject);
        }
      });

      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Sign in with Facebook
 * @returns {Promise<Object>} User credentials
 */
export const signInWithFacebook = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.FB) {
        return reject(new Error('Facebook SDK not loaded'));
      }

      FB.login((response) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;

          // Get user info
          FB.api('/me', { fields: 'id,name,email,picture' }, (userInfo) => {
            resolve({
              accessToken,
              userId: userID,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture?.data?.url
            });
          });
        } else {
          reject(new Error('Facebook login canceled'));
        }
      }, { scope: config.facebook.scope });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Complete social login by authenticating with backend
 * @param {string} provider - 'google' or 'facebook'
 * @param {Object} data - Provider data
 * @returns {Promise<Object>} Authentication result
 */
export const authenticateWithBackend = async (provider, data) => {
  try {
    const endpoint = provider === 'google' 
      ? '/api/auth/login/google' 
      : '/api/auth/login/facebook';
    
    const payload = provider === 'google'
      ? { idToken: data.idToken }
      : { accessToken: data.accessToken };
      
    const response = await axios.post(endpoint, payload);
    return response.data;
  } catch (error) {
    console.error(`Error authenticating with ${provider}:`, error);
    throw error;
  }
};

/**
 * One-step social login (convenience method)
 * @param {string} provider - 'google' or 'facebook'
 * @returns {Promise<Object>} Authentication result
 */
export const loginWithSocial = async (provider) => {
  try {
    let socialData;
    
    if (provider === 'google') {
      socialData = await signInWithGoogle();
    } else if (provider === 'facebook') {
      socialData = await signInWithFacebook();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    return await authenticateWithBackend(provider, socialData);
  } catch (error) {
    console.error(`Social login error (${provider}):`, error);
    throw error;
  }
};

/**
 * Handle social login callback from redirect (used in callback pages)
 * @param {string} provider - 'google' or 'facebook'
 * @param {string} code - Authorization code from provider redirect
 * @returns {Promise<Object>} Authentication result
 */
export const handleSocialCallback = async (provider, code) => {
  try {
    const response = await axios.post(`/api/auth/callback/${provider}`, { code });
    return response.data;
  } catch (error) {
    console.error(`Error handling ${provider} callback:`, error);
    throw error;
  }
};

/**
 * Link existing account with social provider
 * @param {string} provider - 'google' or 'facebook'
 * @returns {Promise<Object>} Link result
 */
export const linkSocialAccount = async (provider) => {
  try {
    let socialData;
    
    if (provider === 'google') {
      socialData = await signInWithGoogle();
    } else if (provider === 'facebook') {
      socialData = await signInWithFacebook();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    const response = await axios.post(`/api/auth/link/${provider}`, {
      idToken: socialData.idToken || null,
      accessToken: socialData.accessToken || null
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error linking ${provider} account:`, error);
    throw error;
  }
};

export default {
  initSocialAuth,
  signInWithGoogle,
  signInWithFacebook,
  authenticateWithBackend,
  loginWithSocial,
  handleSocialCallback,
  linkSocialAccount
};
