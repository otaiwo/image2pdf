import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Lock,
    Download,
    Eye,
    EyeOff,
    ShieldCheck,
    FileLock2
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import ConversionProgress from "../components/ConversionProgress";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { usePdfTool } from "../hooks/usePdfTool";

const ProtectPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Protect PDF", {
        onSuccess: () => toast.success("PDF protected successfully!")
    });

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

    const handleProtect = async () => {
        if (!file) return;
        if (password.length < 4) {
            toast.error("Password must be at least 4 characters long");
            return;
        }

        await startJob(
            () => api.uploadProtectFile(file, password),
            (id) => api.getProtectStatus(id)
        );
    };

    const handleDownload = () => {
        downloadFile((id) => api.downloadProtectPdf(id));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4 transition-colors">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Protect PDF</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                    Secure your PDF document with a password.
                    Prevent unauthorized access and keep your information private.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
                <div
                    {...getRootProps()}
                    className={`p-10 border-b border-gray-100 dark:border-gray-800 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 dark:text-white transition-colors">
                        {file ? file.name : 'Click or drag PDF to protect'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                </div>

                {file && (
                    <div className="p-8 space-y-6">
                        <div className="relative">
                            <Input
                                label="Set PDF Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter secure password"
                                icon={<FileLock2 className="h-5 w-5" />}
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleProtect}
                                isLoading={isProcessing}
                                disabled={password.length < 4}
                                size="lg"
                                className="w-full"
                            >
                                <ShieldCheck className="h-5 w-5 mr-2" />
                                Protect PDF
                            </Button>
                        )}

                        {job && (
                            <div className="mt-8">
                                <ConversionProgress job={job as any} onDownload={handleDownload} />

                                {job.is_completed && (
                                    <div className="flex gap-4 mt-6">
                                        <Button
                                            onClick={handleDownload}
                                            variant="success"
                                            size="lg"
                                            className="flex-1"
                                        >
                                            <Download className="h-5 w-5 mr-2" />
                                            Download Protected PDF
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setFile(null);
                                                setPassword("");
                                                reset();
                                            }}
                                            variant="outline"
                                            size="lg"
                                        >
                                            Start Over
                                        </Button>
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
