import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload, FileText, X, Download, RefreshCw,
    CheckCircle2, Image as ImageIcon,
    AlignCenter, Maximize2, LayoutTemplate, Layers,
    GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import ConversionProgress from "./ConversionProgress";

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
const POLL_INTERVAL = 2000;
const MAX_RETRIES   = 30;

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
    options,
    value,
    onChange,
}: {
    label: string;
    icon: React.ElementType;
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                            value === opt.value
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
    // File state
    const [files, setFiles]               = useState<UploadedFile[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionJob, setConversionJob] = useState<StatusResponse | null>(null);

    // Conversion options
    const [orientation, setOrientation] = useState<Orientation>("portrait");
    const [pageSize, setPageSize]       = useState<PageSize>("A4");
    const [margin, setMargin]           = useState<Margin>("none");
    const [mergeAll, setMergeAll]       = useState(true);

    // Drag-to-reorder state
    const dragId = useRef<string | null>(null);

    // Poll timer ref
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            files.forEach(f => URL.revokeObjectURL(f.previewUrl));
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Dropzone ──────────────────────────────────────────────────────────────

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
        }));
        setFiles(prev => [...prev, ...newFiles]);
        toast.success(`Added ${acceptedFiles.length} image${acceptedFiles.length > 1 ? "s" : ""}`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"] },
        maxSize: MAX_FILE_SIZE,
        multiple: true,
        onDropRejected: rejectedFiles => {
            rejectedFiles.forEach(({ file, errors }) => {
                const isTooLarge = errors.some(e => e.code === "file-too-large");
                toast.error(
                    isTooLarge
                        ? `${file.name} exceeds 10MB`
                        : `${file.name} is not a supported image type`
                );
            });
        },
    });

    // ── File management ───────────────────────────────────────────────────────

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const removed = prev.find(f => f.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const clearAllFiles = useCallback(() => {
        if (files.length === 0) return;
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setConversionJob(null);
    }, [files]);

    const reorderFiles = useCallback((startId: string, endId: string) => {
        setFiles(prev => {
            const from = prev.findIndex(f => f.id === startId);
            const to   = prev.findIndex(f => f.id === endId);
            if (from === -1 || to === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }, []);

    // ── Polling ───────────────────────────────────────────────────────────────

    const pollConversionStatus = useCallback((jobId: string) => {
        let retries = 0;

        const poll = async () => {
            if (retries >= MAX_RETRIES) {
                toast.error("Conversion timed out. Please try again.");
                setIsConverting(false);
                return;
            }
            try {
                const res = await api.getJobStatus(jobId);
                if (res.success && res.data) {
                    const data = res.data;
                    setConversionJob(data);
                    if (data.is_completed) {
                        setIsConverting(false);
                        if (data.download_url) toast.success("PDF ready!");
                        return;
                    }
                    if (data.status === "failed") {
                        setIsConverting(false);
                        toast.error("Conversion failed. Please try again.");
                        return;
                    }
                }
            } catch { /* swallow; retry */ }
            retries++;
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
        };

        poll();
    }, []);

    // ── Convert ───────────────────────────────────────────────────────────────

    const convertToPdf = useCallback(async () => {
        if (files.length === 0) { toast.error("Please upload at least one image"); return; }
        setIsConverting(true);
        setConversionJob(null);
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        try {
            const res = await api.uploadImages(
                files.map(f => f.file),
                { orientation, pageSize, margin, mergeAll }
            );
            if (res.success && res.data) {
                toast.success("Conversion started!");
                pollConversionStatus(res.data.job_id);
            } else {
                throw new Error(res.message || "Failed to start conversion");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start conversion");
            setIsConverting(false);
        }
    }, [files, orientation, pageSize, margin, mergeAll, pollConversionStatus]);

    // ── Download ──────────────────────────────────────────────────────────────

    const handleDownload = useCallback(async () => {
        if (!conversionJob?.download_url) return;
        try {
            const blob = await api.downloadPdf(conversionJob.job_id);
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement("a"), {
                href: url, download: conversionJob.filename,
            });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to download PDF");
        }
    }, [conversionJob]);

    const resetConverter = useCallback(() => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        setConversionJob(null);
        setIsConverting(false);
    }, [files]);

    // ── Derived ───────────────────────────────────────────────────────────────

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const hasFiles  = files.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left column – main content */}
                        <section className="lg:col-span-2 space-y-5">

                {/* ── Page header ──────────────────────────────────────────── */}
                <div className="text-center pb-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
                        <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Image to PDF
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                        Convert JPG, PNG, WebP and more into a single polished PDF in seconds.
                    </p>
                </div>

                {/* ── Drop zone (shown only when no files) ─────────────────── */}
                {!hasFiles && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                        <div
                            {...getRootProps()}
                            role="button"
                            aria-label="Upload images"
                            className={`p-12 text-center cursor-pointer transition-all duration-200 ${
                                isDragActive
                                    ? "bg-red-50 dark:bg-red-900/20"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors ${
                                isDragActive ? "bg-red-100 dark:bg-red-900/40" : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                                <Upload className={`h-7 w-7 transition-colors ${
                                    isDragActive ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
                                }`} />
                            </div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                {isDragActive ? "Drop images here" : "Drag & drop or click to browse"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                JPG · PNG · GIF · BMP · WebP — up to 10 MB each
                            </p>
                        </div>
                    </div>
                )}

                {/* ── File list (shown when files exist) ───────────────────── */}
                {hasFiles && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                        {/* Header row */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {files.length} image{files.length > 1 ? "s" : ""}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatFileSize(totalSize)} total · ~{Math.ceil(files.length * 0.5)}s
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Add more */}
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
                                {/* Clear all */}
                                <button
                                    type="button"
                                    onClick={clearAllFiles}
                                    disabled={isConverting}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            </div>
                        </div>

                        {/* File rows */}
                        <ul role="list" className="divide-y divide-gray-50 dark:divide-gray-800/60 max-h-72 overflow-y-auto">
                            {files.map(file => (
                                <li
                                    key={file.id}
                                    draggable={!isConverting}
                                    onDragStart={() => { dragId.current = file.id; }}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => {
                                        if (dragId.current && dragId.current !== file.id)
                                            reorderFiles(dragId.current, file.id);
                                        dragId.current = null;
                                    }}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                                >
                                    {/* Drag handle */}
                                    <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Thumbnail */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                        {file.previewUrl
                                            ? <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                            : <ImageIcon className="h-5 w-5 text-gray-400 m-2.5" />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p title={file.name} className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        disabled={isConverting}
                                        aria-label={`Remove ${file.name}`}
                                        className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Options panel moved to sidebar */}

                {/* ── Convert / Progress / Download ─────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-5 transition-colors">

                    
                    {/* Progress */}
                    {conversionJob && (
                        <ConversionProgress job={conversionJob} onDownload={handleDownload} />
                    )}

                    {/* Download + reset */}
                    {conversionJob?.is_completed && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleDownload}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                            >
                                <Download className="h-5 w-5" />
                                Download PDF
                            </button>
                            <button
                                onClick={resetConverter}
                                className="px-5 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Convert Another
                            </button>
                        </div>
                    )}
                </div>

                {/* Close left column section */}
                </section>

                {/* Right column – PDF Options sidebar */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">PDF Options</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Orientation */}
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
                            {/* Page size */}
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
                            {/* Margin */}
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
                    {!conversionJob?.is_completed && (
                        <button
                            onClick={convertToPdf}
                            disabled={!hasFiles || isConverting}
                            aria-busy={isConverting}
                            className={`w-full py-4 rounded-xl text-base font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                !hasFiles || isConverting
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                            }`}
                        >
                            {isConverting
                                ? <><RefreshCw className="h-5 w-5 animate-spin" /><span>Converting…</span></>
                                : <><FileText className="h-5 w-5" /><span>Convert to PDF</span></>
                            }
                        </button>
                    )}
                </aside>

                {/* Close grid */}
                </div>

                {/* ── Tips footer ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 pb-6">
                    {TIPS.map(tip => (
                        <div key={tip} className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
};

export default ImageToPdfConverter;