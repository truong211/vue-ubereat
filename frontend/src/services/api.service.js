import axios from 'axios';
import router from '../router';
import adminService from './admin.service';
import adminApiService from './admin.api';
import { restaurantService } from './restaurant.service';

// Use a hardcoded baseURL for now
const baseURL = 'http://localhost:3000/api';

const apiService = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
apiService.interceptors.request.use(
    config => {
        // Remove the automatic /api prefix since it's already in baseURL
        config.url = config.url.startsWith('/') ? config.url : `/${config.url}`;
        
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiService.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login on unauthorized access
            localStorage.removeItem('token');
            router.push('/login');
        }
        return Promise.reject(error);
    }
);

// Create adminAPI object that combines both admin services
export const adminAPI = {
    ...adminService,
    ...adminApiService
};

// Export restaurant API for restaurant-related functionality
export const restaurantAPI = restaurantService;

export const apiClient = apiService;
export default apiService;