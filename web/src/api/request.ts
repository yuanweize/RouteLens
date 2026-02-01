import axios from 'axios';
import { message } from 'antd';

const instance = axios.create({
  baseURL: '/',
  timeout: 15000,
});

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

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else {
      message.error(error.response?.data?.error || 'Network Error');
    }
    return Promise.reject(error);
  }
);

const request = {
  get: <T = any>(url: string, config?: any) => instance.get<T, T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => instance.post<T, T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => instance.put<T, T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => instance.delete<T, T>(url, config),
};

export default request;
