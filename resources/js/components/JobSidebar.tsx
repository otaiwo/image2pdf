import React, { useMemo } from "react";
import { 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Loader2, 
    XCircle, 
    RefreshCw,
    ChevronLeft
} from "lucide-react";
import type { StatusResponse } from "../types/api";
import Button from "./ui/Button";

interface JobSidebarProps {
    jobs: StatusResponse[];
    activeJob?: StatusResponse | null;
    onDownload: (job: StatusResponse) => void;
    onReset?: () => void;
}

const STATUS_STYLES: Record<string, { badge: string; icon: React.ReactNode; color: string; text: string }> = {
    completed: {
        badge: "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
        icon:  <CheckCircle2 className="h-5 w-5" />,
        color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30",
        text: "Conversion Complete"
    },
    processing: {
        badge: "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        icon:  <Loader2 className="h-5 w-5 animate-spin" />,
        color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30",
        text: "Processing File"
    },
    pending: {
        badge: "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon:  <Clock className="h-5 w-5" />,
        color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30",
        text: "Pending"
    },
    failed: {
        badge: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
        icon:  <XCircle className="h-5 w-5" />,
        color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30",
        text: "Conversion Failed"
    },
};

export const JobSidebar: React.FC<JobSidebarProps> = ({ 
    jobs, 
    activeJob, 
    onDownload,
    onReset
}) => {
    const uniqueJobs = useMemo(() => {
        const seen = new Set<string>();
        return jobs.filter(job => {
            if (seen.has(job.job_id)) return false;
            seen.add(job.job_id);
            return true;
        });
    }, [jobs]);

    if (activeJob) {
        const style = STATUS_STYLES[activeJob.status] || STATUS_STYLES.pending;
        
        return (
            <div className="w-full space-y-6">
                <div className={`border-2 rounded-2xl p-6 transition-colors ${style.color}`}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                            {style.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white leading-none">
                                {style.text}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Job ID: {activeJob.job_id.substring(0, 8)}
                            </p>
                        </div>
                    </div>

                    {activeJob.status === "processing" && (
                        <div className="mb-6">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                <span>Progress</span>
                                <span>{activeJob.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${activeJob.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Filename</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={activeJob.filename}>
                                {activeJob.filename}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Started</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {new Date(activeJob.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                                {activeJob.status}
                            </span>
                        </div>
                    </div>

                    {activeJob.status === "completed" && (
                        <Button
                            onClick={() => onDownload(activeJob)}
                            variant="success"
                            className="w-full py-3"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    )}

                    {activeJob.status === "failed" && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                                {activeJob.error || "The conversion failed. Please try again."}
                            </p>
                        </div>
                    )}
                </div>

                {activeJob.status === "completed" && onReset && (
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="w-full py-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Convert Another
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <h2 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                    Recent Activity
                </h2>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-2 py-0.5 rounded-full">
                    {uniqueJobs.length}
                </span>
            </div>

            {uniqueJobs.length === 0 ? (
                <div className="px-5 py-12 text-center">
                    <Clock className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">No recent activity found.</p>
                </div>
            ) : (
                <ul role="list" className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                    {uniqueJobs.map(job => {
                        const style = STATUS_STYLES[job.status] || STATUS_STYLES.pending;

                        return (
                            <li
                                key={job.job_id}
                                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                            >
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span
                                        title={job.filename}
                                        className="text-xs font-bold text-gray-900 dark:text-white truncate"
                                    >
                                        {job.filename}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${style.badge}`}>
                                            {job.status}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {job.status === "completed" && (
                                    <button
                                        onClick={() => onDownload(job)}
                                        className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
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
