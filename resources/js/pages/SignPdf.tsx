import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    PenTool,
    X,
    Image as ImageIcon,
    Check
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";

const SignPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [signature, setSignature] = useState<File | null>(null);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Sign PDF", {
        onSuccess: () => toast.success("PDF signed successfully!")
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

    const handleSign = async () => {
        if (!file || !signature) return;

        await startJob(
            () => api.uploadSignPdf(file, signature),
            (id) => api.getSignStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadSignPdf(id), jobToDownload?.filename);
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <PenTool className="h-5 w-5 mr-2 text-red-600" />
                    Signature Settings
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Your Signature (Image)
                    </label>
                    {!signature ? (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                             onClick={() => document.getElementById('sig-upload')?.click()}>
                            <ImageIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload signature image</span>
                            <input id="sig-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setSignature(e.target.files?.[0] || null)} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-medium truncate max-w-[150px]">{signature.name}</span>
                            </div>
                            <button onClick={() => setSignature(null)} className="p-1 hover:text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSign}
                    isLoading={isProcessing}
                    disabled={!signature || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <PenTool className="h-5 w-5 mr-2" />
                    Sign & Save
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Sign PDF"
            description="Electronically sign your PDF documents. Upload an image of your signature and place it on any page."
            icon={PenTool}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={() => { setFile(null); setSignature(null); reset(); }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {!file && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-24 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all"
                         onClick={() => document.getElementById('pdf-upload')?.click()}>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full mb-6">
                            <Upload className="h-10 w-10 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select PDF File</h3>
                        <p className="text-sm text-gray-500">Click or drag and drop your document here</p>
                        <input id="pdf-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                )}
                {file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-between transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl"><PenTool className="h-8 w-8 text-red-600" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">{file.name}</h3>
                                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="h-6 w-6" /></button>
                    </div>
                )}
                {job?.is_completed && <div className="animate-in zoom-in-95 duration-500"><ChainedToolAction currentTool="Sign PDF" /></div>}
            </div>
        </ToolLayout>
    );
};

export default SignPdf;
