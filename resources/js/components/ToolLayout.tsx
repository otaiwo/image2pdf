import React, { ReactNode, useRef, useCallback } from "react";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";
// Import a real logo (replace with actual path to your logo asset)

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

// Navigation item definition
interface NavItem {
    id: string;
    icon: string; // could be an emoji or an SVG component
    label: string;
    active?: boolean;
    onClick?: () => void;
}

// Define the sidebar navigation items. Adjust as needed for real data.
const NAV_ITEMS: NavItem[] = [
    { id: "compress", icon: "🗜️", label: "Compress" },
    { id: "convert", icon: "🔄", label: "Convert" },
    { id: "organize", icon: "▦", label: "Organize" },
    { id: "edit", icon: "✏️", label: "Edit", active: true },
    { id: "sign", icon: "✍️", label: "Sign" },
    { id: "ai", icon: "✨", label: "AI PDF" },
    { id: "more", icon: "☰", label: "More" },
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
            <aside className="w-[76px] bg-[#001b66] text-white flex flex-col items-center py-3 border-r border-[#0b2d7a]">

                {/* LOGO */}
                <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-yellow-400 to-blue-500 p-[3px]">
                        <div className="w-full h-full rounded-[10px] bg-[#001b66]" />
                    </div>
                </div>

                {/* NAV ITEMS */}
                <div className="flex flex-col gap-2 w-full px-2">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`flex flex-col items-center gap-1 text-[11px] py-3 rounded-xl ${item.active ? "bg-[#1d4ed8] text-white shadow-lg" : "text-white/80 hover:bg-white/10"} transition`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* ACCOUNT */}
                <div className="mt-auto pt-6">
                    <button className="flex flex-col items-center gap-1 text-[11px] text-white/80">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <span className="text-lg">👤</span>
                        )}
                        {user?.name ?? "Account"}
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