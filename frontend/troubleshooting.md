# Frontend Troubleshooting Guide

## Authentication Issues

### Problem: Still showing as "guest" after login

If the server logs show "Customer connected: guest" even after you've logged in, there are several potential causes:

1. **Token Storage Issues**:
   - Check that the JWT token is being properly stored after login
   - Verify LocalStorage or SessionStorage contains the token

2. **Token Transmission Issues**:
   - Ensure the token is being included in all API requests in the Authorization header
   - The header should be formatted as: `Authorization: Bearer YOUR_TOKEN_HERE`

3. **Token Expiration**:
   - The token may have expired
   - Implement proper token refresh logic in your frontend

4. **Socket Connection Issues**:
   - Socket.io connections need to be authenticated separately from API requests
   - Make sure your socket connection includes the authentication token
   - Example:
     ```javascript
     const socket = io('http://localhost:3000', {
       auth: {
         token: localStorage.getItem('token')
       }
     });
     ```

5. **Multiple Sessions**:
   - If you have multiple tabs or browsers open, you might be seeing logs from an unauthenticated session

### How to Fix

1. Check your auth service implementation to ensure tokens are properly stored and included in requests
2. Implement a global HTTP interceptor to include the token in all requests
3. Add proper error handling for 401 Unauthorized responses
4. Make sure your socket connection is properly authenticated
5. Implement token refresh logic to handle token expiration 