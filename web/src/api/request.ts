import axios from 'axios';
import { Message } from '@arco-design/web-react';

const instance = axios.create({
    baseURL: '/', // Proxy handles the rest
    timeout: 10000,
});

// Request Interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Simple redirect
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else {
            Message.error(error.response?.data?.error || 'Network Error');
        }
        return Promise.reject(error);
    }
);

export default instance;
