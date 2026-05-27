import React, { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useJobDownload } from "../hooks/useJobDownload";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Scissors,
    RefreshCw,
    Download,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import ConversionProgress from "../components/ConversionProgress";
import { ChainedToolAction } from "../components/ChainedToolAction";

const MAX_FILE_SIZE  = 20 * 1024 * 1024; // 20MB
const POLL_INTERVAL  = 2000;
const MAX_RETRIES    = 30; // ~60 seconds

const SplitPdf: React.FC = () => {
    const [file, setFile]             = useState<File | null>(null);
    const [pages, setPages]           = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [job, setJob]               = useState<StatusResponse | null>(null);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    // ✅ Fixed: only one handleDownload — from the hook, not redeclared locally
    const { handleDownload } = useJobDownload();

    // ✅ Fixed: store poll timer in ref so it can be cancelled on unmount
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setJob(null);
            toast.success(`Selected: ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        // ✅ Fixed: enforce the size limit that the UI advertises
        maxSize: MAX_FILE_SIZE,
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(({ file: f, errors }) => {
                const isTooLarge = errors.some(e => e.code === "file-too-large");
                toast.error(
                    isTooLarge
                        ? `${f.name} exceeds the 20MB limit`
                        : `${f.name} is not a valid PDF`
                );
            });
        },
    });

    // ✅ Fixed: retry limit + ref-based timer to prevent memory leaks
    const pollStatus = useCallback((jobId: string) => {
        let retries = 0;

        const check = async () => {
            if (retries >= MAX_RETRIES) {
                toast.error("Operation timed out. Please try again.");
                setIsProcessing(false);
                return;
            }

            try {
                const response = await api.getSplitStatus(jobId);

                if (response.success && response.data) {
                    const data = response.data;
                    setJob(data);

                    if (data.is_completed) {
                        setIsProcessing(false);
                        toast.success("PDF split successfully!");
                        // ✅ Fixed: capture data in local var before setState to satisfy TS
                        setCompletedJobs(prev => [...prev, data]);
                        return;
                    }

                    if (data.status === "failed") {
                        setIsProcessing(false);
                        toast.error(data.error || "Splitting failed");
                        return;
                    }
                }
            } catch {
                // swallow; just retry
            }

            retries++;
            pollTimerRef.current = setTimeout(check, POLL_INTERVAL);
        };

        check();
    }, []);

    // ✅ Fixed: wrapped in useCallback
    const handleSplit = useCallback(async () => {
        if (!file) return;
        if (!pages.trim()) {
            toast.error("Please enter page numbers (e.g. 1, 2, 5)");
            return;
        }

        setIsProcessing(true);
        setJob(null);
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

        try {
            const response = await api.uploadSplitFile(file, pages);
            // The API returns an ApiResponse where the actual payload is in `data`
            // which contains the `job_id`. Adjust the check accordingly.
            if (response.success && response.data?.job_id) {
                toast.success("Upload successful — splitting started");
                pollStatus(response.data.job_id);
            } else {
                // Use the top‑level message if provided, otherwise a generic fallback
                throw new Error(response.message || "Upload failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            setIsProcessing(false);
        }
    }, [file, pages, pollStatus]);

    const handleDownloadJob = useCallback(() => {
        if (!job?.job_id) return;
        handleDownload(job);
    }, [job, handleDownload]);

    const reset = useCallback(() => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        setFile(null);
        setPages("");
        setJob(null);
        setIsProcessing(false);
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
        setJob(null);
    }, []);

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract specific pages from your PDF. Enter page numbers or ranges to get exactly what you need."
            icon={Scissors}
            jobs={completedJobs}
            onDownload={handleDownloadJob}
        >
            <div className="max-w-4xl mx-auto">

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">

                    {/* Drop Zone */}
                    <div
                        {...getRootProps()}
                        role="button"
                        aria-label="Upload a PDF file by clicking or dragging and dropping"
                        className={`p-10 border-b border-gray-100 dark:border-gray-800 text-center cursor-pointer transition-colors ${
                            isDragActive
                                ? "bg-red-50 dark:bg-red-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-4" />

                        {file ? (
                            <div className="flex items-center justify-center space-x-3">
                                <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                                    {file.name}
                                </p>
                                {/* ✅ Allow removing the selected file without clearing the whole form */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); removeFile(); }}
                                    aria-label="Remove selected file"
                                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {isDragActive ? "Drop your PDF here" : "Click or drag PDF to split"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    PDF only — max 20MB
                                </p>
                            </>
                        )}
                    </div>

                    {/* Controls */}
                    {file && (
                        <div className="p-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="pages-input"
                                    className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Pages to Extract
                                </label>
                                <input
                                    id="pages-input"
                                    type="text"
                                    value={pages}
                                    onChange={e => setPages(e.target.value)}
                                    placeholder="e.g. 1, 3, 5-8"
                                    disabled={isProcessing}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Comma-separated page numbers or ranges — e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">1, 3, 5-10</code>
                                </p>
                            </div>

                            {!job?.is_completed && (
                                <button
                                    onClick={handleSplit}
                                    disabled={isProcessing || !pages.trim()}
                                    aria-busy={isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                        isProcessing || !pages.trim()
                                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none"
                                    }`}
                                >
                                    {isProcessing ? (
                                        <><RefreshCw className="h-5 w-5 animate-spin" /><span>Splitting...</span></>
                                    ) : (
                                        <><Scissors className="h-5 w-5" /><span>Split PDF</span></>
                                    )}
                                </button>
                            )}

                            {job && (
                                <div className="mt-4 space-y-4">
                                    <ConversionProgress job={job} onDownload={handleDownloadJob} />

                                    {job.is_completed && (
                                        <>
                                            <div className="flex gap-3 mt-2">
                                                <button
                                                    onClick={handleDownloadJob}
                                                    className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors"
                                                >
                                                    <Download className="h-5 w-5" />
                                                    <span>Download Split PDF</span>
                                                </button>
                                                <button
                                                    onClick={reset}
                                                    className="px-6 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    Start Over
                                                </button>
                                            </div>
                                            <ChainedToolAction currentTool="Split PDF" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
};

export default SplitPdf;