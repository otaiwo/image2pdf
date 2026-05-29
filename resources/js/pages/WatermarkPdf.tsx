import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Type,
    Download,
    Stamp,
    Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import Button from "../components/ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";
import { ChainedToolAction } from "../components/ChainedToolAction";

const WatermarkPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>("CONFIDENTIAL");
    const [position, setPosition] = useState<string>('bottom');
    const [imageWatermark, setImageWatermark] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const { isProcessing, job, startJob, downloadFile, reset } = usePdfTool("Watermark PDF", {
        onSuccess: () => toast.success("Watermark added successfully!")
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            reset();
            setPreviewUrl('');
            toast.success(`Selected ${acceptedFiles[0].name}`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleWatermark = async () => {
        if (!file) return;
        if (!text.trim() && !imageWatermark) {
            toast.error("Please provide watermark text or an image");
            return;
        }

        setPreviewUrl('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', text);
        formData.append('position', position);
        if (imageWatermark) {
            formData.append('image', imageWatermark);
        }

        await startJob(
            () => api.uploadWatermarkFile(formData),
            (id) => api.getWatermarkStatus(id)
        );
    };

    const handleDownload = async () => {
        await downloadFile((id) => api.downloadWatermarkPdf(id));
    };

    // Generate a preview when the job is completed
    const generatePreview = async () => {
        if (!job?.job_id) return;
        try {
            const blob = await api.downloadWatermarkPdf(job.job_id);
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (_) {
            // ignore preview errors
        }
    };

    // When the job finishes, automatically generate a preview URL
    useEffect(() => {
        if (job?.is_completed) {
            generatePreview();
        }
    }, [job?.is_completed]);

    return (
        <ToolLayout
            title="Add Watermark"
            description="Stamp your PDF with custom text or images. Choose your style and we'll apply it to every page."
            icon={Stamp}
            activeJob={job}
            onReset={() => {
                setFile(null);
                setText("CONFIDENTIAL");
                reset();
                setPreviewUrl('');
                setImageWatermark(null);
            }}
            sidebar={
                file && !job && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                            <Stamp className="h-5 w-5 mr-2 text-red-600" />
                            Watermark Settings
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                                    <Type className="h-3 w-3 mr-2" />
                                    Watermark Text
                                </label>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="e.g. CONFIDENTIAL"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Position</label>
                                <select
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                    <option value="top">Top</option>
                                    <option value="middle">Middle</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="diagonal">Diagonal</option>
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                                    <ImageIcon className="h-3 w-3 mr-2" />
                                    Image Watermark (optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageWatermark(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                />
                            </div>
                        </div>

                        {!job?.is_completed && (
                            <Button
                                onClick={handleWatermark}
                                isLoading={isProcessing}
                                disabled={!text.trim() && !imageWatermark}
                                size="lg"
                                className="w-full"
                            >
                                <Stamp className="h-5 w-5 mr-2" />
                                Add Watermark
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
                            {file ? file.name : 'Click or drag PDF to watermark'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Maximum 20MB</p>
                    </div>

                    {file && (
                        <div className="p-8">
                            {job && (
                                <div className="space-y-6">
                                    {previewUrl && (
                                        <div className="my-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Preview</h3>
                                            <iframe
                                                src={previewUrl}
                                                title="Watermark preview"
                                                className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-2xl"
                                            />
                                        </div>
                                    )}

                                    {job.is_completed && (
                                        <ChainedToolAction currentTool="Add Watermark" />
                                    )}
                                </div>
                            )}

                            {!job && (
                                <div className="text-center py-12 text-gray-400">
                                    <Stamp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Configure watermark settings in the sidebar to proceed.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
};

export default WatermarkPdf;
