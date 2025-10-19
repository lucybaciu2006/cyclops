import { axiosInstance } from "@/lib/axios.config";
import { SportLocation } from "@/model/sport-location.ts";

// ========== USERS ==========

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    lastInteraction?: string;
    trialSecondsLeft: number;
    creditsConsumed: number;
    propertiesCount: number;
    webrtcTimeSeconds: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export class AdminService {
    // --- Users ---
    public static async getUsers(params?: {
        page?: number;
        perPage?: number;
        sort?: string;
        filter?: any;
    }): Promise<{ data: AdminUser[]; total: number }> {
        const response = await axiosInstance.get("/admin/users", { params });
        return {
            data: response.data,
            total: parseInt(response.headers['x-total-count'] || response.data.length, 10),
        };
    }

    public static async getUser(id: string): Promise<AdminUser> {
        const response = await axiosInstance.get(`/admin/users/${id}`);
        return response.data;
    }

    public static async updateUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
        const response = await axiosInstance.put(`/admin/users/${id}`, data);
        return response.data;
    }

    public static async deleteUser(id: string): Promise<void> {
        await axiosInstance.delete(`/admin/users/${id}`);
    }

    // ========== PLAY LOCATIONS ==========

    public static async getPlayAreas(params?: { search?: string }): Promise<SportLocation[]> {
        const response = await axiosInstance.get("/admin/sport-locations", { params });
        return response.data;
    }

    public static async getPlayArea(id: string): Promise<SportLocation> {
        const response = await axiosInstance.get(`/admin/sport-locations/${id}`);
        return response.data;
    }

    public static async createSportLocation(data: Partial<SportLocation>): Promise<SportLocation> {
        const response = await axiosInstance.post("/admin/sport-locations", data);
        return response.data;
    }

    public static async updateSportLocationImage(locationId: string, image: File): Promise<SportLocation> {
        const formData = new FormData();
        formData.append('file', image);

        const updatedProperty = await axiosInstance.post<SportLocation>(`/admin/sport-locations/${locationId}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return updatedProperty.data;
    }

    public static async updateSportLocation(id: string, data: Partial<SportLocation>): Promise<SportLocation> {
        const response = await axiosInstance.put(`/admin/sport-locations/${id}`, data);
        return response.data;
    }

    public static async deleteSportLocation(id: string): Promise<void> {
        await axiosInstance.delete(`/admin/sport-locations/${id}`);
    }
}
