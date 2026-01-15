import { api } from '../api';
import { UserProfileInput } from '../schemas/user';

export const userService = {
    async getProfile(uid: string) {
        const response = await api.get(`/users/${uid}`);
        return response.data;
    },

    async updateProfile(uid: string, data: Partial<UserProfileInput>) {
        const response = await api.patch(`/users/${uid}`, data);
        return response.data;
    },

    async setRole(uid: string, role: string) {
        const response = await api.post(`/users/${uid}/role`, { role });
        return response.data;
    },

    async getAllUsers(role?: string) {
        const response = await api.get('/users', { params: { role } });
        return response.data;
    },

    async updateStatus(uid: string, statusData: any) {
        const response = await api.patch(`/users/${uid}/status`, statusData);
        return response.data;
    }
};
