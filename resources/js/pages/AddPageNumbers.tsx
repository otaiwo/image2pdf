import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Hash,
    X,
    Layout
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import type { StatusResponse } from "../types/api";

const AddPageNumbers: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [position, setPosition] = useState<string>("bottom_center");
    const [startAt, setStartAt] = useState<number>(1);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Add Page Numbers", {
        onSuccess: () => toast.success("Page numbers added!")
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
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleAddNumbers = async () => {
        if (!file) return;

        await startJob(
            () => api.uploadPageNumbers(file, position, startAt),
            (id) => api.getPageNumbersStatus(id)
        );
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadPageNumbersPdf(id), jobToDownload?.filename);
    };

    const sidebarContent = file && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Hash className="h-5 w-5 mr-2 text-red-600" />
                    Pagination Settings
                </h3>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Position
                    </label>
                    <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="top_left">Top Left</option>
                        <option value="top_center">Top Center</option>
                        <option value="top_right">Top Right</option>
                        <option value="bottom_left">Bottom Left</option>
                        <option value="bottom_center">Bottom Center</option>
                        <option value="bottom_right">Bottom Right</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Start At Page
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={startAt}
                        onChange={(e) => setStartAt(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <Button
                    onClick={handleAddNumbers}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full"
                >
                    <Hash className="h-5 w-5 mr-2" />
                    Add Numbers
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Add Page Numbers"
            description="Number your PDF pages automatically. Choose your preferred position and starting number."
            icon={Hash}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={() => { setFile(null); reset(); }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {!file && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        <div {...getRootProps()} className="p-24 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-200">
                            <input {...getInputProps()} />
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full mb-6">
                                <Upload className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select PDF File</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">or drag and drop your PDF here</p>
                        </div>
                    </div>
                )}
                {file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl"><Layout className="h-8 w-8 text-red-600" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">{file.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"><X className="h-6 w-6" /></button>
                    </div>
                )}
                {job?.is_completed && <div className="animate-in zoom-in-95 duration-500"><ChainedToolAction currentTool="Add Page Numbers" /></div>}
            </div>
        </ToolLayout>
    );
};

export default AddPageNumbers;
