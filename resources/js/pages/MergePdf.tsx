import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File as FileIcon,
    X,
    Download,
    RefreshCw,
    FileStack,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { api, StatusResponse } from "../utils/api";
import ConversionProgress from "../components/ConversionProgress";

interface MergeFile {
    id: string;
    file: File;
}

const MergePdf: React.FC = () => {
    const [files, setFiles] = useState<MergeFile[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [job, setJob] = useState<StatusResponse | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file
        }));
        setFiles(prev => [...prev, ...newFiles]);
        toast.success(`Added ${acceptedFiles.length} files`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        minSize: 0,
        multiple: true
    });

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Please select at least 2 PDF files to merge");
            return;
        }

        setIsConverting(true);
        setJob(null);

        try {
            const response = await api.uploadMergeFiles(files.map(f => f.file));
            if (response.success && response.job_id) {
                toast.success("Upload successful, merging started...");
                pollStatus(response.job_id);
            } else {
                throw new Error(response.message || "Upload failed");
            }
        } catch (error: any) {
            toast.error(error.message);
            setIsConverting(false);
        }
    };

    const pollStatus = async (jobId: string) => {
        const check = async () => {
            try {
                const response = await api.getMergeStatus(jobId);
                if (response.success && response.data) {
                    setJob(response.data);
                    if (response.data.is_completed) {
                        setIsConverting(false);
                        toast.success("PDFs merged successfully!");
                    } else if (response.data.status === 'failed') {
                        setIsConverting(false);
                        toast.error(response.data.error || "Merging failed");
                    } else {
                        setTimeout(check, 2000);
                    }
                }
            } catch (error) {
                setTimeout(check, 2000);
            }
        };
        check();
    };

    const handleDownload = async () => {
        if (!job?.job_id) return;
        try {
            const blob = await api.downloadMergePdf(job.job_id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = job.filename || "merged.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download merged PDF");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-2xl mb-4">
                    <FileStack className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF</h1>
                <p className="text-gray-600 max-w-lg mx-auto">
                    Combine multiple PDFs into one document in seconds.
                    Drag and drop to reorder your files.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div
                    {...getRootProps()}
                    className={`p-12 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">
                        {isDragActive ? 'Drop your PDFs here' : 'Click or drag PDFs to upload'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Maximum 20MB per file</p>
                </div>

                {files.length > 0 && (
                    <div className="p-6">
                        <div className="space-y-3 mb-8">
                            {files.map((f, index) => (
                                <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <FileIcon className="h-5 w-5 text-red-600" />
                                        </div>
                                        <span className="font-medium text-gray-900 truncate max-w-xs md:max-w-md">
                                            {f.file.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(f.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        disabled={isConverting}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {!job?.is_completed && (
                            <button
                                onClick={handleMerge}
                                disabled={isConverting || files.length < 2}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    isConverting || files.length < 2
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                                }`}
                            >
                                {isConverting ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Merging PDFs...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileStack className="h-5 w-5" />
                                        <span>Merge PDF</span>
                                    </>
                                )}
                            </button>
                        )}

                        {job && (
                            <div className="mt-8">
                                <ConversionProgress job={job} onDownload={handleDownload} />

                                {job.is_completed && (
                                    <div className="flex gap-4 mt-6">
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-green-200"
                                        >
                                            <Download className="h-5 w-5" />
                                            <span>Download Merged PDF</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFiles([]);
                                                setJob(null);
                                            }}
                                            className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MergePdf;
