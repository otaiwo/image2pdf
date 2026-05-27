import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Tags,
    Sparkles,
    CheckCircle2,
    Copy,
    Layout,
    Hash,
    Download
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";

const ExtractKeywords: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [keywords, setKeywords] = useState<string | null>(null);

    const { isProcessing, job, startJob, reset } = usePdfTool("AI Keywords", {
        onSuccess: (data) => {
            setKeywords(data.keywords || null);
            toast.success("Keywords extracted!");
        }
    });

    useEffect(() => {
        if (job?.is_completed && job.keywords) {
            setKeywords(job.keywords);
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setKeywords(null);
            reset();
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleExtract = async () => {
        if (!file) return;

        setKeywords(null);

        await startJob(
            () => api.uploadAiKeywords(file),
            (id) => api.getAiStatus(id)
        );
    };

    const copyToClipboard = () => {
        if (keywords) {
            navigator.clipboard.writeText(keywords);
            toast.success("Keywords copied to clipboard");
        }
    };

    const downloadAsText = () => {
        if (keywords) {
            const blob = new Blob([keywords], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `keywords_${file?.name.replace('.pdf', '') || 'document'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <ToolLayout
            title="AI Keyword Extractor"
            description="Automatically identify the most important topics and keywords from your PDF documents."
            icon={Tags}
            layoutVariant="split"
        >
            <div className="flex flex-col h-full gap-8">
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
                                {file ? file.name : 'Click or drag PDF to analyze'}
                            </p>
                        </div>

                        <div className="p-6">
                            <Button
                                onClick={handleExtract}
                                isLoading={isProcessing}
                                disabled={!file}
                                size="lg"
                                className="w-full"
                            >
                                <Sparkles className="h-5 w-5 mr-2" />
                                Extract Keywords
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Layout className="h-5 w-5 mr-2 text-blue-600" />
                            Use Cases
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                SEO & Content optimization
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                Document tagging & Organization
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                                Quick subject matter identification
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Hash className="h-5 w-5 mr-2 text-red-600" />
                            Extracted Tags
                        </h2>
                        {keywords && (
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
                                <div className="h-12 w-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Extracting keywords...</p>
                            </div>
                        ) : keywords ? (
                        <>
                            <div className="flex flex-wrap gap-3">
                                {keywords.split(',').map((kw, i) => (
                                    <span key={i} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-bold border border-red-100 dark:border-red-900/30">
                                        {kw.trim()}
                                    </span>
                                ))}
                            </div>
                            <ChainedToolAction currentTool="AI Keywords" />
                        </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Tags className="h-12 w-12 opacity-20" />
                                <p>Extracted keywords will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default ExtractKeywords;
