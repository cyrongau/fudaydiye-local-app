import axios from 'axios';

// Base URL for Cloud Functions
// In production, this should be the deployed URL.
// In dev, use the emulator.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/fudaydiye-commerce/us-central1/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Interceptor for Auth Token if available
api.interceptors.request.use(async (config) => {
    // We can inject the token here later if we use Firebase Auth ID Tokens
    // for Guard protection on the backend.
    // import { auth } from './firebase'; 
    // const token = await auth.currentUser?.getIdToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
