import axios from 'axios';
import { AuthService } from './auth.service';
import {env} from '../../env.ts';
import { toast } from 'sonner';
import {i18n} from "../../i18n.ts";
import {getCurrentLanguage} from "@/contexts/language.context.tsx";
import {Constants} from "@/core/constants.ts";
import {ServerError} from "@/core/server-error.ts";

const API_URL = env.VITE_API_URL;

let logoutFn: (() => void) | null = null;

export function setLogoutHandler(fn: () => void) {
    logoutFn = fn;
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token && config?.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log(error);

        const language = localStorage.getItem('language') || 'ro';
        const defaultErrorMessage = i18n['common.serverError']?.[language] || 'Server Error';

        // Network or unknown setup error
        if (error.request && !error.response) {
            toast.error(defaultErrorMessage, { duration: 5000 });
            return Promise.reject({
                message: defaultErrorMessage,
                code: 'NETWORK_ERROR',
            });
        }

        const status = error.response?.status;
        const responseData = error.response?.data;

        // 401 – logout user
        if (status === 401) {
            logoutFn?.();
            return Promise.reject(error);
        }

        // 503 – business error, pass through raw error (or just the data)
        if (status === Constants.BUSINESS_ERROR) {
            return Promise.reject(responseData as ServerError);
        }

        // 500 or others – generic error
        const normalizedError = {
            message: responseData?.message || defaultErrorMessage,
            code: responseData?.code || 'SERVER_ERROR',
            status: status || 500,
        };

        toast.error(normalizedError.message, { duration: 5000 });

        return Promise.reject(normalizedError);
    }
);
