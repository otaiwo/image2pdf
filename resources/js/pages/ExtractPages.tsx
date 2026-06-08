import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Scissors,
    X,
    Files,
    ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";
import UploadDropzone from "../components/UploadDropzone";

const ExtractPages: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pagesToKeep, setPagesToKeep] = useState<string>("");
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Extract Pages", {
        onSuccess: () => toast.success("Pages extracted successfully!")
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

    const handleExtract = async () => {
        if (!file) return;
        if (!pagesToKeep.trim()) {
            toast.error("Please enter page numbers to extract");
            return;
        }

        // We use the 'page_specs' of Organize API to only keep certain pages
        const pages = pagesToKeep.split(',').map(p => ({ index: parseInt(p.trim()) }));
        
        await startJob(
            () => api.uploadOrganizeFile(file, undefined, pages),
            (id) => api.getOrganizeStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadOrganizePdf(id), jobToDownload?.filename || "extracted.pdf");
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Scissors className="h-5 w-5 mr-2 text-red-600" />
                    Extraction Settings
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Pages to Keep
                    </label>
                    <input
                        type="text"
                        value={pagesToKeep}
                        onChange={(e) => setPagesToKeep(e.target.value)}
                        placeholder="e.g. 1, 3, 5-7"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Enter comma-separated page numbers you want to extract into a new PDF.
                    </p>
                </div>

                <Button
                    onClick={handleExtract}
                    isLoading={isProcessing}
                    disabled={!pagesToKeep.trim() || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <Files className="h-5 w-5 mr-2" />
                    Extract Pages
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Extract Pages"
            description="Create a new PDF containing only the pages you select from your original document."
            icon={Scissors}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={() => {
                setFile(null);
                setPagesToKeep("");
                reset();
            }}
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
                        icon={Scissors}
                    />
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
                            onClick={() => setFile(null)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                )}

                {job?.is_completed && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <ChainedToolAction currentTool="Extract Pages" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default ExtractPages;
