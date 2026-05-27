import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Languages,
    Sparkles,
    CheckCircle2,
    Copy,
    Layout,
    Globe,
    Download
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";

const TranslatePdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [translation, setTranslation] = useState<string | null>(null);
    const [language, setLanguage] = useState("Spanish");

    const languages = [
        "Spanish", "French", "German", "Chinese", "Japanese",
        "Arabic", "Portuguese", "Russian", "Italian", "Hindi"
    ];

    const { isProcessing, job, startJob, reset } = usePdfTool("AI Translate", {
        onSuccess: (data) => {
            setTranslation(data.translation || null);
            toast.success("Translation completed!");
        }
    });

    useEffect(() => {
        if (job?.is_completed && job.translation) {
            setTranslation(job.translation);
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setTranslation(null);
            reset();
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleTranslate = async () => {
        if (!file) return;

        setTranslation(null);

        await startJob(
            () => api.uploadAiTranslate(file, language),
            (id) => api.getAiStatus(id)
        );
    };

    const copyToClipboard = () => {
        if (translation) {
            navigator.clipboard.writeText(translation);
            toast.success("Translation copied to clipboard");
        }
    };

    const downloadAsText = () => {
        if (translation) {
            const blob = new Blob([translation], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `translation_${language}_${file?.name.replace('.pdf', '') || 'document'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <ToolLayout
            title="AI PDF Translator"
            description="Translate your PDF documents into any language while maintaining professional context."
            icon={Globe}
            layoutVariant="split"
            sidebar={
                file && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Languages className="h-5 w-5 mr-2 text-red-600" />
                            Translation Settings
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Target Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            >
                                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleTranslate}
                                isLoading={isProcessing}
                                disabled={!file}
                                size="lg"
                                className="w-full"
                            >
                                <Globe className="h-5 w-5 mr-2" />
                                Translate Now
                            </Button>
                        )}
                    </div>
                )
            }
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
                                {file ? file.name : 'Click or drag PDF to translate'}
                            </p>
                        </div>

                        {!job && (
                            <div className="p-6 text-center text-gray-400">
                                <Languages className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Select target language in the sidebar to translate.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 min-h-[400px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-red-600" />
                            Translation Result
                        </h2>
                        {translation && (
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
                                <p className="text-gray-500 dark:text-gray-400 font-medium">AI is translating your document...</p>
                            </div>
                        ) : translation ? (
                        <>
                            <div className="prose prose-red dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {translation}
                                </div>
                            </div>
                            <ChainedToolAction currentTool="AI Translate" />
                        </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                <Languages className="h-12 w-12 opacity-20" />
                                <p>Translation will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default TranslatePdf;
