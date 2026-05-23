import React, { useState, useCallback } from "react";
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
import ConversionProgress from "../components/ConversionProgress";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { usePdfTool } from "../hooks/usePdfTool";

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

    const handleDownload = () => {
        downloadFile((id) => api.downloadOrganizePdf(id));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4 transition-colors">
                    <Layout className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Organize PDF</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                    Remove unwanted pages from your PDF file.
                    Keep only the pages you need and discard the rest.
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
                        {file ? file.name : 'Click or drag PDF to organize'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                </div>

                {file && (
                    <div className="p-8 space-y-6">
                        <div>
                            <Input
                                label="Pages to Remove"
                                type="text"
                                value={pagesToRemove}
                                onChange={(e) => setPagesToRemove(e.target.value)}
                                placeholder="e.g. 2, 4, 6"
                                icon={<Trash2 className="h-5 w-5" />}
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
                                            Download Organized PDF
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
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizePdf;
