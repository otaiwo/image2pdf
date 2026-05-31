import React, { ReactNode, useRef, useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileCode, 
    RefreshCw, 
    Grid, 
    Pencil, 
    Sparkles, 
    Image as ImageIcon,
    FileText,
    FileDown,
    FileCode2,
    GitMerge,
    Scissors,
    LayoutGrid,
    Shield,
    Settings2,
    Brain,
    MessageSquare,
    Key,
    Languages,
    Lock,
    Unlock,
    Zap,
    Hash,
    PenTool
} from "lucide-react";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";

interface ToolLayoutProps {
    title?: string;
    description?: string;
    icon?: React.ElementType;
    children: ReactNode;
    jobs?: StatusResponse[];
    activeJob?: StatusResponse | null;
    onDownload?: (job: StatusResponse) => void;
    onReset?: () => void;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    sidebar?: React.ReactNode;
    layoutVariant?: "default" | "split";
    onFilesSelected?: (files: File[]) => void;
    user?: {
        name: string;
        avatarUrl?: string;
    };
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ToolLayoutProps["maxWidth"]>, string> = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
};

interface SubTool {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
}

interface NavCategory {
    id: string;
    label: string;
    icon: React.ElementType;
    tools: SubTool[];
}

const NAV_CATEGORIES: NavCategory[] = [
    {
        id: "convert",
        label: "Convert",
        icon: RefreshCw,
        tools: [
            { id: "image-to-pdf", label: "Image to PDF", href: "/image-to-pdf", icon: ImageIcon },
            { id: "pdf-to-txt", label: "PDF to Text", href: "/pdf-to-txt", icon: FileText },
            { id: "pdf-to-docx", label: "PDF to DOCX", href: "/pdf-to-docx", icon: FileDown },
            { id: "file-to-pdf", label: "File to PDF", href: "/file-to-pdf", icon: FileCode2 },
            { id: "pdf-to-image", label: "PDF to Image", href: "/pdf-to-image", icon: ImageIcon },
            { id: "pdf-to-excel", label: "PDF to Excel", href: "/pdf-to-excel", icon: FileDown },
            { id: "pdf-to-pptx", label: "PDF to PowerPoint", href: "/pdf-to-pptx", icon: FileDown },
        ]
    },
    {
        id: "organize",
        label: "Organize",
        icon: Grid,
        tools: [
            { id: "merge-pdf", label: "Merge PDF", href: "/merge-pdf", icon: GitMerge },
            { id: "split-pdf", label: "Split PDF", href: "/split-pdf", icon: Scissors },
            { id: "extract-pages", label: "Extract Pages", href: "/extract-pages", icon: Scissors },
            { id: "organize-pdf", label: "Organize PDF", href: "/organize-pdf", icon: LayoutGrid },
            { id: "rotate-pdf", label: "Rotate PDF", href: "/rotate-pdf", icon: RefreshCw },
            { id: "compress-pdf", label: "Compress PDF", href: "/compress-pdf", icon: Zap },
        ]
    },
    {
        id: "edit",
        label: "Edit",
        icon: Pencil,
        tools: [
            { id: "watermark-pdf", label: "Watermark PDF", href: "/watermark-pdf", icon: Shield },
            { id: "edit-metadata", label: "Edit Metadata", href: "/edit-metadata", icon: Settings2 },
            { id: "add-page-numbers", label: "Add Page Numbers", href: "/add-page-numbers", icon: Hash },
            { id: "sign-pdf", label: "Sign PDF", href: "/sign-pdf", icon: PenTool },
        ]
    },
    {
        id: "ai",
        label: "AI PDF",
        icon: Sparkles,
        tools: [
            { id: "ai-summarizer", label: "AI Summarize", href: "/ai-summarizer", icon: Brain },
            { id: "ai-chat", label: "AI Chat", href: "/ai-chat", icon: MessageSquare },
            { id: "ai-keywords", label: "Extract Keywords", href: "/ai-keywords", icon: Key },
            { id: "ai-translate", label: "Translate PDF", href: "/ai-translate", icon: Languages },
        ]
    },
    {
        id: "security",
        label: "Security",
        icon: Lock,
        tools: [
            { id: "protect-pdf", label: "Protect PDF", href: "/protect-pdf", icon: Lock },
            { id: "unlock-pdf", label: "Unlock PDF", href: "/unlock-pdf", icon: Unlock },
        ]
    },
];

export const ToolLayout: React.FC<ToolLayoutProps> = ({
    title,
    children,
    jobs = [],
    activeJob,
    onDownload,
    onReset,
    maxWidth = "full",
    sidebar,
    // layoutVariant = "default",
    onFilesSelected,
    user,
}) => {
    const location = useLocation();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const hasSidebar = (sidebar && !activeJob) || activeJob || jobs.length > 0;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerFileSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                const fileArray = Array.from(files);
                if (onFilesSelected) {
                    onFilesSelected(fileArray);
                }
            }
            e.target.value = "";
        },
        [onFilesSelected]
    );

    return (
        <div className="min-h-screen bg-[#f3f5fa] dark:bg-[#0f172a] flex overflow-hidden font-sans">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />

            {/* LEFT TOOL SIDEBAR */}
            <aside 
                className="relative w-[76px] bg-[#001b66] text-white flex flex-col items-center py-3 border-r border-[#0b2d7a] z-50 flex-shrink-0"
                onMouseLeave={() => setHoveredCategory(null)}
            >
                <div className="mb-8">
                    <Link to="/">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-yellow-400 to-blue-500 p-[3px]">
                            <div className="w-full h-full rounded-[10px] bg-[#001b66] flex items-center justify-center">
                                <FileCode className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col gap-2 w-full px-2">
                    {NAV_CATEGORIES.map(category => {
                        const isActive = category.tools.some(tool => location.pathname === tool.href);
                        return (
                            <div 
                                key={category.id}
                                className="relative group"
                                onMouseEnter={() => setHoveredCategory(category.id)}
                            >
                                <button
                                    className={`w-full flex flex-col items-center gap-1 text-[10px] py-3 rounded-xl transition-all duration-200 ${
                                        isActive || hoveredCategory === category.id 
                                            ? "bg-[#1d4ed8] text-white shadow-lg" 
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <category.icon className="w-5 h-5" />
                                    <span className="font-medium">{category.label}</span>
                                </button>

                                <AnimatePresence>
                                    {hoveredCategory === category.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-[70px] top-0 ml-2 w-[520px] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 z-50"
                                        >
                                            <div className="mb-5 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
                                                        {category.label}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        Choose a tool to get started
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                                    <category.icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                {category.tools.map(tool => (
                                                    <Link
                                                        key={tool.id}
                                                        to={tool.href}
                                                        className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border-2 ${
                                                            location.pathname === tool.href
                                                                ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                                                                : "bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-transparent hover:border-red-100 dark:hover:border-red-900/20 hover:shadow-md"
                                                        }`}
                                                    >
                                                        <div className={`p-3 rounded-xl transition-colors ${
                                                            location.pathname === tool.href
                                                                ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none"
                                                                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 shadow-sm"
                                                        }`}>
                                                            <tool.icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-bold ${
                                                                location.pathname === tool.href
                                                                    ? "text-red-700 dark:text-red-300"
                                                                    : "text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400"
                                                            }`}>
                                                                {tool.label}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                                Process your files
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 w-full px-2">
                    <button className="w-full flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white transition">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="text-sm">👤</span>
                            </div>
                        )}
                        <span className="font-medium truncate w-full text-center">
                            {user?.name ?? "Account"}
                        </span>
                    </button>
                </div>
            </aside>

            {/* MAIN APP AREA */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* TOP NAVBAR */}
                <header className="h-[68px] bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title || "Redact"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f2937] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#374151] transition">
                            👑 Free Trial
                        </button>
                        <button className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-[#1f2937] text-gray-700 dark:text-gray-200">
                            👤
                        </button>
                    </div>
                </header>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto">
                    <div className={`${MAX_WIDTH_CLASSES[maxWidth]} mx-auto w-full px-4 sm:px-6 lg:px-8 py-8`}>
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* MAIN CONTENT */}
                            <main className={`flex-1 min-w-0 ${hasSidebar ? "lg:w-2/3" : "w-full"}`}>
                                {!children ? (
                                    <div className="bg-[#eef2ff] dark:bg-[#111827] border-2 border-dashed border-[#7ea1ff] rounded-2xl min-h-[600px] p-8 shadow-sm">
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="text-7xl mb-6">☁️</div>
                                            <button
                                                onClick={triggerFileSelect}
                                                className="inline-flex items-center overflow-hidden rounded-xl shadow-lg mb-6"
                                            >
                                                <span className="bg-[#0d5eff] hover:bg-[#0047d8] transition text-white px-6 py-4 font-semibold">
                                                    Select files
                                                </span>
                                                <span className="bg-[#0047d8] text-white px-4 py-4">▼</span>
                                            </button>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Add PDF, image, Word, Excel, and PowerPoint files
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Supported formats
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                {['PDF', 'DOC', 'XLS', 'PPT', 'PNG', 'JPG'].map(ext => (
                                                    <span key={ext} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700">{ext}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {children}
                                    </div>
                                )}
                            </main>

                            {/* RIGHT SIDEBAR */}
                            {hasSidebar && (
                                <aside className="lg:w-1/3 w-full sticky top-0">
                                    <div className="space-y-6">
                                        {/* TOOL SETTINGS (hidden when a job is active) */}
                                        {sidebar && !activeJob && (
                                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                                {sidebar}
                                            </div>
                                        )}

                                        {/* JOB SIDEBAR (Active Job or Recent Jobs) */}
                                        {(activeJob || jobs.length > 0) && (
                                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                                <JobSidebar
                                                    jobs={jobs}
                                                    activeJob={activeJob}
                                                    onDownload={onDownload!}
                                                    onReset={onReset}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </aside>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
