import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";

interface ToolLayoutProps {
    /** Optional page-level heading rendered above children */
    title?: string;
    description?: string;
    icon?: React.ElementType;
    children: ReactNode;
    jobs?: StatusResponse[];
    onDownload?: (job: StatusResponse) => void;
    /** Override the default max-width constraint on the main content area */
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    sidebar?: React.ReactNode;
    layoutVariant?: "default" | "split";
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ToolLayoutProps["maxWidth"]>, string> = {
    sm:   "max-w-screen-sm",
    md:   "max-w-screen-md",
    lg:   "max-w-screen-lg",
    xl:   "max-w-screen-xl",
    "2xl":"max-w-screen-2xl",
    full: "max-w-full",
};

/**
 * Shared layout for all tool pages.
 * Renders a responsive two-column layout: main content on the left, and an
 * optional completed-jobs sidebar on the right (desktop only).
 * The sidebar column is always present in the DOM to prevent layout shift —
 * it simply renders nothing when there are no jobs.
 */
export const ToolLayout: React.FC<ToolLayoutProps> = ({
    title,
    description,
    icon: Icon,
    children,
    jobs = [],
    onDownload,
    maxWidth = "2xl",
    sidebar,
    layoutVariant = "default",
}) => {
    const hasRecentJobs = jobs.length > 0 && typeof onDownload === "function";
    const hasSidebar = sidebar || hasRecentJobs;

    const sidebarWidthClass = layoutVariant === "split" ? "lg:w-1/2" : "lg:w-1/3";
    const mainWidthClass = hasSidebar 
        ? (layoutVariant === "split" ? "lg:w-1/2" : "lg:w-2/3") 
        : "w-full";

    return (
        // ✅ Full-height background with dark mode support
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <div className={`mx-auto ${MAX_WIDTH_CLASSES[maxWidth]}`}>
                
                {/* Navigation Breadcrumb */}
                <div className="px-4 sm:px-6 lg:px-8 pt-8">
                    <Link 
                        to="/tools" 
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to All Tools
                    </Link>
                </div>

                {/* Unified Header */}
                {(title || description) && (
                    <div className="text-center pt-12 pb-8 px-4">
                        {Icon && (
                            <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4 transition-colors">
                                <Icon className="h-8 w-8 text-red-600" />
                            </div>
                        )}
                        {title && (
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                <div className="lg:flex lg:items-start lg:gap-8 px-4 sm:px-6 lg:px-8 py-8">

                    {/* ✅ Main content — expands to full width when sidebar is absent */}
                    <main
                        role="main"
                        className={`min-w-0 flex-1 transition-all duration-300 ${mainWidthClass}`}
                    >
                        {title && !description && (
                            <p
                                aria-label={`Current tool: ${title}`}
                                className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6"
                            >
                                {title}
                            </p>
                        )}
                        {children}
                    </main>

                    {/* ✅ Sidebar always present in DOM — avoids layout shift on first job */}
                    <aside
                        aria-label="Tool options and recent jobs"
                        aria-hidden={!hasSidebar}
                        className={`hidden lg:block ${sidebarWidthClass} flex-shrink-0 sticky top-8 self-start transition-opacity duration-300 ${
                            hasSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <div className="space-y-6">
                            {sidebar}
                            {hasRecentJobs && (
                                <JobSidebar jobs={jobs} onDownload={onDownload!} />
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};