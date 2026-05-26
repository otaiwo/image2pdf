import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Languages,
    RefreshCw,
    Sparkles,
    CheckCircle2,
    Copy,
    Layout,
    Globe
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const TranslatePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [language, setLanguage] = useState("Spanish");

    const languages = [
        "Spanish", "French", "German", "Chinese", "Japanese",
        "Arabic", "Portuguese", "Russian", "Italian", "Hindi"
    ];

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setTranslation(null);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleTranslate = async () => {
        if (!file) return;

        setIsProcessing(true);
        setTranslation(null);

        try {
            const response = await api.uploadAiTranslate(file, language);
            if (response.success && response.job_id) {
                pollStatus(response.job_id);
            } else {
                throw new Error(response.message || "Failed to start translation");
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
                        setTranslation(response.data.translation);
                        setIsProcessing(false);
                        toast.success("Translation completed!");
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(response.data.error || "Translation failed");
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
        if (translation) {
            navigator.clipboard.writeText(translation);
            toast.success("Translation copied to clipboard");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-2xl mb-4">
                    <Languages className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">AI PDF Translator</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Translate your PDF documents into any language while maintaining professional context.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                        <div
                            {...getRootProps()}
                            className={`p-10 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-900">
                                {file ? file.name : 'Click or drag PDF to translate'}
                            </p>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={handleTranslate}
                                disabled={!file || isProcessing}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    !file || isProcessing
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Translating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className="h-5 w-5" />
                                        <span>Translate Now</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-bold text-gray-900 flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-green-600" />
                            Translation Result
                        </h2>
                        {translation && (
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-green-600"
                            >
                                <Copy className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <div className="p-8 flex-grow">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <RefreshCw className="h-12 w-12 text-green-600 animate-spin" />
                                <p className="text-gray-500 font-medium">AI is translating your document...</p>
                            </div>
                        ) : translation ? (
                            <div className="prose prose-green max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {translation}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Languages className="h-12 w-12 opacity-20" />
                                <p>Translation will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslatePdf;
