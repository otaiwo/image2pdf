import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    File as FileIcon,
    X,
    Download,
    FileStack
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { createPdfValidator } from "../utils/fileValidation";
import type { StatusResponse } from "../types/api";
import ConversionProgress from "../components/ConversionProgress";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";
import UploadDropzone from "../components/UploadDropzone";

interface MergeFile {
    id: string;
    file: File;
}

const MergePdf: React.FC = () => {
    const [files, setFiles] = useState<MergeFile[]>([]);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    const {
        isProcessing,
        job,
        startJob,
        downloadFile,
        reset
    } = usePdfTool("Merge PDF", {
        onSuccess: () => {
            toast.success("PDFs merged successfully!");
        }
    });

    useEffect(() => {
        if (job?.is_completed) {
            setCompletedJobs((prev) => {
                const exists = prev.find(
                    (j) => j.job_id === job.job_id
                );

                if (exists) {
                    return prev;
                }

                return [...prev, job];
            });
        }
    }, [job]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const validator = createPdfValidator();
        const newFiles: MergeFile[] = [];

        for (const file of acceptedFiles) {
            const result = await validator.validate(file);

            if (result.isValid) {
                newFiles.push({
                    id: crypto.randomUUID(),
                    file
                });
            } else {
                toast.error(`${file.name}: ${result.errors[0]}`);
            }
        }

        if (newFiles.length === 0) {
            return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Added ${newFiles.length} file${newFiles.length === 1 ? "" : "s"}`);
    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive
    } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"]
        },
        multiple: true
    });

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Please select at least 2 PDF files");
            return;
        }

        await startJob(
            () => api.uploadMergeFiles(files.map((f) => f.file)),
            (id) => api.getMergeStatus(id)
        );
    };

    const handleDownload = async () => {
        await downloadFile((id) =>
            api.downloadMergePdf(id)
        );
    };

    const handleReset = () => {
        setFiles([]);
        reset();
    };

    return (
        <ToolLayout
            title="Merge PDF"
            description="Combine multiple PDF files into one document in seconds."
            icon={FileStack}
            jobs={completedJobs}
            onDownload={() => handleDownload()}
        >
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <UploadDropzone
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                        isDragActive={isDragActive}
                        title="Select PDF Files"
                        activeTitle="Drop your PDFs here"
                        subtitle="Click to upload or drag and drop PDFs here"
                        hint="Upload multiple PDF files"
                        compact
                        className="rounded-none shadow-none border-0 border-b border-gray-100 dark:border-gray-800"
                    />

                    {files.length > 0 && (
                        <div className="p-6">
                            <div className="space-y-3 mb-8">
                                {files.map((f) => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <FileIcon className="h-5 w-5 text-red-600" />
                                            </div>

                                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs md:max-w-md">
                                                {f.file.name}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() =>
                                                removeFile(f.id)
                                            }
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            disabled={isProcessing}
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {!job?.is_completed && (
                                <Button
                                    onClick={handleMerge}
                                    isLoading={isProcessing}
                                    disabled={
                                        files.length < 2
                                    }
                                    size="lg"
                                    className="w-full"
                                >
                                    <FileStack className="h-5 w-5 mr-2" />
                                    Merge PDF
                                </Button>
                            )}

                            {job && (
                                <div className="mt-8">
                                    <ConversionProgress
                                        job={job}
                                        onDownload={() =>
                                            handleDownload()
                                        }
                                    />

                                    {job.is_completed && (
                                        <>
                                            <div className="flex gap-4 mt-6">
                                                <Button
                                                    onClick={() =>
                                                        handleDownload()
                                                    }
                                                    variant="success"
                                                    size="lg"
                                                    className="flex-1"
                                                >
                                                    <Download className="h-5 w-5 mr-2" />
                                                    Download Merged PDF
                                                </Button>

                                                <Button
                                                    onClick={handleReset}
                                                    variant="outline"
                                                    size="lg"
                                                >
                                                    Start Over
                                                </Button>
                                            </div>
                                            <ChainedToolAction currentTool="Merge PDF" />
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

export default MergePdf;
