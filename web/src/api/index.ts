import request from './request';

export const login = (password: string) => {
    return request.post<{ token: string }>('/login', { password });
};

export const getStatus = () => {
    return request.get('/api/v1/status');
};

export const getHistory = (params: { target?: string; start?: string; end?: string }) => {
    return request.get('/api/v1/history', { params });
};

export const triggerProbe = () => {
    return request.post('/api/v1/probe');
};
