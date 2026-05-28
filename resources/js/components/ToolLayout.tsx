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
    Unlock
} from "lucide-react";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";

interface ToolLayoutProps {
    title?: string;
    // Added optional description and icon props to support usage in components like ImageToPdfConverter.
    description?: string;
    icon?: React.ElementType;
    children: ReactNode;
    jobs?: StatusResponse[];
    onDownload?: (job: StatusResponse) => void;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    sidebar?: React.ReactNode;
    layoutVariant?: "default" | "split";
    onFilesSelected?: (files: File[]) => void;
    // Optional user information for the account button
    user?: {
        name: string;
        avatarUrl?: string;
    };
}

// Mapping of the allowed maxWidth values to Tailwind CSS max‑width classes.
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
        ]
    },
    {
        id: "organize",
        label: "Organize",
        icon: Grid,
        tools: [
            { id: "merge-pdf", label: "Merge PDF", href: "/merge-pdf", icon: GitMerge },
            { id: "split-pdf", label: "Split PDF", href: "/split-pdf", icon: Scissors },
            { id: "organize-pdf", label: "Organize PDF", href: "/organize-pdf", icon: LayoutGrid },
        ]
    },
    {
        id: "edit",
        label: "Edit",
        icon: Pencil,
        tools: [
            { id: "watermark-pdf", label: "Watermark PDF", href: "/watermark-pdf", icon: Shield },
            { id: "edit-metadata", label: "Edit Metadata", href: "/edit-metadata", icon: Settings2 },
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
    onDownload,
    maxWidth = "full",
    sidebar,
    layoutVariant = "default",
    onFilesSelected,
    user,
}) => {
    const hasRecentJobs =
        jobs.length > 0 && typeof onDownload === "function";

    const location = useLocation();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const hasSidebar = sidebar || hasRecentJobs;

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
                } else {
                    console.log("Selected files:", fileArray);
                }
            }
            // Reset so the same file can be re-selected
            e.target.value = "";
        },
        [onFilesSelected]
    );

    return (
        <div className="min-h-screen bg-[#f3f5fa] dark:bg-[#0f172a] flex overflow-hidden">

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />

            {/* LEFT TOOL SIDEBAR */}
            <aside 
                className="relative w-[76px] bg-[#001b66] text-white flex flex-col items-center py-3 border-r border-[#0b2d7a] z-50"
                onMouseLeave={() => setHoveredCategory(null)}
            >
                {/* LOGO */}
                <div className="mb-8">
                    <Link to="/">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-yellow-400 to-blue-500 p-[3px]">
                            <div className="w-full h-full rounded-[10px] bg-[#001b66] flex items-center justify-center">
                                <FileCode className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* NAV ITEMS */}
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

                                {/* Fly-out Mega Menu */}
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

                {/* ACCOUNT */}
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
            <div className="flex-1 flex flex-col min-w-0">

                {/* TOP NAVBAR */}
                <header className="h-[68px] bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
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
                <div
                    className={`flex-1 overflow-auto ${MAX_WIDTH_CLASSES[maxWidth]} mx-auto w-full px-4 sm:px-6 lg:px-8 py-8`}
                >
                    {/* HERO / TITLE removed to hide individual tool titles, icons, and descriptions. */}

                    {/* CONTENT + RIGHT SIDEBAR */}
                    <div className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* MAIN CONTENT */}
                        <main
                            className={`flex-1 min-w-0 ${
                                hasSidebar
                                    ? layoutVariant === "split"
                                        ? "lg:w-1/2"
                                        : "lg:w-2/3"
                                    : "w-full"
                            }`}
                        >
                            {/* UPLOAD PROMPT CARD — shown only when no children content */}
                            {!children ? (
                                <div className="bg-[#eef2ff] dark:bg-[#111827] border-2 border-dashed border-[#7ea1ff] rounded-2xl min-h-[650px] p-8 shadow-sm">
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="text-7xl mb-6 text-[#0f2d75]">
                                            ☁️
                                        </div>

                                        <button
                                            onClick={triggerFileSelect}
                                            className="inline-flex items-center overflow-hidden rounded-xl shadow-lg mb-6"
                                        >
                                            <span className="bg-[#0d5eff] hover:bg-[#0047d8] transition text-white px-6 py-4 font-semibold">
                                                Select files
                                            </span>
                                            <span className="bg-[#0047d8] text-white px-4 py-4">
                                                ▼
                                            </span>
                                        </button>

                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            Add PDF, image, Word, Excel, and PowerPoint files
                                        </h3>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Supported formats
                                        </p>

                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">PDF</span>
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">DOC</span>
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-bold">XLS</span>
                                            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">PPT</span>
                                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">PNG</span>
                                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">JPG</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // TOOL CONTENT
                                <div className="w-full">
                                    {children}
                                </div>
                            )}
                        </main>

                        {/* RIGHT SIDEBAR */}
                        {hasSidebar && (
                            <aside
                                className={`hidden lg:block ${
                                    layoutVariant === "split"
                                        ? "lg:w-1/2"
                                        : "lg:w-1/3"
                                } sticky top-8`}
                            >
                                <div className="space-y-6">
                                    {/* TOOL SIDEBAR */}
                                    {/* <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                        <ToolSidebar />
                                    </div> */}

                                    {/* CUSTOM SIDEBAR */}
                                    {sidebar && (
                                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                            {sidebar}
                                        </div>
                                    )}

                                    {/* JOBS */}
                                    {hasRecentJobs && (
                                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                                            <JobSidebar
                                                jobs={jobs}
                                                onDownload={onDownload!}
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
    );
};