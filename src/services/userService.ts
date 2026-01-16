import { api } from './api';
import { UserRole } from '../../types'; // Assuming shared types exist or loosely typed for now

export interface UpdateProfileDto {
    fullName?: string;
    email?: string;
    mobile?: string;
    location?: string;
    avatar?: string;
}

export interface UpdateUserStatusDto {
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    reason?: string;
}

export const userService = {
    // Create User (Usually handled by Auth trigger, but if exposed)
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    // Find All (Admin)
    findAll: async (role?: UserRole) => {
        const params = role ? { role } : {};
        const response = await api.get('/users', { params });
        return response.data;
    },

    // Get Profile (Self or Admin)
    findOne: async (uid: string) => {
        const response = await api.get(`/users/${uid}`);
        return response.data;
    },

    // Update Profile
    update: async (uid: string, data: UpdateProfileDto) => {
        const response = await api.patch(`/users/${uid}`, data);
        return response.data;
    },

    // Set Role (Admin)
    setRole: async (uid: string, role: string) => {
        const response = await api.post(`/users/${uid}/role`, { role });
        return response.data;
    },

    // Update Status (Admin)
    updateStatus: async (uid: string, data: UpdateUserStatusDto) => {
        const response = await api.patch(`/users/${uid}/status`, data);
        return response.data;
    },

    // Delete User (Admin)
    delete: async (uid: string) => {
        const response = await api.delete(`/users/${uid}`);
        return response.data;
    },

    // Reset Password (Admin)
    resetPassword: async (uid: string) => {
        const response = await api.post(`/users/${uid}/reset-password`);
        return response.data;
    },

    // Upload KYC
    uploadKyc: async (uid: string, data: any) => {
        const response = await api.post(`/users/${uid}/kyc`, data);
        return response.data;
    }
};
