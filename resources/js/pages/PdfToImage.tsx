import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    ImageIcon,
    X,
    FileImage,
    Check
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";

const PdfToImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<'jpg' | 'png'>('jpg');
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("PDF to Image", {
        onSuccess: () => toast.success("PDF converted to images!")
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

    const handleConvert = async () => {
        if (!file) return;

        await startJob(
            () => api.uploadPdfToImage(file, format),
            (id) => api.getPdfToImageStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadPdfToImage(id), jobToDownload?.filename || "images.zip");
    };

    const handleReset = () => {
        setFile(null);
        reset();
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-red-600" />
                    Export Settings
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Image Format
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {(['jpg', 'png'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                    format === f
                                        ? "border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
                                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                <span className="font-bold uppercase">{f}</span>
                                {format === f && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleConvert}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <FileImage className="h-5 w-5 mr-2" />
                    Convert PDF to {format.toUpperCase()}
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="PDF to Image"
            description="Convert your PDF document pages into high-quality JPG or PNG images in seconds."
            icon={ImageIcon}
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
                        </div>
                    </div>
                )}

                {file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                                <ImageIcon className="h-8 w-8 text-red-600" />
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
                        <ChainedToolAction currentTool="PDF to Image" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default PdfToImage;
