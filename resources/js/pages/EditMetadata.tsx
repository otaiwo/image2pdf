import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    RefreshCw,
    Download,
    Info,
    CheckCircle2,
    Settings
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";

const EditMetadata: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState({
        title: "",
        author: "",
        subject: "",
        keywords: ""
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setDownloadUrl(null);
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleUpdate = async () => {
        if (!file) return;

        setIsProcessing(true);
        setDownloadUrl(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", metadata.title);
        formData.append("author", metadata.author);
        formData.append("subject", metadata.subject);
        formData.append("keywords", metadata.keywords);

        try {
            const response = await api.uploadMetadataFile(formData);
            if (response.success && response.data?.job_id) {
                pollStatus(response.data.job_id);
            } else {
                throw new Error(response.message || "Failed to start processing");
            }
        } catch (error: any) {
            toast.error(error.message);
            setIsProcessing(false);
        }
    };

    const pollStatus = async (id: string) => {
        const check = async () => {
            try {
                const response = await api.getMetadataStatus(id);
                if (response.success && response.data) {
                    if (response.data.is_completed) {
                        setDownloadUrl(response.data.download_url);
                        setIsProcessing(false);
                        toast.success("Metadata updated!");
                    } else if (response.data.status === 'failed') {
                        setIsProcessing(false);
                        toast.error(response.data.error || "Processing failed");
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

    const handleDownload = async () => {
        if (downloadUrl) {
            const blob = await api.downloadMetadataPdf(downloadUrl.split('/').pop()!);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `updated_${file?.name || 'document.pdf'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-2xl mb-4">
                    <Info className="h-8 w-8 text-orange-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Edit PDF Metadata</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Professionalize your documents by updating their Title, Author, and other properties.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div
                            {...getRootProps()}
                            className={`p-10 border-b border-gray-100 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-900">
                                {file ? file.name : 'Click or drag PDF to edit'}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={metadata.title}
                                        onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Document Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={metadata.author}
                                        onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Author Name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={metadata.subject}
                                    onChange={(e) => setMetadata({...metadata, subject: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Document Subject"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Keywords</label>
                                <input
                                    type="text"
                                    value={metadata.keywords}
                                    onChange={(e) => setMetadata({...metadata, keywords: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Keyword1, Keyword2..."
                                />
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={!file || isProcessing}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
                                    !file || isProcessing
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Settings className="h-5 w-5" />
                                        <span>Update Metadata</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center">
                    {downloadUrl ? (
                        <div className="space-y-6">
                            <div className="bg-green-100 p-6 rounded-full inline-block">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Ready to Download!</h2>
                            <p className="text-gray-500">Your PDF metadata has been successfully updated.</p>
                            <button
                                onClick={handleDownload}
                                className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 flex items-center justify-center space-x-2"
                            >
                                <Download className="h-5 w-5" />
                                <span>Download PDF</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 opacity-40">
                            <FileText className="h-20 w-20 text-gray-300 mx-auto" />
                            <p className="text-gray-400 font-medium italic">Configure metadata and process to download</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditMetadata;
