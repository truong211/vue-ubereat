# Social Authentication Integration

## Overview

This document describes the comprehensive social authentication and customer profile management features implemented in the Vue UberEat application.

## Features Implemented

### 🔐 Social Login Integration
- **Google OAuth 2.0** authentication
- **Facebook Login** integration  
- Seamless login/registration flow
- Token-based authentication with JWT
- Refresh token support for session management

### 👤 Customer Profile Management
- Comprehensive profile management interface
- Social account linking/unlinking
- Personal information updates
- Address management
- Order history tracking
- Account settings and privacy controls

### 🔄 Authentication Flow
- Traditional email/password login
- Social login as alternative
- Automatic account creation for new social users
- Account linking for existing users
- Secure token management

## Technical Implementation

### Backend Components

#### Routes (`backend/src/routes/auth.routes.js`)
```javascript
// Social login endpoints
POST /api/auth/login/google
POST /api/auth/login/facebook

// Social account management
POST /api/auth/link/:provider
POST /api/auth/unlink/:provider
GET /api/auth/linked-accounts
```

#### Controllers (`backend/src/controllers/auth.controller.js`)
- `googleLogin()` - Handle Google OAuth authentication
- `facebookLogin()` - Handle Facebook authentication
- `linkSocialAccount()` - Link social account to existing user
- `unlinkSocialAccount()` - Remove social account link
- `getLinkedAccounts()` - Get user's linked social accounts

#### Services (`backend/src/services/social-auth.service.js`)
- Token verification for Google and Facebook
- User creation and management
- Social account linking logic

### Frontend Components

#### Services (`frontend/src/services/social-auth.js`)
- `initSocialAuth()` - Initialize Google and Facebook SDKs
- `signInWithGoogle()` - Handle Google sign-in flow
- `signInWithFacebook()` - Handle Facebook sign-in flow
- `loginWithSocial()` - Complete social authentication
- `linkSocialAccount()` - Link social account to profile
- `unlinkSocialAccount()` - Remove social account link

#### Vue Components
- **Login.vue** - Enhanced with social login buttons
- **Register.vue** - Social registration options
- **SocialCallback.vue** - Handle OAuth redirects
- **UserProfileManager.vue** - Comprehensive profile management
- **SocialAccounts.vue** - Social account management interface

#### Store (`frontend/src/store/modules/auth.js`)
- Enhanced authentication state management
- Social login actions
- Token management
- User profile updates

## Setup Instructions

### 1. Backend Configuration

#### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/auth/facebook/callback` (development)
   - `https://yourdomain.com/auth/facebook/callback` (production)

### 2. Frontend Configuration

#### Environment Variables
Update `frontend/.env.local`:

```bash
# Social Login Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

#### Dependencies
The following packages are already included:
- `axios` - HTTP client
- `vue-router` - Navigation
- `vuex` - State management
- `vuetify` - UI components

## Usage Examples

### Basic Social Login

```javascript
// In a Vue component
import { loginWithSocial } from '@/services/social-auth';

// Google login
const handleGoogleLogin = async () => {
  try {
    const result = await loginWithSocial('google');
    // User is now authenticated
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Facebook login
const handleFacebookLogin = async () => {
  try {
    const result = await loginWithSocial('facebook');
    // User is now authenticated
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Social Account Management

```javascript
// Link a social account
import { linkSocialAccount } from '@/services/social-auth';

const linkGoogle = async () => {
  try {
    await linkSocialAccount('google');
    console.log('Google account linked successfully');
  } catch (error) {
    console.error('Failed to link account:', error);
  }
};

// Unlink a social account
import { unlinkSocialAccount } from '@/services/social-auth';

const unlinkGoogle = async () => {
  try {
    await unlinkSocialAccount('google');
    console.log('Google account unlinked successfully');
  } catch (error) {
    console.error('Failed to unlink account:', error);
  }
};
```

### Store Integration

```javascript
// Using Vuex store
import { useStore } from 'vuex';

const store = useStore();

// Social login through store
await store.dispatch('auth/loginWithSocial', {
  provider: 'google',
  accessToken: token
});

// Check authentication status
const isAuthenticated = store.getters['auth/isAuthenticated'];
const user = store.getters['auth/user'];
```

## Security Features

### 🛡️ Authentication Security
- JWT tokens with expiration
- Refresh token rotation
- Secure cookie storage (production)
- CSRF protection

### 🔐 OAuth Security
- Token verification with provider APIs
- Secure state parameter handling
- Scope limitation (profile, email only)
- Provider token validation

### 🚫 Error Handling
- Comprehensive error messages
- Graceful fallback to regular login
- Network error handling
- Invalid token detection

## API Endpoints

### Authentication
```http
POST /api/auth/login/google
Content-Type: application/json

{
  "idToken": "google_id_token"
}
```

```http
POST /api/auth/login/facebook
Content-Type: application/json

{
  "accessToken": "facebook_access_token"
}
```

### Social Account Management
```http
POST /api/auth/link/google
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "idToken": "google_id_token"
}
```

```http
GET /api/auth/linked-accounts
Authorization: Bearer jwt_token
```

## Customer Profile Features

### 📝 Personal Information
- Full name editing
- Profile picture upload
- Contact information updates
- Email verification status

### 🏠 Address Management
- Multiple delivery addresses
- Address validation
- Default address selection
- Location-based services

### 📱 Social Accounts
- View linked social accounts
- Link new social accounts
- Unlink existing accounts
- Account status indicators

### ⚙️ Account Settings
- Password change
- Email preferences
- Privacy settings
- Two-factor authentication
- Account deactivation

### 📦 Order History
- Past order tracking
- Order details view
- Reorder functionality
- Order status updates

## Testing

A test page is available at `/test-social-auth.html` to verify:
- Backend route accessibility
- Social auth service functionality
- Authentication flows
- Profile management features

## Troubleshooting

### Common Issues

1. **"Google SDK not loaded"**
   - Check internet connection
   - Verify Google Client ID
   - Ensure proper domain configuration

2. **"Facebook SDK not loaded"**
   - Check Facebook App ID
   - Verify domain is whitelisted
   - Check app review status

3. **"Invalid token" errors**
   - Verify OAuth credentials
   - Check token expiration
   - Ensure proper scope permissions

4. **CORS errors**
   - Configure backend CORS settings
   - Add frontend domain to allowed origins
   - Check OAuth redirect URIs

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Production Deployment

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Configure secure cookies
- [ ] Set proper CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Configure CSP headers

### Performance
- Social SDK loading is optimized
- Lazy loading for profile components
- Efficient token management
- Minimal API calls

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify OAuth provider configuration
4. Test with the provided test page

## License

This implementation is part of the Vue UberEat project and follows the same licensing terms.