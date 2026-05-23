import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File,
    X,
    Download,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Image as ImageIcon,
    Clock,
    Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, UploadResponse, StatusResponse } from "../utils/api";
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

const ImageToPdfConverter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"image-to-pdf" | "file-converter">("image-to-pdf");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionJob, setConversionJob] = useState<StatusResponse | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return {
                id,
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                previewUrl: URL.createObjectURL(file),
            };
        });

        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Added ${acceptedFiles.length} file(s)`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true,
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach((file) => {
                if (file.file.size > 10 * 1024 * 1024) {
                    toast.error(`File ${file.file.name} exceeds 10MB limit`);
                } else {
                    toast.error(
                        `File ${file.file.name} is not a supported image type`,
                    );
                }
            });
        },
    });

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => {
            const newFiles = prev.filter((file) => file.id !== id);
            const removedFile = prev.find((f) => f.id === id);
            if (removedFile?.previewUrl) {
                URL.revokeObjectURL(removedFile.previewUrl);
            }
            return newFiles;
        });
        toast.success("File removed");
    }, []);

    const clearAllFiles = useCallback(() => {
        if (files.length === 0) return;

        if (window.confirm("Are you sure you want to remove all files?")) {
            files.forEach((file) => {
                if (file.previewUrl) {
                    URL.revokeObjectURL(file.previewUrl);
                }
            });
            setFiles([]);
            setConversionJob(null);
            toast.success("All files removed");
        }
    }, [files]);

    const convertToPdf = useCallback(async () => {
        if (files.length === 0) {
            toast.error("Please upload at least one image");
            return;
        }

        setIsConverting(true);
        setConversionJob(null);

        try {
            const response = await api.uploadImages(files.map((f) => f.file));

            if (response.success && response.data) {
                toast.success("Conversion started!");
                pollConversionStatus(response.data.job_id);
            } else {
                throw new Error(
                    response.message || "Failed to start conversion",
                );
            }
        } catch (error: any) {
            console.error("Conversion error:", error);
            toast.error(error.message || "Failed to start conversion");
            setIsConverting(false);
        }
    }, [files]);

    const pollConversionStatus = useCallback(async (jobId: string) => {
        let retryCount = 0;
        const maxRetries = 30; // 30 retries = 60 seconds (2 seconds each)

        const poll = async () => {
            if (retryCount >= maxRetries) {
                toast.error("Conversion timeout. Please try again.");
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
                        if (jobData.download_url) {
                            toast.success("PDF conversion completed!");
                        }
                    } else if (jobData.status === "failed") {
                        setIsConverting(false);
                        toast.error("Conversion failed. Please try again.");
                    } else {
                        // Continue polling
                        retryCount++;
                        setTimeout(poll, 2000);
                    }
                } else {
                    retryCount++;
                    setTimeout(poll, 2000);
                }
            } catch (error) {
                console.error("Polling error:", error);
                retryCount++;
                setTimeout(poll, 2000);
            }
        };

        poll();
    }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const handleDownload = useCallback(async () => {
        if (!conversionJob?.download_url) return;

        try {
            const blob = await api.downloadPdf(conversionJob.job_id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = conversionJob.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download PDF");
        }
    }, [conversionJob]);

    const resetConverter = () => {
        files.forEach((file) => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl);
            }
        });
        setFiles([]);
        setConversionJob(null);
        setIsConverting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <File className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Image to PDF Converter
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Convert multiple images into a single PDF
                                    file
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {files.length > 0 &&
                                !isConverting &&
                                !conversionJob?.is_completed && (
                                    <button
                                        onClick={clearAllFiles}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Clear All
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setActiveTab("image-to-pdf")}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === "image-to-pdf"
                                ? "bg-white shadow-md text-blue-600"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        Image to PDF
                    </button>
                    <button
                        onClick={() => setActiveTab("file-converter")}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === "file-converter"
                                ? "bg-white shadow-md text-blue-600"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        File Converter
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upload & File List */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === "image-to-pdf" ? (
                        <>
                        {/* Upload Zone */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Upload Images
                            </h2>

                            <div
                                {...getRootProps()}
                                className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                                    isDragActive
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    {...getInputProps()}
                                    ref={fileInputRef}
                                />
                                <div className="space-y-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                                        <Upload className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {isDragActive
                                                ? "Drop images here"
                                                : "Drag & drop or click to browse"}
                                        </h3>
                                        <p className="text-gray-600 mt-2">
                                            Supports: JPG, PNG, GIF, BMP, WebP
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Maximum 10MB per file
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* File Stats */}
                            {files.length > 0 && (
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-blue-700">
                                            {files.length}
                                        </div>
                                        <div className="text-sm text-blue-600">
                                            Files
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-green-700">
                                            {formatFileSize(totalSize)}
                                        </div>
                                        <div className="text-sm text-green-600">
                                            Total Size
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-purple-700">
                                            ~{Math.ceil(files.length * 0.5)}s
                                        </div>
                                        <div className="text-sm text-purple-600">
                                            Est. Time
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Uploaded Images ({files.length})
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Click × to remove
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {file.previewUrl ? (
                                                        <img
                                                            src={
                                                                file.previewUrl
                                                            }
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate max-w-xs">
                                                        {file.name}
                                                    </p>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {formatFileSize(
                                                            file.size,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    removeFile(file.id)
                                                }
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                disabled={isConverting}
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Convert Button & Progress */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="space-y-6">
                                <button
                                    onClick={convertToPdf}
                                    disabled={
                                        files.length === 0 || isConverting
                                    }
                                    className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-3 ${
                                        files.length === 0 || isConverting
                                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                                    }`}
                                >
                                    {isConverting ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            <span>Converting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <File className="h-5 w-5" />
                                            <span>Convert to PDF</span>
                                        </>
                                    )}
                                </button>

                                {conversionJob && (
                                    <div className="mt-6">
                                        <ConversionProgress
                                            job={conversionJob}
                                            onDownload={handleDownload}
                                        />
                                    </div>
                                )}

                                {conversionJob?.is_completed && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                                        >
                                            <Download className="h-5 w-5 mr-2" />
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={resetConverter}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Convert Another
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        </>
                        ) : (
                            <FileConverter />
                        )}
                    </div>

                    {/* Right Column - Info & Instructions */}
                    <div className="space-y-8">
                        {/* Instructions */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                How to Convert
                            </h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        number: "1",
                                        title: "Upload Images",
                                        description:
                                            "Drag & drop or click to select multiple images",
                                        color: "blue",
                                    },
                                    {
                                        number: "2",
                                        title: "Review Files",
                                        description:
                                            "Check your uploaded images before conversion",
                                        color: "purple",
                                    },
                                    {
                                        number: "3",
                                        title: "Convert & Download",
                                        description:
                                            "Click convert and download your PDF file",
                                        color: "green",
                                    },
                                ].map((step) => (
                                    <div
                                        key={step.number}
                                        className="flex items-start space-x-4"
                                    >
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-lg bg-${step.color}-100 flex items-center justify-center`}
                                        >
                                            <div
                                                className={`font-bold text-${step.color}-600`}
                                            >
                                                {step.number}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="font-medium text-gray-900 mb-4">
                                    Tips
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        "Images are optimized for PDF quality",
                                        "Files are securely deleted after 1 hour",
                                        "No registration required - 100% free",
                                        "Works on all modern browsers",
                                    ].map((tip, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start"
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {tip}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Support Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-100">
                            <div className="flex items-center space-x-3 mb-4">
                                <Info className="h-6 w-6 text-blue-600" />
                                <h3 className="font-medium text-gray-900">
                                    Need Help?
                                </h3>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                                <p>
                                    <strong>Max file size:</strong> 10MB per
                                    image
                                </p>
                                <p>
                                    <strong>Supported formats:</strong> JPG,
                                    PNG, GIF, BMP, WebP
                                </p>
                                <p>
                                    <strong>Max images:</strong> 50 per
                                    conversion
                                </p>
                                <p>
                                    <strong>Processing time:</strong> ~0.5
                                    seconds per image
                                </p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm text-gray-600">
                                        Files auto-delete after 1 hour
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <p className="text-gray-600">
                                © {new Date().getFullYear()} Image to PDF
                                Converter
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Free tool for converting images to PDF
                            </p>
                        </div>
                        <div className="flex space-x-6">
                            <a
                                href="#"
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            >
                                Privacy
                            </a>
                            <a
                                href="#"
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            >
                                Terms
                            </a>
                            <a
                                href="#"
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            >
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ImageToPdfConverter;
