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

export interface Target {
    ID?: number;
    Name: string;
    Address: string;
    Desc: string;
    Enabled: boolean;
}

export const getTargets = () => {
    return request.get<Target[]>('/api/v1/targets');
};

export const saveTarget = (target: Target) => {
    return request.post<Target>('/api/v1/targets', target);
};

export const deleteTarget = (id: number) => {
    return request.delete(`/api/v1/targets/${id}`);
};
