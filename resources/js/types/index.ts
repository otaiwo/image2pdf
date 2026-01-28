export interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    previewUrl: string;
    order: number;
}

export interface ConversionJob {
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
