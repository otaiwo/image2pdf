import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File as FileIcon,
    Lock,
    RefreshCw,
    Download,
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { api, StatusResponse } from "../utils/api";
import ConversionProgress from "../components/ConversionProgress";

const ProtectPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [job, setJob] = useState<StatusResponse | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setJob(null);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleProtect = async () => {
        if (!file) return;
        if (password.length < 4) {
            toast.error("Password must be at least 4 characters long");
            return;
        }

        setIsProcessing(true);
        setJob(null);

        try {
            const response = await api.uploadProtectFile(file, password);
            if (response.success && response.job_id) {
                toast.success("Upload successful, encrypting started...");
                pollStatus(response.job_id);
            } else {
                throw new Error(response.message || "Upload failed");
            }
        } catch (error: any) {
            toast.error(error.message);
            setIsProcessing(false);
        }
    };

    const pollStatus = async (jobId: string) => {
        const check = async () => {
            try {
                const response = await api.getProtectStatus(jobId);
                if (response.success && response.data) {
                    setJob(response.data);
                    if (response.data.is_completed) {
                        setIsProcessing(false);
                        toast.success("PDF protected successfully!");
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(response.data.error || "Protection failed");
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
            const blob = await api.downloadProtectPdf(job.job_id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = job.filename || "protected.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download protected PDF");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-2xl mb-4">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Protect PDF</h1>
                <p className="text-gray-600 max-w-lg mx-auto">
                    Secure your PDF document with a password.
                    Prevent unauthorized access and keep your information private.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div
                    {...getRootProps()}
                    className={`p-10 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-900">
                        {file ? file.name : 'Click or drag PDF to protect'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                </div>

                {file && (
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Set PDF Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter secure password"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {!job?.is_completed && (
                            <button
                                onClick={handleProtect}
                                disabled={isProcessing || password.length < 4}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    isProcessing || password.length < 4
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Encrypting PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5" />
                                        <span>Protect PDF</span>
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
                                            <span>Download Protected PDF</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setPassword("");
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

export default ProtectPdf;
