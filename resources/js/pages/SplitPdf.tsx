import React, { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Scissors,
    Download,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import { ChainedToolAction } from "../components/ChainedToolAction";
import Button from "../components/ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";

const MAX_FILE_SIZE  = 20 * 1024 * 1024; // 20MB

const SplitPdf: React.FC = () => {
    const [file, setFile]             = useState<File | null>(null);
    const [pages, setPages]           = useState("");
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const {
        isProcessing,
        job,
        startJob,
        downloadFile,
        reset
    } = usePdfTool("Split PDF", {
        onSuccess: () => {
            toast.success("PDF split successfully!");
        }
    });

    useEffect(() => {
        if (job?.is_completed) {
            setCompletedJobs(prev => {
                const exists = prev.find(j => j.job_id === job.job_id);
                if (exists) return prev;
                return [...prev, job];
            });
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            reset();
            toast.success(`Selected: ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
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

    const handleSplit = async () => {
        if (!file) return;
        if (!pages.trim()) {
            toast.error("Please enter page numbers (e.g. 1, 2, 5)");
            return;
        }

        await startJob(
            () => api.uploadSplitFile(file, pages),
            (id) => api.getSplitStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadSplitPdf(id), jobToDownload?.filename);
    };

    const handleReset = () => {
        setFile(null);
        setPages("");
        reset();
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Scissors className="h-5 w-5 mr-2 text-red-600" />
                    Split Options
                </h3>
                <div>
                    <label
                        htmlFor="pages-input"
                        className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
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
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                        Comma-separated page numbers or ranges — e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">1, 3, 5-10</code>
                    </p>
                </div>
            </div>

            <Button
                onClick={handleSplit}
                isLoading={isProcessing}
                disabled={isProcessing || !pages.trim()}
                size="lg"
                className="w-full"
            >
                {!isProcessing && <Scissors className="h-5 w-5 mr-2" />}
                {isProcessing ? "Splitting..." : "Split PDF"}
            </Button>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract specific pages from your PDF. Enter page numbers or ranges to get exactly what you need."
            icon={Scissors}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={handleReset}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {!file && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        <div
                            {...getRootProps()}
                            className="p-24 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-200"
                        >
                            <input {...getInputProps()} />
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full mb-6">
                                <Upload className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {isDragActive ? "Drop your PDF here" : "Select PDF File"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                or drag and drop your PDF here
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                                PDF only — up to 20MB
                            </p>
                        </div>
                    </div>
                )}

                {file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                                <Scissors className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">
                                    {file.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                )}

                {job?.is_completed && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <ChainedToolAction currentTool="Split PDF" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default SplitPdf;
