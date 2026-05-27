import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    File as FileIcon,
    Cpu,
    Sparkles,
    CheckCircle2,
    Copy,
    Layout,
    Download
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";

const SummarizePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    const { isProcessing, job, startJob, reset } = usePdfTool("AI Summarizer", {
        onSuccess: (data) => {
            setSummary(data.summary || null);
            toast.success("Summary generated!");
        }
    });

    useEffect(() => {
        if (job?.is_completed && job.summary) {
            setSummary(job.summary);
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setSummary(null);
            reset();
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleSummarize = async () => {
        if (!file) return;

        setSummary(null);

        await startJob(
            () => api.uploadAiSummarize(file),
            (id) => api.getAiStatus(id)
        );
    };

    const copyToClipboard = () => {
        if (summary) {
            navigator.clipboard.writeText(summary);
            toast.success("Summary copied to clipboard");
        }
    };

    const downloadAsText = () => {
        if (summary) {
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `summary_${file?.name.replace('.pdf', '') || 'document'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <ToolLayout
            title="AI PDF Summarizer"
            description="Get the key points of any PDF in seconds. Our advanced AI analyzes your document and provides a concise summary."
            icon={Sparkles}
            layoutVariant="split"
        >
            <div className="flex flex-col h-full gap-8">
                {/* Left side: Upload */}
                <div className="space-y-6">
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
                                {file ? file.name : 'Click or drag PDF to summarize'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Maximum 10MB</p>
                        </div>

                        <div className="p-6">
                            <Button
                                onClick={handleSummarize}
                                isLoading={isProcessing}
                                disabled={!file}
                                size="lg"
                                className="w-full"
                            >
                                <Cpu className="h-5 w-5 mr-2" />
                                Summarize Now
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Layout className="h-5 w-5 mr-2 text-indigo-600" />
                            AI Features
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
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
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <FileIcon className="h-5 w-5 mr-2 text-red-600" />
                            Summary Output
                        </h2>
                        {summary && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={downloadAsText}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                                    title="Download as TXT"
                                >
                                    <Download className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-8 flex-grow">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-16 w-16 rounded-full border-4 border-red-100 border-t-red-600 animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-red-600 animate-pulse" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Our AI is reading your document...</p>
                            </div>
                        ) : summary ? (
                        <>
                            <div className="prose prose-red dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {summary}
                                </div>
                            </div>
                            <ChainedToolAction currentTool="AI Summarizer" />
                        </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Cpu className="h-12 w-12 opacity-20" />
                                <p>Upload a PDF and click "Summarize" to see the results here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default SummarizePdf;
