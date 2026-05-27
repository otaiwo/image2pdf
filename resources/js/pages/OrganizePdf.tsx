import React, { useState, useCallback } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Layout,
    Download,
    X,
    Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import ConversionProgress from "../components/ConversionProgress";
import { ChainedToolAction } from "../components/ChainedToolAction";

const OrganizePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pagesToRemove, setPagesToRemove] = useState<string>("");

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Organize PDF", {
        onSuccess: () => toast.success("PDF organized successfully!")
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

    const handleOrganize = async () => {
        if (!file) return;
        if (!pagesToRemove.trim()) {
            toast.error("Please enter page numbers to remove (e.g. 2, 4)");
            return;
        }

        await startJob(
            () => api.uploadOrganizeFile(file, pagesToRemove),
            (id) => api.getOrganizeStatus(id)
        );
    };

    const handleDownload = async () => {
        await downloadFile((id) => api.downloadOrganizePdf(id));
    };

    return (
        <ToolLayout
            title="Organize PDF"
            description="Remove unwanted pages from your PDF file. Keep only the pages you need and discard the rest."
            icon={Layout}
            sidebar={
                file && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Layout className="h-5 w-5 mr-2 text-red-600" />
                            Organize Settings
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                                <Trash2 className="h-3 w-3 mr-2" />
                                Pages to Remove
                            </label>
                            <input
                                type="text"
                                value={pagesToRemove}
                                onChange={(e) => setPagesToRemove(e.target.value)}
                                placeholder="e.g. 2, 4, 6"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Enter comma-separated page numbers you want to delete.
                            </p>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleOrganize}
                                isLoading={isProcessing}
                                disabled={!pagesToRemove.trim()}
                                size="lg"
                                className="w-full"
                            >
                                <X className="h-5 w-5 mr-2" />
                                Remove Pages
                            </Button>
                        )}
                    </div>
                )
            }
        >
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div
                        {...getRootProps()}
                        className={`p-10 border-b border-gray-100 dark:border-gray-800 text-center cursor-pointer transition-colors ${
                            isDragActive ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                        <p className="font-medium text-gray-900 dark:text-white">
                            {file ? file.name : 'Click or drag PDF to organize'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                    </div>

                    <div className="p-8">
                        {job && (
                            <div className="space-y-6">
                                <ConversionProgress job={job} onDownload={handleDownload} />

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
                                                Download PDF
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setFile(null);
                                                    setPagesToRemove("");
                                                    reset();
                                                }}
                                                variant="outline"
                                                size="lg"
                                            >
                                                Start Over
                                            </Button>
                                        </div>
                                        <ChainedToolAction currentTool="Organize PDF" />
                                    </>
                                )}
                            </div>
                        )}

                        {!job && (
                            <div className="text-center py-12 text-gray-400">
                                <Layout className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Specify pages to remove in the sidebar to proceed.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default OrganizePdf;
