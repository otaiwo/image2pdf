import axios, { AxiosInstance } from "axios";
import type { StatusResponse } from "../types/api";

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


class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: "/api",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            timeout: 60000, // 60 seconds timeout
        });

        // Get CSRF token from meta tag or window object
        let csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        if (!csrfToken && (window as any).csrfToken) {
            csrfToken = (window as any).csrfToken;
        }

        if (csrfToken) {
            this.client.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
        }

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized silently
                }
                if (error.response?.status === 419) {
                    // CSRF token mismatch
                    window.location.reload();
                }
                if (error.response?.status === 422) {
                    // Validation errors
                    const errors = error.response.data.errors;
                    const firstError = Object.values(errors)[0];
                    if (Array.isArray(firstError)) {
                        throw new Error(firstError[0]);
                    }
                }
                return Promise.reject(error);
            },
        );
    }

    // Updated to accept optional conversion options
    async uploadImages(
        files: File[],
        options?: { orientation: string; pageSize: string; margin: string; mergeAll: boolean }
    ): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("images[]", file);
        });
        if (options) {
            // Send options as a JSON string; backend can parse accordingly
            formData.append("options", JSON.stringify(options));
        }

        try {
            const response = await this.client.post<
                ApiResponse<UploadResponse>
            >("/tools/image-to-pdf/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    // Upload progress tracking – can be extended with callbacks
                },
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Upload failed",
            };
        }
    }

    async uploadChatFile(file: File): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>("/tools/ai/chat/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async askChatQuestion(jobId: string, question: string, history: any[]): Promise<ApiResponse<{ answer: string }>> {
        try {
            const response = await this.client.post<ApiResponse<{ answer: string }>>(`/tools/ai/chat/${jobId}/ask`, {
                question,
                history
            });
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async getJobStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/image-to-pdf/status/${jobId}`,
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get status",
            };
        }
    }

    async downloadPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(
            `/tools/image-to-pdf/download/${jobId}`,
            {
                responseType: "blob",
            },
        );
        return response.data;
    }

    async uploadFile(file: File, type: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            const response = await this.client.post<
                ApiResponse<UploadResponse>
            >("/tools/file-converter/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Upload failed",
            };
        }
    }

    async getFileConverterStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/file-converter/status/${jobId}`,
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get status",
            };
        }
    }

    async downloadConvertedFile(jobId: string): Promise<Blob> {
        const response = await this.client.get(
            `/tools/file-converter/download/${jobId}`,
            {
                responseType: "blob",
            },
        );
        return response.data;
    }

    async uploadMergeFiles(files: File[]): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files[]", file);
        });

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/merge-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getMergeStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/merge-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadMergePdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/merge-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async uploadUnlockFile(file: File, password: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/unlock-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getUnlockStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/unlock-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadUnlockPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/unlock-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async uploadSplitFile(file: File, pages: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pages", pages);

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/split-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getSplitStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/split-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadSplitPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/split-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    /**
     * Upload a PDF for watermarking. Accepts a FormData payload that may contain:
     * - file (PDF)
     * - text (watermark text)
     * - position (placement option)
     * - image (optional image file for image watermark)
     */
    async uploadWatermarkFile(formData: FormData): Promise<ApiResponse<UploadResponse>> {
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/watermark-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getWatermarkStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/watermark-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadWatermarkPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/watermark-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async uploadProtectFile(file: File, password: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/protect-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getProtectStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/protect-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadProtectPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/protect-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async uploadOrganizeFile(file: File, pagesToRemove: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pages_to_remove", pagesToRemove);

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/organize-pdf/upload",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async getOrganizeStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/organize-pdf/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    async downloadOrganizePdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/organize-pdf/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async uploadMetadataFile(formData: FormData): Promise<ApiResponse<UploadResponse>> {
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/edit-metadata/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async getMetadataStatus(jobId: string): Promise<ApiResponse<StatusResponse>> {
        try {
            const response = await this.client.get<ApiResponse<StatusResponse>>(
                `/tools/edit-metadata/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async downloadMetadataPdf(jobId: string): Promise<Blob> {
        const response = await this.client.get(`/tools/edit-metadata/download/${jobId}`, {
            responseType: "blob",
        });
        return response.data;
    }

    async getRecentActivity(): Promise<ApiResponse<any[]>> {
        try {
            const response = await this.client.get<ApiResponse<any[]>>("/dashboard/recent-activity");
            return response.data;
        } catch (error: any) {
            return { success: false, data: [] };
        }
    }

    async getAdminStats(): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get<ApiResponse<any>>("/admin/stats");
            return response.data;
        } catch (error: any) {
            return { success: false, message: "Failed to load admin stats" };
        }
    }

    async uploadAiSummarize(file: File): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>(
                "/tools/ai/summarize",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Upload failed",
            };
        }
    }

    async uploadAiKeywords(file: File): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>("/tools/ai/keywords", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async uploadAiTranslate(file: File, language: string): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        try {
            const response = await this.client.post<ApiResponse<UploadResponse>>("/tools/ai/translate", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async getAiStatus(jobId: string): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get<ApiResponse<any>>(
                `/tools/ai/status/${jobId}`
            );
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Failed to get status",
            };
        }
    }

    // Utility method for direct download
    async downloadFile(url: string, filename: string) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const api = new ApiClient();
