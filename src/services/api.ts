import axios from 'axios';
import { auth } from '../../lib/firebase'; // Adjust path if needed

// Development URL vs Production URL
// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/fudaydiye-commerce/us-central1/api';
// Using the standard emulator/cloud functions URL pattern for now
const BASE_URL = 'http://localhost:5001/fudaydiye-commerce/us-central1/api';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Firebase Token
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            // Force refresh if token is expiring? passing true forces refresh.
            // Usually standard getIdToken() is fine, it caches.
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check for 401/403
        if (error.response && [401, 403].includes(error.response.status)) {
            console.warn('API Permission Error:', error.response.data);
            // Optional: Trigger logout or transparent token refresh if needed
        }
        return Promise.reject(error);
    }
);
