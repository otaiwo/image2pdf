import React, { ReactNode } from "react";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";

interface ToolLayoutProps {
    /** Optional page-level heading rendered above children */
    title?: string;
    children: ReactNode;
    jobs?: StatusResponse[];
    onDownload?: (job: StatusResponse) => void;
    /** Override the default max-width constraint on the main content area */
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
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
    children,
    jobs = [],
    onDownload,
    maxWidth = "2xl",
}) => {
    const hasSidebar = jobs.length > 0 && typeof onDownload === "function";

    return (
        // ✅ Full-height background with dark mode support
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <div className={`mx-auto ${MAX_WIDTH_CLASSES[maxWidth]}`}>
                <div className="lg:flex lg:items-start lg:gap-8 px-4 sm:px-6 lg:px-8 py-8">

                    {/* ✅ Main content — expands to full width when sidebar is absent */}
                    <main
                        role="main"
                        className={`min-w-0 flex-1 transition-all duration-300 ${
                            hasSidebar ? "lg:w-2/3" : "w-full"
                        }`}
                    >
                        {/* ✅ Render title as a visible label above children, not a duplicate h1 */}
                        {title && (
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
                        aria-label="Completed jobs"
                        aria-hidden={!hasSidebar}
                        className={`hidden lg:block lg:w-1/3 flex-shrink-0 sticky top-8 self-start transition-opacity duration-300 ${
                            hasSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        {hasSidebar && (
                            <JobSidebar jobs={jobs} onDownload={onDownload!} />
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};