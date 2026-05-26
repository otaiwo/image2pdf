import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Tags,
    RefreshCw,
    Sparkles,
    CheckCircle2,
    Copy,
    Layout,
    Hash
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const ExtractKeywords: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [keywords, setKeywords] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setKeywords(null);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleExtract = async () => {
        if (!file) return;

        setIsProcessing(true);
        setKeywords(null);

        try {
            const response = await api.uploadAiKeywords(file);
            if (response.success && response.job_id) {
                pollStatus(response.job_id);
            } else {
                throw new Error(response.message || "Failed to start extraction");
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
                        setKeywords(response.data.keywords);
                        setIsProcessing(false);
                        toast.success("Keywords extracted!");
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(response.data.error || "Extraction failed");
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
        if (keywords) {
            navigator.clipboard.writeText(keywords);
            toast.success("Keywords copied to clipboard");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
                    <Tags className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Keyword Extractor</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Automatically identify the most important topics and keywords from your PDF documents.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div
                            {...getRootProps()}
                            className={`p-10 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-900">
                                {file ? file.name : 'Click or drag PDF to analyze'}
                            </p>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={handleExtract}
                                disabled={!file || isProcessing}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    !file || isProcessing
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Extracting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        <span>Extract Keywords</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                            <Layout className="h-5 w-5 mr-2 text-blue-600" />
                            Use Cases
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600">
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

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 flex items-center">
                            <Hash className="h-5 w-5 mr-2 text-blue-600" />
                            Extracted Tags
                        </h2>
                        {keywords && (
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-blue-600"
                            >
                                <Copy className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="p-8 flex-grow">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
                                <p className="text-gray-500 font-medium">Extracting keywords...</p>
                            </div>
                        ) : keywords ? (
                            <div className="flex flex-wrap gap-3">
                                {keywords.split(',').map((kw, i) => (
                                    <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
                                        {kw.trim()}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Tags className="h-12 w-12 opacity-20" />
                                <p>Extracted keywords will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtractKeywords;
