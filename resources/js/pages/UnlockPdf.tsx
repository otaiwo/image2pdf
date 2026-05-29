import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Unlock,
    RefreshCw,
    Download,
    Eye,
    EyeOff,
    FileLock2,
    X
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import Button from "../components/ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";
import { ChainedToolAction } from "../components/ChainedToolAction";

const UnlockPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Unlock PDF", {
        onSuccess: () => toast.success("PDF unlocked successfully!")
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
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleUnlock = async () => {
        if (!file) return;
        if (!password) {
            toast.error("Please enter the PDF password");
            return;
        }

        await startJob(
            () => api.uploadUnlockFile(file, password),
            (id) => api.getUnlockStatus(id)
        );
    };

    const handleDownload = () => {
        downloadFile((id) => api.downloadUnlockPdf(id));
    };

    const handleReset = () => {
        setFile(null);
        setPassword("");
        reset();
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Unlock className="h-5 w-5 mr-2 text-red-600" />
                    Authentication
                </h3>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                        <FileLock2 className="h-3 w-3 mr-2" />
                        PDF Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password to unlock"
                            disabled={isProcessing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {!job?.is_completed && (
                <Button
                    onClick={handleUnlock}
                    isLoading={isProcessing}
                    disabled={!password || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    {!isProcessing && <Unlock className="h-5 w-5 mr-2" />}
                    {isProcessing ? "Unlocking..." : "Unlock PDF"}
                </Button>
            )}
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Unlock PDF"
            description="Remove password protection from your PDF files. Easily access and edit your locked documents."
            icon={Unlock}
            sidebar={sidebarContent}
            jobs={completedJobs}
            onDownload={handleDownload}
            activeJob={job}
            onReset={handleReset}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
                    <div
                        {...getRootProps()}
                        className={`p-16 text-center cursor-pointer transition-colors ${
                            isDragActive ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full mb-4">
                            <Unlock className="h-8 w-8 text-red-600" />
                        </div>

                        {file ? (
                            <div className="flex items-center justify-center space-x-3">
                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-xs md:max-w-md">
                                    {file.name}
                                </p>
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); setFile(null); reset(); }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {isDragActive ? "Drop your PDF here" : "Select PDF File"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    or drag and drop your PDF here
                                </p>
                            </>
                        )}
                    </div>

                    {job?.is_completed && (
                        <div className="p-8 border-t border-gray-100 dark:border-gray-800">
                            <ChainedToolAction currentTool="Unlock PDF" />
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
};

export default UnlockPdf;
