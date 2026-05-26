import React, { useMemo } from "react";
import { Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { StatusResponse } from "../types/api";

interface JobSidebarProps {
    jobs: StatusResponse[];
    onDownload: (job: StatusResponse) => void;
}

// ✅ Moved to a shared constants file ideally, but kept here for now
const STATUS_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
    completed: {
        badge: "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
        icon:  <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    processing: {
        badge: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        icon:  <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    pending: {
        badge: "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon:  <Clock className="h-3.5 w-3.5" />,
    },
    failed: {
        badge: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
        icon:  <AlertCircle className="h-3.5 w-3.5" />,
    },
};

const DEFAULT_STATUS: (typeof STATUS_STYLES)[string] = {
    badge: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
    icon:  <Clock className="h-3.5 w-3.5" />,
};

export const JobSidebar: React.FC<JobSidebarProps> = ({ jobs, onDownload }) => {
    // ✅ Deduplicate by job_id — guards against the same job being pushed twice
    const uniqueJobs = useMemo(() => {
        const seen = new Set<string>();
        return jobs.filter(job => {
            if (seen.has(job.job_id)) return false;
            seen.add(job.job_id);
            return true;
        });
    }, [jobs]);

    return (
        // ✅ Fixed: removed fixed/top-0/h-full — sidebar participates in normal flex flow
        // Parent (ToolLayout) handles sticky positioning via `sticky top-8 self-start`
        <div className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                    Recent Jobs
                </h2>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {uniqueJobs.length}
                </span>
            </div>

            {/* Body */}
            {uniqueJobs.length === 0 ? (
                <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">No jobs yet.</p>
                </div>
            ) : (
                // ✅ max-h + overflow-y so the sidebar doesn't grow infinitely
                <ul
                    role="list"
                    aria-label="Recent jobs"
                    className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[60vh] overflow-y-auto"
                >
                    {uniqueJobs.map(job => {
                        const style = STATUS_STYLES[job.status] ?? DEFAULT_STATUS;

                        return (
                            <li
                                key={job.job_id}
                                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex flex-col min-w-0 flex-1">
                                    {/* ✅ title attr shows full filename on hover */}
                                    <span
                                        title={job.filename}
                                        className="text-sm font-medium text-gray-900 dark:text-white truncate"
                                    >
                                        {job.filename}
                                    </span>

                                    {/* ✅ Badge uses proper padding, no stray whitespace, includes icon */}
                                    <span className={`inline-flex items-center gap-1 mt-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${style.badge}`}>
                                        {style.icon}
                                        {job.status}
                                    </span>
                                </div>

                                {/* ✅ aria-label identifies which file the button downloads */}
                                {job.status === "completed" && (
                                    <button
                                        onClick={() => onDownload(job)}
                                        aria-label={`Download ${job.filename}`}
                                        className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};