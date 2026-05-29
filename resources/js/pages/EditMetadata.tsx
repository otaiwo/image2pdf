import React, { useState, useCallback } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    Download,
    Info,
    Settings
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { usePdfTool } from "../hooks/usePdfTool";
import Button from "../components/ui/Button";
import { ChainedToolAction } from "../components/ChainedToolAction";

const EditMetadata: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState({
        title: "",
        author: "",
        subject: "",
        keywords: ""
    });

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Edit Metadata", {
        onSuccess: () => toast.success("Metadata updated!")
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            reset();
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleUpdate = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", metadata.title);
        formData.append("author", metadata.author);
        formData.append("subject", metadata.subject);
        formData.append("keywords", metadata.keywords);

        await startJob(
            () => api.uploadMetadataFile(formData),
            (id) => api.getMetadataStatus(id)
        );
    };

    const handleDownload = async () => {
        await downloadFile((id) => api.downloadMetadataPdf(id));
    };

    return (
        <ToolLayout
            title="Edit PDF Metadata"
            description="Professionalize your documents by updating their Title, Author, and other properties."
            icon={Info}
            activeJob={job}
            onReset={() => {
                setFile(null);
                reset();
            }}
            sidebar={
                file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Settings className="h-5 w-5 mr-2 text-red-600" />
                            Metadata Settings
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={metadata.title}
                                        onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        placeholder="Document Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={metadata.author}
                                        onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        placeholder="Author Name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={metadata.subject}
                                    onChange={(e) => setMetadata({...metadata, subject: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    placeholder="Document Subject"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Keywords</label>
                                <input
                                    type="text"
                                    value={metadata.keywords}
                                    onChange={(e) => setMetadata({...metadata, keywords: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    placeholder="Keyword1, Keyword2..."
                                />
                            </div>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleUpdate}
                                isLoading={isProcessing}
                                disabled={!file}
                                size="lg"
                                className="w-full"
                            >
                                <Settings className="h-5 w-5 mr-2" />
                                Update Metadata
                            </Button>
                        )}
                    </div>
                )
            }
        >
            <div className="max-w-4xl mx-auto">
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
                            {file ? file.name : 'Click or drag PDF to edit'}
                        </p>
                    </div>

                    <div className="p-8">
                        {job?.is_completed && (
                            <div className="space-y-6">
                                <ChainedToolAction currentTool="Edit Metadata" />
                            </div>
                        )}

                        {!job && (
                            <div className="text-center py-12 text-gray-400">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Configure metadata in the sidebar to proceed.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default EditMetadata;
