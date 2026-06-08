import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Layout,
    Download,
    X,
    Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";
import UploadDropzone from "../components/UploadDropzone";

const OrganizePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pagesToRemove, setPagesToRemove] = useState<string>("");
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Organize PDF", {
        onSuccess: () => toast.success("PDF organized successfully!")
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

    const handleOrganize = async () => {
        if (!file) return;
        if (!pagesToRemove.trim()) {
            toast.error("Please enter page numbers to remove (e.g. 2, 4)");
            return;
        }

        await startJob(
            () => api.uploadOrganizeFile(file, pagesToRemove),
            (id) => api.getOrganizeStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadOrganizePdf(id), jobToDownload?.filename);
    };

    const handleReset = () => {
        setFile(null);
        setPagesToRemove("");
        reset();
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-red-600" />
                    Organize Settings
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Pages to Remove
                    </label>
                    <input
                        type="text"
                        value={pagesToRemove}
                        onChange={(e) => setPagesToRemove(e.target.value)}
                        placeholder="e.g. 2, 4, 6"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Enter comma-separated page numbers you want to delete.
                    </p>
                </div>

                <Button
                    onClick={handleOrganize}
                    isLoading={isProcessing}
                    disabled={!pagesToRemove.trim() || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <X className="h-5 w-5 mr-2" />
                    Remove Pages
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Organize PDF"
            description="Remove unwanted pages from your PDF file. Keep only the pages you need and discard the rest."
            icon={Layout}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={handleReset}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {!file && (
                    <UploadDropzone
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                        isDragActive={isDragActive}
                        title="Select PDF File"
                        activeTitle="Drop your PDF here"
                        subtitle="Click to upload or drag and drop your PDF here"
                        hint="PDF only"
                        icon={Layout}
                    />
                )}

                {file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                                <Layout className="h-8 w-8 text-red-600" />
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
                        <ChainedToolAction currentTool="Organize PDF" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default OrganizePdf;
