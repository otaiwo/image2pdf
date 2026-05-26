export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface UploadResponse {
    job_id: string;
    status: string;
    message?: string;
    check_status_url?: string;
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface StatusResponse {
    job_id: string;
    status: JobStatus;
    progress: number;
    is_completed: boolean;
    is_expired: boolean; // required for UI consistency
    filename: string;    // required for UI consistency
    download_url?: string | null;
    error?: string | null;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ToolActivity {
    job_id: string;
    type: string;
    status: JobStatus;
    filename: string;
    created_at: string;
}

export interface AdminStats {
    metrics: {
        total_jobs: number;
        completed_jobs: number;
        failed_jobs: number;
        total_users: number;
        success_rate: number;
    };
    recent_jobs: Array<ToolActivity & { user: string }>;
    usage_by_type: Array<{ type: string; total: number }>;
}
