import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Zap,
    X,
    FileDown,
    Check
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";

const CompressPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Compress PDF", {
        onSuccess: () => toast.success("PDF compressed successfully!")
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

    const handleCompress = async () => {
        if (!file) return;

        await startJob(
            () => api.uploadCompressPdf(file, level),
            (id) => api.getCompressStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadCompressedPdf(id), jobToDownload?.filename);
    };

    const handleReset = () => {
        setFile(null);
        reset();
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-red-600" />
                    Compression Level
                </h3>

                <div className="space-y-3">
                    {[
                        { id: 'low', label: 'Low Compression', desc: 'Highest quality, larger file size' },
                        { id: 'medium', label: 'Recommended', desc: 'Good quality, good compression' },
                        { id: 'high', label: 'Extreme', desc: 'Less quality, smallest file size' }
                    ].map((l) => (
                        <button
                            key={l.id}
                            onClick={() => setLevel(l.id as any)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                                level === l.id
                                    ? "border-red-600 bg-red-50 dark:bg-red-900/10"
                                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className={`font-bold text-sm ${level === l.id ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                                        {l.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {l.desc}
                                    </div>
                                </div>
                                {level === l.id && <Check className="h-4 w-4 text-red-600" />}
                            </div>
                        </button>
                    ))}
                </div>

                <Button
                    onClick={handleCompress}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <Zap className="h-5 w-5 mr-2" />
                    Compress PDF
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Compress PDF"
            description="Reduce the file size of your PDF documents while keeping the best possible quality."
            icon={Zap}
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
                                <FileDown className="h-8 w-8 text-red-600" />
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
                        <ChainedToolAction currentTool="Compress PDF" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default CompressPdf;
