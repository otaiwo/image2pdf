import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, File, X, Download, RefreshCw,
    CheckCircle2, Image as ImageIcon, Clock, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import ConversionProgress from "./ConversionProgress";
import FileConverter from "./FileConverter";

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    previewUrl: string;
}

// ✅ Fixed: static color maps instead of dynamic Tailwind class interpolation
const STEP_STYLES = {
    blue:   { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-600 dark:text-blue-400"   },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    green:  { bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-600 dark:text-green-400"  },
} as const;

type StepColor = keyof typeof STEP_STYLES;

const STEPS: { number: string; title: string; description: string; color: StepColor }[] = [
    { number: "1", title: "Upload Images",      description: "Drag & drop or click to select multiple images",    color: "blue"   },
    { number: "2", title: "Review Files",       description: "Check your uploaded images before conversion",      color: "purple" },
    { number: "3", title: "Convert & Download", description: "Click convert and download your PDF file",          color: "green"  },
];

const TIPS = [
    "Images are optimized for PDF quality",
    "Files are securely deleted after 1 hour",
    "No registration required — 100% free",
    "Works on all modern browsers",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const POLL_INTERVAL  = 2000;
const MAX_RETRIES    = 30;

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ImageToPdfConverter: React.FC = () => {
    const [activeTab, setActiveTab]     = useState<"image-to-pdf" | "file-converter">("image-to-pdf");
    const [files, setFiles]             = useState<UploadedFile[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionJob, setConversionJob] = useState<StatusResponse | null>(null);

    // ✅ Fixed: use a ref for the poll timer so we can cancel it on unmount
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ✅ Clean up on unmount — revoke object URLs & cancel any pending poll
    useEffect(() => {
        return () => {
            files.forEach(f => URL.revokeObjectURL(f.previewUrl));
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
        }));
        setFiles(prev => [...prev, ...newFiles]);
        toast.success(`Added ${acceptedFiles.length} file(s)`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"] },
        maxSize: MAX_FILE_SIZE,
        multiple: true,
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(({ file, errors }) => {
                const isTooLarge = errors.some(e => e.code === "file-too-large");
                toast.error(
                    isTooLarge
                        ? `${file.name} exceeds the 10MB limit`
                        : `${file.name} is not a supported image type`
                );
            });
        },
    });

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const removed = prev.find(f => f.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const clearAllFiles = useCallback(() => {
        if (files.length === 0) return;
        if (!window.confirm("Remove all files?")) return;
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setConversionJob(null);
    }, [files]);

    // ✅ Fixed: ref-based retry counter avoids stale closure; timer stored in ref for cleanup
    const pollConversionStatus = useCallback((jobId: string) => {
        let retryCount = 0;

        const poll = async () => {
            if (retryCount >= MAX_RETRIES) {
                toast.error("Conversion timed out. Please try again.");
                setIsConverting(false);
                return;
            }
            try {
                const response = await api.getJobStatus(jobId);
                if (response.success && response.data) {
                    const jobData = response.data;
                    setConversionJob(jobData);

                    if (jobData.is_completed) {
                        setIsConverting(false);
                        if (jobData.download_url) toast.success("PDF ready to download!");
                        return;
                    }
                    if (jobData.status === "failed") {
                        setIsConverting(false);
                        toast.error("Conversion failed. Please try again.");
                        return;
                    }
                }
            } catch {
                // swallow poll errors; just retry
            }
            retryCount++;
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
        };

        poll();
    }, []);

    const convertToPdf = useCallback(async () => {
        if (files.length === 0) {
            toast.error("Please upload at least one image");
            return;
        }
        setIsConverting(true);
        setConversionJob(null);
        try {
            const response = await api.uploadImages(files.map(f => f.file));
            if (response.success && response.data) {
                toast.success("Conversion started!");
                pollConversionStatus(response.data.job_id);
            } else {
                throw new Error(response.message || "Failed to start conversion");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start conversion");
            setIsConverting(false);
        }
    }, [files, pollConversionStatus]);

    const handleDownload = useCallback(async () => {
        if (!conversionJob?.download_url) return;
        try {
            const blob = await api.downloadPdf(conversionJob.job_id);
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement("a"), {
                href: url,
                download: conversionJob.filename,
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to download PDF");
        }
    }, [conversionJob]);

    // ✅ Wrapped in useCallback for consistency
    const resetConverter = useCallback(() => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setConversionJob(null);
        setIsConverting(false);
    }, [files]);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 transition-colors">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="flex space-x-2 mb-8 bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-fit">
                    {(["image-to-pdf", "file-converter"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            aria-selected={activeTab === tab}
                            role="tab"
                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === tab
                                    ? "bg-red-600 text-white shadow-md"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            {tab === "image-to-pdf" ? "Image to PDF" : "File Converter"}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === "image-to-pdf" ? (
                            <>
                                {/* Drop Zone */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Images</h2>
                                        {files.length > 0 && (
                                            <button
                                                onClick={clearAllFiles}
                                                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {/* ✅ Fixed: border-2 instead of non-existent border-3 */}
                                    <div
                                        {...getRootProps()}
                                        role="button"
                                        aria-label="Upload images by clicking or dragging and dropping"
                                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                                            isDragActive
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                    >
                                        {/* ✅ Fixed: no external ref passed to getInputProps */}
                                        <input {...getInputProps()} />
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full">
                                                <Upload className="h-8 w-8 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {isDragActive ? "Drop images here" : "Drag & drop or click to browse"}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                                                    JPG, PNG, GIF, BMP, WebP — up to 10MB each
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {files.length > 0 && (
                                        <div className="mt-6 grid grid-cols-3 gap-3">
                                            {[
                                                { label: "Files",      value: files.length,                       bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700 dark:text-blue-400"   },
                                                { label: "Total Size", value: formatFileSize(totalSize),          bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400" },
                                                { label: "Est. Time",  value: `~${Math.ceil(files.length * 0.5)}s`, bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400" },
                                            ].map(({ label, value, bg, text }) => (
                                                <div key={label} className={`${bg} rounded-xl p-4`}>
                                                    <div className={`text-2xl font-bold ${text}`}>{value}</div>
                                                    <div className={`text-xs font-medium mt-1 ${text} opacity-80`}>{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                Uploaded Images
                                                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    ({files.length})
                                                </span>
                                            </h2>
                                            <p className="text-xs text-gray-400">Click × to remove</p>
                                        </div>

                                        <div className="space-y-2">
                                            {files.map(file => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3 min-w-0">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                                            {file.previewUrl
                                                                ? <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                                                : <ImageIcon className="h-6 w-6 text-gray-400 m-3" />
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{file.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        disabled={isConverting}
                                                        aria-label={`Remove ${file.name}`}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 ml-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                                    <button
                                        onClick={convertToPdf}
                                        disabled={files.length === 0 || isConverting}
                                        aria-busy={isConverting}
                                        className={`w-full py-4 px-6 rounded-xl text-base font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
                                            files.length === 0 || isConverting
                                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                                : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                                        }`}
                                    >
                                        {isConverting ? (
                                            <><RefreshCw className="h-5 w-5 animate-spin" /><span>Converting...</span></>
                                        ) : (
                                            <><File className="h-5 w-5" /><span>Convert to PDF</span></>
                                        )}
                                    </button>

                                    {conversionJob && (
                                        <div className="mt-6">
                                            <ConversionProgress job={conversionJob} onDownload={handleDownload} />
                                        </div>
                                    )}

                                    {conversionJob?.is_completed && (
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={handleDownload}
                                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                                            >
                                                <Download className="h-5 w-5 mr-2" />
                                                Download PDF
                                            </button>
                                            <button
                                                onClick={resetConverter}
                                                className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                                            >
                                                Convert Another
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <FileConverter />
                        )}
                    </div>

                    {/* Right Column — Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">How to Convert</h2>
                            <div className="space-y-5">
                                {STEPS.map(({ number, title, description, color }) => {
                                    const styles = STEP_STYLES[color]; // ✅ No dynamic Tailwind interpolation
                                    return (
                                        <div key={number} className="flex items-start space-x-4">
                                            <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${styles.bg} flex items-center justify-center`}>
                                                <span className={`text-sm font-bold ${styles.text}`}>{number}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Tips</h3>
                                <ul className="space-y-2">
                                    {TIPS.map(tip => (
                                        <li key={tip} className="flex items-start space-x-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Limits & Formats</h3>
                            </div>
                            <dl className="space-y-2 text-sm">
                                {[
                                    ["Max file size",    "10MB per image"],
                                    ["Supported formats","JPG, PNG, GIF, BMP, WebP"],
                                    ["Max images",       "50 per conversion"],
                                    ["Processing time",  "~0.5s per image"],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-4 pt-4 border-t border-red-100 dark:border-red-900/30 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <span>Files auto-delete after 1 hour</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImageToPdfConverter;