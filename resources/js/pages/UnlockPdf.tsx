import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Unlock,
    RefreshCw,
    Download,
    Eye,
    EyeOff,
    FileLock2
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import ConversionProgress from "../components/ConversionProgress";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { usePdfTool } from "../hooks/usePdfTool";
import { ChainedToolAction } from "../components/ChainedToolAction";

const UnlockPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Unlock PDF", {
        onSuccess: () => toast.success("PDF unlocked successfully!")
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

    const handleUnlock = async () => {
        if (!file) return;
        if (!password) {
            toast.error("Please enter the PDF password");
            return;
        }

        await startJob(
            () => api.uploadUnlockFile(file, password),
            (id) => api.getUnlockStatus(id)
        );
    };

    const handleDownload = () => {
        downloadFile((id) => api.downloadUnlockPdf(id));
    };

    return (
        <ToolLayout
            title="Unlock PDF"
            description="Remove password protection from your PDF files. Easily access and edit your locked documents."
            icon={Unlock}
        >
            <div className="max-w-4xl mx-auto">
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
                        {file ? file.name : 'Click or drag PDF to unlock'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                </div>

                {file && (
                    <div className="p-8 space-y-6">
                        <Input
                            label="PDF Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter PDF password to unlock"
                            icon={<FileLock2 className="h-5 w-5" />}
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-sm text-red-600 font-bold hover:underline flex items-center"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {showPassword ? "Hide Password" : "Show Password"}
                            </button>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleUnlock}
                                isLoading={isProcessing}
                                disabled={!password}
                                size="lg"
                                className="w-full"
                            >
                                <Unlock className="h-5 w-5 mr-2" />
                                Unlock PDF
                            </Button>
                        )}

                        {job && (
                            <div className="mt-8">
                                <ConversionProgress job={job as any} onDownload={handleDownload} />

                                {job.is_completed && (
                                    <>
                                        <div className="flex gap-4 mt-6">
                                            <Button
                                                onClick={handleDownload}
                                                variant="success"
                                                size="lg"
                                                className="flex-1"
                                            >
                                                <Download className="h-5 w-5 mr-2" />
                                                Download Unlocked PDF
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
                                        <ChainedToolAction currentTool="Unlock PDF" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>
        </ToolLayout>
    );
};

export default UnlockPdf;
