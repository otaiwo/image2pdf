import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { StatusResponse, UploadResponse, ApiResponse } from '../types/api';

interface UsePdfToolOptions {
    onSuccess?: (data: StatusResponse) => void;
    onError?: (error: string) => void;
}

export const usePdfTool = (toolName: string, options: UsePdfToolOptions = {}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [job, setJob] = useState<StatusResponse | null>(null);

    const pollStatus = useCallback(async (jobId: string, getStatusFn: (id: string) => Promise<ApiResponse<StatusResponse>>) => {
        const check = async () => {
            try {
                const response = await getStatusFn(jobId);
                if (response.success && response.data) {
                    setJob(response.data);
                    if (response.data.is_completed) {
                        setIsProcessing(false);
                        options.onSuccess?.(response.data);
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        const errorMsg = response.data.error || `${toolName} failed`;
                        toast.error(errorMsg);
                        options.onError?.(errorMsg);
                    } else {
                        setTimeout(check, 2000);
                    }
                }
            } catch (error: any) {
                console.error("Polling error:", error);
                setTimeout(check, 3000);
            }
        };
        check();
    }, [toolName, options]);

    const startJob = async (
        uploadFn: () => Promise<ApiResponse<UploadResponse>>,
        getStatusFn: (id: string) => Promise<ApiResponse<StatusResponse>>
    ) => {
        setIsProcessing(true);
        setJob(null);

        try {
            const response = await uploadFn();
            // Handle both nested and flattened responses
            const jobId = response.data?.job_id || (response as any).job_id;

            if (response.success && jobId) {
                toast.success("Upload successful, processing started...");
                pollStatus(jobId, getStatusFn);
                return jobId;
            } else {
                throw new Error(response.message || "Upload failed");
            }
        } catch (error: any) {
            const message = error.message || "Something went wrong";
            toast.error(message);
            setIsProcessing(false);
            options.onError?.(message);
        }
    };

    const downloadFile = async (downloadFn: (id: string) => Promise<Blob>, filename?: string) => {
        if (!job?.job_id) return;
        try {
            const blob = await downloadFn(job.job_id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || job.filename || "document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download file");
        }
    };

    const reset = () => {
        setIsProcessing(false);
        setJob(null);
    };

    return {
        isProcessing,
        job,
        startJob,
        downloadFile,
        reset,
        setJob
    };
};
