import {LoginResponse} from "@/model/login-response.ts";
import {axiosInstance} from "@/lib/axios.config.ts";
import {RegisterRequest} from "@/model/register-request.ts";
import {LoginRequest} from "@/model/login-request.ts";
import { NotificationSettings } from "@/model/notification-settings";

export const AuthService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return response.data; // don't call handleLogin
  },

  async oAuthLogin(request: {provider: string, token: string}): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>('/auth/oauth-login', request);
    return response.data; // don't call handleLogin
  },

  async register(userData: RegisterRequest): Promise<void> {
    await axiosInstance.post<void>('/auth/register', userData);
  },

  async deleteAccount(email: string, currentPassword: string): Promise<void> {
    await axiosInstance.post<void>(`/auth/delete-account`, { email, currentPassword });
  },

  logout() {
    // optional: just hit backend if needed, or remove this entirely
  },

  async verifyEmail(token: string): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(`/auth/confirm-email?token=${token}`);
    return response.data;
  },
  
  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post<void>(`/auth/forgot-password`, { email });
  },

  async updatePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    await axiosInstance.post<void>(`/auth/update-password`, { email, currentPassword, newPassword });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axiosInstance.post<void>(`/auth/reset-password`, { token, newPassword });
  },

  async updateProfile(email: string, name: string, company: string): Promise<void> {
    await axiosInstance.post<void>(`/auth/update-profile`, { email, name, company });
  },

  async updateNotifications(email: string, notifications: NotificationSettings): Promise<void> {
    await axiosInstance.post<void>(`/auth/update-notifications`, { email, notifications });
  }
};
