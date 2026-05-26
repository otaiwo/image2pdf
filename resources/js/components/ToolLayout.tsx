import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { JobSidebar } from "./JobSidebar";
import type { StatusResponse } from "../types/api";

interface ToolLayoutProps {
    title?: string;
    children: ReactNode;
    jobs?: StatusResponse[];
    onDownload?: (job: StatusResponse) => void;
}

/**
 * Shared layout for all tool pages.
 * Provides a header, navigation back to the tools list, and a desktop‑only sidebar
 * that displays completed jobs.
 */
export const ToolLayout: React.FC<ToolLayoutProps> = ({ title, children, jobs = [], onDownload }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title ?? "Tool"}</h1>
                <Link to="/tools">
                    <Button variant="secondary">Back to Tools</Button>
                </Link>
            </header>
            <div className="lg:flex relative">
                {/* Main content area */}
                <main className="lg:w-2/3 p-6">{children}</main>
                {/* Sidebar – only shown on desktop */}
                {jobs.length > 0 && onDownload && (
                    <JobSidebar jobs={jobs} onDownload={onDownload} />
                )}
            </div>
        </div>
    );
};
