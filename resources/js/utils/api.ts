/**
 * Refactored API Client with Proper Error Handling
 * - Centralized error handling with typed errors
 * - CSRF token management
 * - Proper response validation
 * - No token in state (httpOnly cookies in production)
 */

import axios, { AxiosInstance } from "axios";
import type { StatusResponse } from "../types/api";
import { handleAxiosError, AppError, NetworkError } from "./errors";
import { CsrfTokenManager } from "./csrf";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface UploadResponse {
    job_id: string;
    status: string;
    message?: string;
    check_status_url?: string;
}

export interface LoginResponse {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface RegisterResponse extends LoginResponse {}

/**
 * Typed API Client with proper error handling
 */
export class ApiClient {
    private client: AxiosInstance;
    private csrf: CsrfTokenManager;

    constructor(baseURL: string = "/api") {
        this.csrf = CsrfTokenManager.getInstance();

        this.client = axios.create({
            baseURL,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            timeout: 60000,
            withCredentials: true, // Send cookies with requests
        });

        // Set initial CSRF token
        const csrfToken = this.csrf.getTokenSafe();
        if (csrfToken) {
            this.client.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
        }

        this.setupInterceptors();
    }

    private unwrap<T>(
        payload: ApiResponse<T> & Partial<T>,
        errorCode: string,
        fallbackMessage: string
    ): T {
        if (!payload.success) {
            throw new AppError(errorCode, payload.message || fallbackMessage);
        }

        return (payload.data ?? payload) as T;
    }

    /**
     * Setup request/response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor: add CSRF token to headers
        this.client.interceptors.request.use(
            (config) => {
                try {
                    const token = this.csrf.getToken();
                    config.headers["X-CSRF-TOKEN"] = token;
                } catch (error) {
                    console.warn("CSRF token not available:", error);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor: handle errors
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (!error.response) {
                    throw new NetworkError(error.message);
                }

                const { status } = error.response;

                // Handle token refresh on 419
                if (status === 419) {
                    try {
                        await this.csrf.refreshToken();
                        // Retry original request with new token
                        return this.client(error.config);
                    } catch (refreshError) {
                        console.error("Failed to refresh CSRF token:", refreshError);
                    }
                }

                // Handle 401 (unauthorized)
                if (status === 401) {
                    // Clear auth state and redirect to login
                    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
                }

                throw handleAxiosError(error);
            }
        );
    }

    /**
     * ──────────────────── AUTH ENDPOINTS ────────────────────
     */

    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await this.client.post<ApiResponse<LoginResponse>>(
                "/login",
                { email, password }
            );

            return this.unwrap<LoginResponse>(response.data, "LOGIN_FAILED", "Login failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async register(
        name: string,
        email: string,
        password: string
    ): Promise<RegisterResponse> {
        try {
            const response = await this.client.post<ApiResponse<RegisterResponse>>(
                "/register",
                { name, email, password }
            );

            return this.unwrap<RegisterResponse>(response.data, "REGISTER_FAILED", "Registration failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async logout(): Promise<void> {
        try {
            await this.client.post("/logout");
        } catch (error) {
            console.error("Logout error:", error);
            // Don't throw, allow logout even if API fails
        }
    }

    /**
     * ──────────────────── IMAGE TO PDF ────────────────────
     */

    async uploadImages(
        files: File[],
        options?: {
            orientation: string;
            pageSize: string;
            margin: string;
            mergeAll: boolean;
        }
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append("images[]", file);
            });
            if (options) {
                formData.append("options", JSON.stringify(options));
            }

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/image-to-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getJobStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/image-to-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/image-to-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── PDF TO IMAGE ────────────────────
     */

    async uploadPdfToImage(
        file: File,
        format: "jpg" | "png"
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("format", format);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/pdf-to-image/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getPdfToImageStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/pdf-to-image/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadPdfToImage(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/pdf-to-image/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── MERGE PDF ────────────────────
     */

    async uploadMergeFiles(files: File[]): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append("files[]", file);
            });

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/merge-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getMergeStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/merge-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadMergePdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/merge-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── SPLIT PDF ────────────────────
     */

    async uploadSplitFile(file: File, pages: string): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("pages", pages);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/split-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getSplitStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/split-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadSplitPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/split-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── COMPRESS PDF ────────────────────
     */

    async uploadCompressPdf(
        file: File,
        level: "low" | "medium" | "high"
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("level", level);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/compress-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getCompressStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/compress-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadCompressedPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/compress-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── WATERMARK PDF ────────────────────
     */

    async uploadWatermarkFile(formData: FormData): Promise<UploadResponse> {
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/watermark-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getWatermarkStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/watermark-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadWatermarkPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/watermark-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── PROTECT PDF ────────────────────
     */

    async uploadProtectPdf(
        file: File,
        password: string
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("password", password);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/protect-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getProtectStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/protect-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadProtectPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/protect-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── UNLOCK PDF ────────────────────
     */

    async uploadUnlockFile(
        file: File,
        password: string
    ): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("password", password);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/unlock-pdf/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async getUnlockStatus(jobId: string): Promise<StatusResponse> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/unlock-pdf/status/${jobId}`
            );

            return this.unwrap<StatusResponse>(response.data, "STATUS_CHECK_FAILED", "Failed to get status");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async downloadUnlockPdf(jobId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/tools/unlock-pdf/download/${jobId}`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    /**
     * ──────────────────── AI CHAT ────────────────────
     */

    async uploadChatFile(file: File): Promise<UploadResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/ai/chat/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return this.unwrap<UploadResponse>(response.data, "UPLOAD_FAILED", "Upload failed");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }

    async askChatQuestion(
        jobId: string,
        question: string,
        history: any[] = []
    ): Promise<{ answer: string }> {
        try {
            const response = await this.client.post<
                ApiResponse<{ answer: string }>
            >(`/tools/ai/chat/${jobId}/ask`, {
                question,
                history,
            });

            return this.unwrap<{ answer: string }>(response.data, "QUESTION_FAILED", "Failed to get answer");
        } catch (error) {
            throw error instanceof AppError ? error : handleAxiosError(error);
        }
    }
}

/**
 * Factory function for creating API client instances
 */
export function createApiClient(baseURL?: string): ApiClient {
    return new ApiClient(baseURL);
}

/**
 * Default singleton instance
 */
export const api = createApiClient();
