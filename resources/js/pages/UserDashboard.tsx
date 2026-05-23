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
    ArrowUpRight
} from "lucide-react";
import { api } from "../utils/api";
import { Link } from "react-router-dom";
import { ActivitySkeleton } from "../components/ui/Skeleton";

const toolIcons: Record<string, any> = {
    merge_pdf: FileStack,
    split_pdf: Scissors,
    watermark_pdf: Stamp,
    ai_summarize: Cpu,
    image_to_pdf: FileText,
};

const statusColors: Record<string, string> = {
    completed: "text-green-600 bg-green-50",
    processing: "text-blue-600 bg-blue-50",
    pending: "text-yellow-600 bg-yellow-50",
    failed: "text-red-600 bg-red-50",
};

const UserDashboard: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["recentActivity"],
        queryFn: () => api.getRecentActivity(),
    });

    const activities = data?.data || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage your recent PDF operations and tools.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Activity List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-red-600" />
                                Recent Activity
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {isLoading ? (
                                <ActivitySkeleton />
                            ) : activities.length > 0 ? (
                                activities.map((job: any) => {
                                    const Icon = toolIcons[job.type] || FileText;
                                    return (
                                        <div key={job.job_id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-2xl ${statusColors[job.status] || "bg-gray-100"}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">
                                                        {job.filename}
                                                    </h3>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
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
                                                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No activity yet</h3>
                                    <p className="text-gray-500 mt-1 max-w-xs mx-auto">
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
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Get unlimited cloud storage, higher file limits, and priority processing.
                            </p>
                            <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20">
                                View Plans
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-10">
                            <FileStack className="h-40 w-40" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            Usage Stats
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 font-medium">Daily Operations</span>
                                    <span className="text-gray-900 font-bold">{activities.length} / 5</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(activities.length / 5) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-sm text-gray-500">Plan Type</span>
                                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">Guest</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
