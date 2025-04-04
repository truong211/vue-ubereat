// API Response Debugging Utility
// Copy this code to a temporary component or use in the browser console to debug API responses

// Function to debug restaurant API responses
async function debugRestaurantAPI() {
  try {
    console.group('Restaurant API Debug');
    
    // Create an axios instance that matches your app configuration
    const axios = window.axios || (await import('axios')).default;
    const API_URL = 'http://localhost:3000'; // Change to match your backend URL
    
    const apiClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add auth header if needed
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Test different restaurant API endpoints
    console.log('Testing restaurant API endpoints...');
    
    // 1. Test getAllRestaurants
    console.group('GET /api/restaurants');
    try {
      const response = await apiClient.get('/api/restaurants');
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      console.log('Response data structure:', getStructure(response.data));
      console.log('Full response data:', response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
    console.groupEnd();
    
    // 2. Test getFeaturedRestaurants
    console.group('GET /api/restaurants/featured');
    try {
      const response = await apiClient.get('/api/restaurants/featured', { params: { limit: 5 } });
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      console.log('Response data structure:', getStructure(response.data));
      console.log('Full response data:', response.data);
    } catch (error) {
      console.error('Error fetching featured restaurants:', error);
    }
    console.groupEnd();
    
    // 3. Test getNearbyRestaurants (if coordinates available)
    console.group('GET /api/restaurants/nearby');
    try {
      // Use a default location (New York City) if user location isn't available
      const lat = 40.7128;
      const lng = -74.0060;
      const response = await apiClient.get('/api/restaurants/nearby', { 
        params: { lat, lng, radius: 5, limit: 10 } 
      });
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      console.log('Response data structure:', getStructure(response.data));
      console.log('Full response data:', response.data);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
    }
    console.groupEnd();
    
    console.log('API debugging complete');
  } catch (error) {
    console.error('Debug process failed:', error);
  } finally {
    console.groupEnd();
  }
}

// Helper function to determine the structure of an object or array
function getStructure(data, depth = 1, maxDepth = 3) {
  if (depth > maxDepth) return '...';
  
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  
  const type = typeof data;
  
  if (type !== 'object') return type;
  
  if (Array.isArray(data)) {
    if (data.length === 0) return 'empty array';
    const sampleItem = data[0];
    return `array[${data.length}] of ${typeof sampleItem === 'object' ? 
      (depth < maxDepth ? getStructure(sampleItem, depth + 1, maxDepth) : '...') : 
      typeof sampleItem}`;
  }
  
  const keys = Object.keys(data);
  if (keys.length === 0) return 'empty object';
  
  const structure = {};
  keys.forEach(key => {
    structure[key] = getStructure(data[key], depth + 1, maxDepth);
  });
  
  return structure;
}

// Instructions to use this utility:
// 1. Copy this entire file to your clipboard
// 2. Open your browser developer tools (F12 or right-click > Inspect)
// 3. Go to the Console tab
// 4. Paste the code and press Enter
// 5. Type debugRestaurantAPI() and press Enter to run the debug utility
// 6. Examine the console output to understand your API response structure

// You can also save this as a file in your project and import it when needed:
// import { debugRestaurantAPI } from './api_debug.js';
// Then call debugRestaurantAPI() where needed

// To run the debug utility now, uncomment the next line:
// debugRestaurantAPI(); 