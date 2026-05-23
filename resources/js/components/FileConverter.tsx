import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File as FileIcon,
    X,
    Download,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, StatusResponse } from "../utils/api";
import ConversionProgress from "./ConversionProgress";

type ConversionType = "file_to_pdf" | "pdf_to_txt" | "pdf_to_docx";

const FileConverter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState<ConversionType>("file_to_pdf");
    const [isConverting, setIsConverting] = useState(false);
    const [conversionJob, setConversionJob] = useState<StatusResponse | null>(
        null,
    );

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

        try {
            const response = await api.uploadFile(file, type);

            if (response.success && response.data) {
                toast.success("Conversion started!");
                pollStatus(response.data.job_id);
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

                if (response.success && response.data) {
                    const jobData = response.data;
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

            // The filename is now handled by the Content-Disposition header from the server
            // but we can provide a fallback.
            let ext = 'pdf';
            if (type === 'pdf_to_txt') ext = 'txt';
            if (type === 'pdf_to_docx') ext = 'docx';
            link.download = `converted.${ext}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download file");
        }
    }, [conversionJob, type]);

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-8">
            <div className="flex space-x-4 mb-6">
                {(["file_to_pdf", "pdf_to_txt", "pdf_to_docx"] as ConversionType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setType(t);
                            setFile(null);
                            setConversionJob(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            type === t
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {t.replace(/_/g, " ").toUpperCase()}
                    </button>
                ))}
            </div>

            <div
                {...getRootProps()}
                className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
            >
                <input {...getInputProps()} />
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {file ? file.name : "Drag & drop or click to browse"}
                        </h3>
                        <p className="text-gray-600 mt-2">
                            {type === "file_to_pdf"
                                ? "Supports: TXT, DOCX, PPTX"
                                : "Supports: PDF"}
                        </p>
                    </div>
                </div>
            </div>

            {file && (
                <button
                    onClick={convertFile}
                    disabled={isConverting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
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
                <ConversionProgress
                    job={conversionJob}
                    onDownload={handleDownload}
                />
            )}
        </div>
    );
};

export default FileConverter;
