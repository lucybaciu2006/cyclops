import { axiosInstance } from "@/lib/axios.config";
import { SportLocation } from "@/model/sport-location.ts";
import { RecordingSession } from "@/model/recording-session.ts";
import { RecordingJob } from "@/model/recording-job";

// ========== USERS ==========

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    lastInteraction?: string;
    trialSecondsLeft?: number;
    creditsConsumed?: number;
    propertiesCount?: number;
    webSessionSeconds?: number; // backend field name
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export class AdminService {
    // --- Users ---
    public static async getUsers(params?: {
        page?: number;
        perPage?: number;
        sort?: [string, 'ASC' | 'DESC'];
        filter?: any;
    }): Promise<{ data: AdminUser[]; total: number }> {
        const qp: any = {};
        if (params?.page != null) qp.page = params.page;
        if (params?.perPage != null) qp.perPage = params.perPage;
        qp.sort = JSON.stringify(params?.sort ?? ["_id", "ASC"]);
        qp.filter = JSON.stringify(params?.filter ?? {});

        const response = await axiosInstance.get("/admin/users", { params: qp });
        const totalHeader = response.headers['content-range'] || response.headers['x-total-count'];
        const total = parseInt(totalHeader || (response.data?.length ?? 0), 10);
        return { data: response.data as AdminUser[], total };
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

    // ========== RECORDING SESSIONS ==========
    public static async getRecordingSessions(params: {
        locationId: string;
        fromDay: string; // YYYY-MM-DD
        toDay: string;   // YYYY-MM-DD
    }): Promise<RecordingSession[]> {
        const response = await axiosInstance.get(`/admin/recording-sessions`, { params });
        return response.data as RecordingSession[];
    }

    public static async createRecordingSession(body: {
        userId?: string;
        locationId: string;
        startTimeMs: number;
        durationMinutes: number;
        slotMinutes?: number;
        status?: string;
        metadata?: any;
    }): Promise<RecordingSession> {
        const response = await axiosInstance.post(`/admin/recording-sessions`, body);
        return response.data as RecordingSession;
    }

    public static async startAgentRecording(locationId: string, durationMinutes: number, metadata?: any): Promise<void> {
        await axiosInstance.post(`/admin/agents/${locationId}/start-recording`, { durationMinutes, metadata });
    }

    public static async getRecentRecordingJobs(locationId: string, limit = 10): Promise<RecordingJob[]> {
        const res = await axiosInstance.get(`/admin/recording-jobs`, { params: { locationId, limit } });
        return res.data as RecordingJob[];
    }
}
