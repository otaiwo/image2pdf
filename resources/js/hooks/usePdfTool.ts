import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { StatusResponse, UploadResponse, ApiResponse } from '../types/api';
import { AppError, handleAxiosError, isRetryableError } from '../utils/errors';

interface UsePdfToolOptions {
    onSuccess?: (data: StatusResponse) => void;
    onError?: (error: AppError) => void;
    maxRetries?: number;
    initialDelay?: number;
}

interface PdfToolError {
    code: string;
    message: string;
    timestamp: Date;
}

/**
 * Hook for managing PDF tool operations (upload, poll, download)
 * Implements exponential backoff, error handling, and state management
 */
export const usePdfTool = (
    toolName: string,
    options: UsePdfToolOptions = {}
) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [job, setJob] = useState<StatusResponse | null>(null);
    const [error, setError] = useState<PdfToolError | null>(null);

    const maxRetries = options.maxRetries ?? 30;
    const initialDelay = options.initialDelay ?? 1000;

    /**
     * Poll job status with exponential backoff
     */
    const pollStatus = useCallback(
        async (
            jobId: string,
            getStatusFn: (id: string) => Promise<ApiResponse<StatusResponse> | StatusResponse>
        ) => {
            let retryCount = 0;

            const check = async () => {
                try {
                    const response = await getStatusFn(jobId);

                    const statusData = 'data' in response && response.data
                        ? response.data
                        : response as StatusResponse;

                    if (!statusData?.job_id || !statusData?.status) {
                        throw new AppError(
                            "STATUS_CHECK_FAILED",
                            "Failed to get job status"
                        );
                    }

                    setJob(statusData);
                    retryCount = 0; // Reset on success

                    if (statusData.is_completed) {
                        setIsProcessing(false);
                        setError(null);
                        options.onSuccess?.(statusData);
                    } else if (statusData.status === "failed") {
                        setIsProcessing(false);
                        const errorMsg = statusData.error || `${toolName} failed`;
                        const appError = new AppError("JOB_FAILED", errorMsg);
                        setError({
                            code: appError.code,
                            message: appError.message,
                            timestamp: new Date(),
                        });
                        toast.error(errorMsg);
                        options.onError?.(appError);
                    } else {
                        // Schedule next check with exponential backoff
                        const delay = Math.min(
                            initialDelay * Math.pow(1.5, retryCount),
                            10000 // Max 10 seconds
                        );
                        setTimeout(check, delay);
                    }
                } catch (err) {
                    retryCount++;

                    const appError =
                        err instanceof AppError ? err : handleAxiosError(err);

                    if (
                        retryCount >= maxRetries ||
                        !isRetryableError(appError.code)
                    ) {
                        setIsProcessing(false);
                        setError({
                            code: appError.code,
                            message: appError.message,
                            timestamp: new Date(),
                        });
                        toast.error(`${toolName}: ${appError.message}`);
                        options.onError?.(appError);
                    } else {
                        // Exponential backoff with jitter
                        const delay =
                            initialDelay *
                            Math.pow(1.5, retryCount) *
                            (0.5 + Math.random());
                        console.warn(
                            `[${toolName}] Retry ${retryCount}/${maxRetries} in ${Math.round(delay)}ms`,
                            appError
                        );
                        setTimeout(check, delay);
                    }
                }
            };

            check();
        },
        [toolName, maxRetries, initialDelay, options]
    );

    /**
     * Start PDF tool job (upload)
     */
    const startJob = async (
        uploadFn: () => Promise<ApiResponse<UploadResponse> | UploadResponse>,
        getStatusFn: (id: string) => Promise<ApiResponse<StatusResponse> | StatusResponse>
    ): Promise<string | null> => {
        setIsProcessing(true);
        setJob(null);
        setError(null);

        try {
            const response = await uploadFn();

            // Handle both nested and flattened responses
            const jobId = 'data' in response && response.data
                ? response.data.job_id
                : (response as UploadResponse).job_id;
            const succeeded = 'success' in response ? response.success : true;

            if (!succeeded || !jobId) {
                throw new AppError(
                    "UPLOAD_FAILED",
                    ('message' in response && response.message) || "Upload failed"
                );
            }

            toast.success("Upload successful, processing started...");
            pollStatus(jobId, getStatusFn);
            return jobId;
        } catch (err) {
            const appError =
                err instanceof AppError ? err : handleAxiosError(err);

            setIsProcessing(false);
            setError({
                code: appError.code,
                message: appError.message,
                timestamp: new Date(),
            });
            toast.error(appError.message);
            options.onError?.(appError);
            return null;
        }
    };

    /**
     * Download completed file
     */
    const downloadFile = async (
        downloadFn: (id: string) => Promise<Blob>,
        filename?: string
    ): Promise<boolean> => {
        if (!job?.job_id) {
            toast.error("No file to download");
            return false;
        }

        try {
            const blob = await downloadFn(job.job_id);

            // Create and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
                filename || job.filename || `${toolName}-output.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (err) {
            const appError =
                err instanceof AppError ? err : handleAxiosError(err);

            setError({
                code: appError.code,
                message: appError.message,
                timestamp: new Date(),
            });
            toast.error("Failed to download file");
            options.onError?.(appError);
            return false;
        }
    };

    /**
     * Reset state
     */
    const reset = () => {
        setIsProcessing(false);
        setJob(null);
        setError(null);
    };

    return {
        isProcessing,
        job,
        error,
        startJob,
        downloadFile,
        reset,
        setJob,
    };
};
