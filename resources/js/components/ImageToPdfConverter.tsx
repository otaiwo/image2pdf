import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, X, Download, RefreshCw,
    CheckCircle2, Image as ImageIcon,
    AlignCenter, Maximize2, LayoutTemplate, Layers,
    GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import ConversionProgress from "./ConversionProgress";
import { ChainedToolAction } from "./ChainedToolAction";
import { ToolLayout } from "./ToolLayout";
import Button from "./ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    previewUrl: string;
}

type Orientation = "portrait" | "landscape";
type PageSize    = "A4" | "Letter" | "Legal";
type Margin      = "none" | "small" | "big";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const TIPS = [
    "Images are optimized for PDF quality",
    "Files are securely deleted after 1 hour",
    "No registration required — 100% free",
    "Works on all modern browsers",
];

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill-style segmented toggle */
function SegmentedControl<T extends string>({
    label,
    icon: Icon,
    value,
    onChange,
    options,
}: {
    label: string;
    icon: React.ElementType;
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                            value === opt.value
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ImageToPdfConverter: React.FC = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [orientation, setOrientation] = useState<Orientation>("portrait");
    const [pageSize, setPageSize] = useState<PageSize>("A4");
    const [margin, setMargin] = useState<Margin>("small");
    const [mergeAll, setMergeAll] = useState(true);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);
    const dragId = useRef<string | null>(null);

    const {
        isProcessing,
        job,
        startJob,
        downloadFile,
        reset
    } = usePdfTool("Image to PDF", {
        onSuccess: () => {
            toast.success("Images converted successfully!");
        }
    });

    useEffect(() => {
        if (job?.is_completed) {
            setCompletedJobs((prev) => {
                const exists = prev.find((j) => j.job_id === job.job_id);
                if (exists) return prev;
                return [...prev, job];
            });
        }
    }, [job]);

    const hasFiles = files.length > 0;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const onDrop = useCallback((accepted: File[]) => {
        const mapped: UploadedFile[] = accepted
            .filter(f => f.size <= MAX_FILE_SIZE)
            .map(f => ({
                id: crypto.randomUUID(),
                file: f,
                name: f.name,
                size: f.size,
                type: f.type,
                previewUrl: URL.createObjectURL(f),
            }));
        setFiles(prev => [...prev, ...mapped]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
    });

    const removeFile = (id: string) =>
        setFiles(prev => prev.filter(f => f.id !== id));

    const clearAllFiles = () => {
        setFiles([]);
        reset();
    };

    const reorderFiles = (fromId: string, toId: string) => {
        setFiles(prev => {
            const arr = [...prev];
            const fromIdx = arr.findIndex(f => f.id === fromId);
            const toIdx   = arr.findIndex(f => f.id === toId);
            if (fromIdx < 0 || toIdx < 0) return prev;
            const [item] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, item);
            return arr;
        });
    };

    const convertToPdf = async () => {
        if (!hasFiles) return;

        await startJob(
            () => api.uploadImages(files.map(f => f.file), {
                orientation,
                pageSize,
                margin,
                mergeAll
            }),
            (id) => api.getJobStatus(id)
        );
    };

    const handleDownload = async () => {
        await downloadFile((id) => api.downloadPdf(id));
    };

    const resetConverter = () => {
        setFiles([]);
        reset();
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const sidebarContent = hasFiles && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">PDF Options</h2>
                <div className="grid grid-cols-1 gap-5">
                    <SegmentedControl<Orientation>
                        label="Orientation"
                        icon={AlignCenter}
                        value={orientation}
                        onChange={setOrientation}
                        options={[
                            { value: "portrait",  label: "Portrait" },
                            { value: "landscape", label: "Landscape" },
                        ]}
                    />
                    <SegmentedControl<PageSize>
                        label="Page size"
                        icon={Maximize2}
                        value={pageSize}
                        onChange={setPageSize}
                        options={[
                            { value: "A4",     label: "A4" },
                            { value: "Letter", label: "Letter" },
                            { value: "Legal",  label: "Legal" },
                        ]}
                    />
                    <SegmentedControl<Margin>
                        label="Margin"
                        icon={LayoutTemplate}
                        value={margin}
                        onChange={setMargin}
                        options={[
                            { value: "none",  label: "None" },
                            { value: "small", label: "Small" },
                            { value: "big",   label: "Large" },
                        ]}
                    />
                    {/* Merge toggle */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Output</span>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={mergeAll}
                            onClick={() => setMergeAll(p => !p)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors text-left w-full"
                        >
                            <div className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${
                                mergeAll ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                            }`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                    mergeAll ? "translate-x-4" : "translate-x-0"
                                }`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                                    Merge into one PDF
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {mergeAll ? "All images → single file" : "One PDF per image"}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Convert button */}
            {!job?.is_completed && (
                <Button
                    onClick={convertToPdf}
                    isLoading={isProcessing}
                    disabled={!hasFiles || isProcessing}
                    size="lg"
                    className="w-full"
                >
                    {!isProcessing && <ImageIcon className="h-5 w-5 mr-2" />}
                    {isProcessing ? "Converting..." : "Convert to PDF"}
                </Button>
            )}
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Image to PDF"
            description="Convert JPG, PNG, WebP and more into a single polished PDF in seconds."
            icon={ImageIcon}
            maxWidth="xl"
            sidebar={sidebarContent}
            jobs={completedJobs}
            onDownload={handleDownload}
            activeJob={job}
            onReset={resetConverter}
        >
            <div className="space-y-6">
                {/* ── Drop zone (shown only when no files) ─────────────────── */}
                {!hasFiles && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        <div
                            {...getRootProps()}
                            role="button"
                            aria-label="Upload images"
                            className={`p-24 text-center cursor-pointer transition-all duration-200 ${
                                isDragActive
                                    ? "bg-red-50 dark:bg-red-900/20"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-colors ${
                                isDragActive ? "bg-red-100 dark:bg-red-900/40" : "bg-red-50 dark:bg-red-900/10"
                            }`}>
                                <Upload className={`h-10 w-10 transition-colors ${
                                    isDragActive ? "text-red-600 dark:text-red-400" : "text-red-600"
                                }`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {isDragActive ? "Drop images here" : "Select Images"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                or drag and drop images here
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                                JPG · PNG · GIF · BMP · WebP — up to 10 MB each
                            </p>
                        </div>
                    </div>
                )}

                {/* ── File list (shown when files exist) ───────────────────── */}
                {hasFiles && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {files.length} image{files.length > 1 ? "s" : ""} selected
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatFileSize(totalSize)} total
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Add more
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearAllFiles}
                                    disabled={isProcessing}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            </div>
                        </div>

                        <ul role="list" className="divide-y divide-gray-50 dark:divide-gray-800/60 max-h-[400px] overflow-y-auto">
                            {files.map(file => (
                                <li
                                    key={file.id}
                                    draggable={!isProcessing}
                                    onDragStart={() => { dragId.current = file.id; }}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => {
                                        if (dragId.current && dragId.current !== file.id)
                                            reorderFiles(dragId.current, file.id);
                                        dragId.current = null;
                                    }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                                >
                                    <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                        {file.previewUrl
                                            ? <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                            : <ImageIcon className="h-6 w-6 text-gray-400 m-3" />
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p title={file.name} className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        disabled={isProcessing}
                                        aria-label={`Remove ${file.name}`}
                                        className="flex-shrink-0 p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Results (After Completion) ─────────────────────────── */}
                {job?.is_completed && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 transition-colors">
                        <ChainedToolAction currentTool="Image to PDF" />
                    </div>
                )}

                {/* ── Tips footer ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    {TIPS.map(tip => (
                        <div key={tip} className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="font-medium">{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    );
};

export default ImageToPdfConverter;
