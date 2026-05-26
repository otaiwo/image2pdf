import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Clock,
    FileText,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Download,
    FileStack,
    Scissors,
    Stamp,
    Cpu,
    ChevronRight,
    ArrowUpRight,
    Zap,
    TrendingUp,
    Shield
} from "lucide-react";
import { api } from "../utils/api";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ActivitySkeleton } from "../components/ui/Skeleton";
import Button from "../components/ui/Button";

const toolIcons: Record<string, any> = {
    merge_pdf: FileStack,
    split_pdf: Scissors,
    watermark_pdf: Stamp,
    ai_summarize: Cpu,
    image_to_pdf: FileText,
};

const statusColors: Record<string, string> = {
    completed: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    processing: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    pending: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
    failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

const UserDashboard: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["recentActivity"],
        queryFn: () => api.getRecentActivity(),
    });

    const activities = data?.data || [];
    const GUEST_LIMIT = 100;
    const usagePercentage = Math.min((activities.length / GUEST_LIMIT) * 100, 100);

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your recent PDF operations and tools.</p>
                    </div>
                    <Link to="/tools">
                        <Button>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Explore Tools
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Activity List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                                <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-red-600" />
                                    Recent Activity
                                </h2>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Last 10 operations
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isLoading ? (
                                    <ActivitySkeleton />
                                ) : activities.length > 0 ? (
                                    activities.map((job: any) => {
                                        const Icon = toolIcons[job.type] || FileText;
                                        return (
                                            <div key={job.job_id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-3 rounded-2xl ${statusColors[job.status] || "bg-gray-100 dark:bg-gray-800"}`}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-md">
                                                            {job.filename}
                                                        </h3>
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            <span className="capitalize">{job.type.replace('_', ' ')}</span>
                                                            <span className="mx-2">•</span>
                                                            <span>{job.created_at}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className={`hidden md:inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[job.status]}`}>
                                                        {job.status}
                                                    </span>
                                                    {job.status === 'completed' && (
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                            onClick={() => handleDownload(job)}
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-700" />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-16 text-center">
                                        <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No activity yet</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                                            Your processed files will appear here for easy access.
                                        </p>
                                        <Link to="/" className="inline-flex items-center mt-6 text-red-600 font-bold hover:underline">
                                            Try a tool now <ArrowUpRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Quick Actions & Stats */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-gray-900 to-black dark:from-red-600 dark:to-red-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden transition-all">
                            <div className="relative z-10">
                                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                    Get unlimited cloud storage, higher file limits, and priority processing.
                                </p>
                                <Link to="/pricing">
                                    <Button variant="secondary" className="w-full">
                                        View Plans
                                    </Button>
                                </Link>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-10">
                                <FileStack className="h-40 w-40" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                                Guest Usage Limit
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Daily Operations</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{activities.length} / {GUEST_LIMIT}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                usagePercentage > 80 ? 'bg-red-600' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${usagePercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Plan</span>
                                    <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-lg uppercase tracking-wider">
                                        Free Guest
                                    </span>
                                </div>
                                {usagePercentage >= 100 && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                                            You've reached your daily limit. Sign up to continue processing more files.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
