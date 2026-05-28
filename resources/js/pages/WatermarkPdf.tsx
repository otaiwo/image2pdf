import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Type,
    Download,
    Stamp,
    Image as ImageIcon,
    X
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import Button from "../components/ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";

const WatermarkPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>("CONFIDENTIAL");
    const [position, setPosition] = useState<string>('bottom');
    const [imageWatermark, setImageWatermark] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Watermark PDF", {
        onSuccess: () => toast.success("Watermark added successfully!")
    });

    useEffect(() => {
        if (job?.is_completed) {
            setCompletedJobs(prev => {
                const exists = prev.find(j => j.job_id === job.job_id);
                if (exists) return prev;
                return [...prev, job];
            });
            generatePreview();
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            reset();
            setPreviewUrl('');
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleWatermark = async () => {
        if (!file) return;
        if (!text.trim() && !imageWatermark) {
            toast.error("Please provide watermark text or an image");
            return;
        }

        setPreviewUrl('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', text);
        formData.append('position', position);
        if (imageWatermark) {
            formData.append('image', imageWatermark);
        }

        await startJob(
            () => api.uploadWatermarkFile(formData),
            (id) => api.getWatermarkStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadWatermarkPdf(id), jobToDownload?.filename);
    };

    const generatePreview = async () => {
        if (!job?.job_id) return;
        try {
            const blob = await api.downloadWatermarkPdf(job.job_id);
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (_) {}
    };

    const handleReset = () => {
        setFile(null);
        setText("CONFIDENTIAL");
        reset();
        setPreviewUrl('');
        setImageWatermark(null);
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Stamp className="h-5 w-5 mr-2 text-red-600" />
                    Watermark Settings
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                            <Type className="h-3 w-3 mr-2" />
                            Watermark Text
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. CONFIDENTIAL"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Position</label>
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="top">Top</option>
                            <option value="middle">Middle</option>
                            <option value="bottom">Bottom</option>
                            <option value="diagonal">Diagonal</option>
                            <option value="vertical">Vertical</option>
                            <option value="horizontal">Horizontal</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                            <ImageIcon className="h-3 w-3 mr-2" />
                            Image Watermark (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setImageWatermark(e.target.files[0]);
                                }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleWatermark}
                    isLoading={isProcessing}
                    disabled={(!text.trim() && !imageWatermark) || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <Stamp className="h-5 w-5 mr-2" />
                    Add Watermark
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Add Watermark"
            description="Stamp your PDF with custom text or images. Choose your style and we'll apply it to every page."
            icon={Stamp}
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
                                <Stamp className="h-10 w-10 text-red-600" />
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
                                <Stamp className="h-8 w-8 text-red-600" />
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
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        {previewUrl && (
                            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <Stamp className="h-5 w-5 mr-2 text-red-600" />
                                    Preview Result
                                </h3>
                                <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <iframe
                                        src={previewUrl}
                                        title="Watermark preview"
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        )}
                        <ChainedToolAction currentTool="Add Watermark" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default WatermarkPdf;
