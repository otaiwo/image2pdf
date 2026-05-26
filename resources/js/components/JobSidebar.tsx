import React from "react";
import { Download } from "lucide-react";
import type { StatusResponse } from "../types/api";
import toast from "react-hot-toast";

interface JobSidebarProps {
    jobs: StatusResponse[];
    onDownload: (job: StatusResponse) => void;
}

// Reuse the same status colour mapping as UserDashboard
const statusColors: Record<string, string> = {
    completed: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    processing: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    pending: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
    failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

export const JobSidebar: React.FC<JobSidebarProps> = ({ jobs, onDownload }) => {
    return (
        <aside className="hidden lg:block lg:w-1/3 fixed right-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Completed Jobs</h2>
            {jobs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No completed jobs yet.</p>
            ) : (
                <ul className="space-y-3">
                    {jobs.map((job) => (
                        <li key={job.job_id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-xs">
                                    {job.filename}
                                </span>
                                <span className={`text-xs mt-1 ${statusColors[job.status]}`}> {job.status} </span>
                            </div>
                            {job.status === "completed" && (
                                <button
                                    onClick={() => onDownload(job)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
};
