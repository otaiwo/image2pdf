import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

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

export interface StatusResponse {
    job_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    is_completed: boolean;
    is_expired: boolean;
    filename: string;
    download_url?: string;
    created_at: string;
    updated_at: string;
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
            timeout: 30000, // 30 seconds timeout
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
                // You can add loading indicators here
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
                    // Handle unauthorized
                    console.warn("Unauthorized request");
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

    async uploadImages(files: File[]): Promise<ApiResponse<UploadResponse>> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("images[]", file);
        });

        try {
            const response = await this.client.post<
                ApiResponse<UploadResponse>
            >("/tools/image-to-pdf/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    // You can emit progress events here if needed
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) /
                            (progressEvent.total || 1),
                    );
                    console.log(`Upload progress: ${percentCompleted}%`);
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
