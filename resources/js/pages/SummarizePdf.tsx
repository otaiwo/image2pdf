import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File as FileIcon,
    Cpu,
    RefreshCw,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Copy,
    Layout
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const SummarizePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setSummary(null);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleSummarize = async () => {
        if (!file) return;

        setIsProcessing(true);
        setSummary(null);

        try {
            const response = await api.uploadAiSummarize(file);
            if (response.success && response.job_id) {
                setJobId(response.job_id);
                pollStatus(response.job_id);
            } else {
                throw new Error(response.message || "Failed to start AI processing");
            }
        } catch (error: any) {
            toast.error(error.message);
            setIsProcessing(false);
        }
    };

    const pollStatus = async (id: string) => {
        const check = async () => {
            try {
                const response = await api.getAiStatus(id);
                if (response.success && response.data) {
                    if (response.data.is_completed) {
                        setSummary(response.data.summary);
                        setIsProcessing(false);
                        toast.success("Summary generated!");
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(response.data.error || "AI processing failed");
                    } else {
                        setTimeout(check, 3000);
                    }
                }
            } catch (error) {
                setTimeout(check, 3000);
            }
        };
        check();
    };

    const copyToClipboard = () => {
        if (summary) {
            navigator.clipboard.writeText(summary);
            toast.success("Summary copied to clipboard");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-2xl mb-4">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">AI PDF Summarizer</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Get the key points of any PDF in seconds. Our advanced AI analyzes your
                    document and provides a concise summary.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: Upload */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div
                            {...getRootProps()}
                            className={`p-10 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'bg-purple-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-900">
                                {file ? file.name : 'Click or drag PDF to summarize'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Maximum 10MB</p>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={handleSummarize}
                                disabled={!file || isProcessing}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    !file || isProcessing
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Analyzing PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <Cpu className="h-5 w-5" />
                                        <span>Summarize Now</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                            <Layout className="h-5 w-5 mr-2 text-indigo-600" />
                            AI Features
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                Extract key insights instantly
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                Multilingual document support
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                Intelligent bullet-point breakdown
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right side: Summary */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 flex items-center">
                            <FileIcon className="h-5 w-5 mr-2 text-purple-600" />
                            Summary Output
                        </h2>
                        {summary && (
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-purple-600"
                                title="Copy to clipboard"
                            >
                                <Copy className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="p-8 flex-grow">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-16 w-16 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-purple-600 animate-pulse" />
                                </div>
                                <p className="text-gray-500 font-medium">Our AI is reading your document...</p>
                            </div>
                        ) : summary ? (
                            <div className="prose prose-purple max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {summary}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Cpu className="h-12 w-12 opacity-20" />
                                <p>Upload a PDF and click "Summarize" to see the results here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummarizePdf;
