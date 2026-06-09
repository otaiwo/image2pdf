import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    File as FileIcon,
    RefreshCw,
    ScanText,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse, FileUploadResponse } from "../types/api";
import ConversionProgress from "./ConversionProgress";
import { ChainedToolAction } from "./ChainedToolAction";
import UploadDropzone from "./UploadDropzone";

type ConversionType = "file_to_pdf" | "pdf_to_txt" | "pdf_to_docx" | "pdf_to_xlsx" | "pdf_to_pptx";

interface FileConverterProps {
    initialType?: ConversionType;
    showTypeSelector?: boolean;
}

const FileConverter: React.FC<FileConverterProps> = ({ 
    initialType = "file_to_pdf",
    showTypeSelector = true 
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<ConversionType>(initialType);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionJob, setConversionJob] = useState<StatusResponse | null>(
        null,
    );
    const [validationInfo, setValidationInfo] = useState<FileUploadResponse | null>(null);
    const [dismissedOcr, setDismissedOcr] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 20 * 1024 * 1024, // 20MB
    });

    const convertFile = useCallback(async () => {
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        setIsConverting(true);
        setConversionJob(null);
        setValidationInfo(null);
        setDismissedOcr(false);

        try {
            const response = await api.uploadFile(file, type);

            // Store validation info for OCR banner display
            setValidationInfo(response);

            if (response.validation?.ocr_recommended && !dismissedOcr) {
                toast.success("OCR recommended for this PDF");
            }

            const jobId = response.job_id;
            if (jobId) {
                toast.success("Conversion started!");
                pollStatus(jobId);
            } else {
                throw new Error(response.message || "Failed to start conversion");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start conversion");
            setIsConverting(false);
        }
    }, [file, type]);

    const pollStatus = useCallback(async (jobId: string) => {
        const poll = async () => {
            try {
                const response = await api.getFileConverterStatus(jobId);

                if (response) {
                    const jobData = response;
                    setConversionJob(jobData);

                    if (jobData.is_completed) {
                        setIsConverting(false);
                        toast.success("Conversion completed!");
                    } else if (jobData.status === "failed") {
                        setIsConverting(false);
                        toast.error(jobData.error || "Conversion failed");
                    } else {
                        setTimeout(poll, 2000);
                    }
                }
            } catch (error) {
                setTimeout(poll, 2000);
            }
        };
        poll();
    }, []);

    const handleDismissOcr = useCallback(() => {
        setDismissedOcr(true);
    }, []);

    const handleDownload = useCallback(async () => {
        if (!conversionJob?.job_id) return;

        try {
            const blob = await api.downloadConvertedFile(conversionJob.job_id);

            // The blob might contain an error JSON if the backend returned 4xx/5xx
            // but Axios with responseType: 'blob' will still wrap it in a Blob.
            if (blob.type === 'application/json') {
                const text = await blob.text();
                const json = JSON.parse(text);
                if (json.success === false) {
                    toast.error(json.message || "Failed to download file");
                    return;
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Use the filename provided by the job status, falling back to a generic name if missing
            const fallbackExt = type === 'pdf_to_txt' ? 'txt' : (type === 'pdf_to_docx' ? 'docx' : type === 'pdf_to_xlsx' ? 'xlsx' : type === 'pdf_to_pptx' ? 'pptx' : 'pdf');
            link.download = conversionJob.filename || `converted.${fallbackExt}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download file");
        }
    }, [conversionJob, type]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-8 border border-gray-100 dark:border-gray-800">
            {showTypeSelector && (
                <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
                    {(["file_to_pdf", "pdf_to_txt", "pdf_to_docx", "pdf_to_xlsx", "pdf_to_pptx"] as ConversionType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                setType(t);
                                setFile(null);
                                setConversionJob(null);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                type === t
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            {t.replace(/_/g, " ").toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <UploadDropzone
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                title={file ? file.name : "Select File"}
                activeTitle="Drop file here"
                subtitle="Click to upload or drag and drop"
                hint={type === "file_to_pdf" ? "TXT · DOCX · PPTX" : "PDF"}
                compact
            />

            {validationInfo?.validation?.ocr_recommended && !dismissedOcr && file && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                            <ScanText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                OCR Recommended
                            </h4>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                                {validationInfo.validation.ocr_reason || 'PDF contains images that may benefit from OCR processing'}
                            </p>
                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                                OCR will extract text from images, making the content searchable and more usable.
                            </p>
                        </div>
                        <button
                            onClick={handleDismissOcr}
                            className="shrink-0 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                            title="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {file && (
                <button
                    onClick={convertFile}
                    disabled={isConverting}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors"
                >
                    {isConverting ? (
                        <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Converting...</span>
                        </>
                    ) : (
                        <>
                            <FileIcon className="h-5 w-5" />
                            <span>Convert Now</span>
                        </>
                    )}
                </button>
            )}

            {conversionJob && (
                <div className="space-y-6">
                    <ConversionProgress
                        job={conversionJob}
                        onDownload={handleDownload}
                    />
                    {conversionJob.is_completed && (
                        <ChainedToolAction currentTool={type.replace(/_/g, " ").toUpperCase()} />
                    )}
                </div>
            )}
        </div>
    );
};

export default FileConverter;
