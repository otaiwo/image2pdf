import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Zap,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Activity,
    ShieldAlert,
    RefreshCw,
    ArrowUpRight,
    Search
} from "lucide-react";
import { api } from "../utils/api";
import { AdminStats } from "../types/api";

const AdminDashboard: React.FC = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["adminStats"],
        queryFn: () => api.getAdminStats(),
    });

    const stats = (data?.data as AdminStats)?.metrics || {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        total_users: 0,
        success_rate: 0,
    };

    const recentJobs = (data?.data as AdminStats)?.recent_jobs || [];
    const usageByType = (data?.data as AdminStats)?.usage_by_type || [];

    const cards = [
        { name: "Total Operations", value: stats.total_jobs, icon: Activity, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
        { name: "Success Rate", value: `${stats.success_rate}%`, icon: CheckCircle2, color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
        { name: "Total Users", value: stats.total_users, icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
        { name: "Failed Tasks", value: stats.failed_jobs, icon: AlertCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
    ];

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                            <ShieldAlert className="h-8 w-8 mr-3 text-red-600" />
                            Admin Analytics
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Global system performance and usage metrics.</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {cards.map((card) => (
                        <div key={card.name} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${card.color}`}>
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.name}</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Jobs Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 dark:text-white flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                    Global Activity Log
                                </h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search jobs..."
                                        className="pl-8 pr-4 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-red-500 outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Job ID</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                                                    Loading global activity...
                                                </td>
                                            </tr>
                                        ) : recentJobs.length > 0 ? (
                                            recentJobs.map((job: any) => (
                                                <tr key={job.job_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                                                        {job.job_id.substring(0, 8)}...
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                            {job.type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                                            job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {job.user}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">
                                                        {job.created_at}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                                    No operations found in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* System Distribution */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                                Tool Usage
                            </h3>
                            <div className="space-y-6">
                                {usageByType.length > 0 ? usageByType.map((item: any) => (
                                    <div key={item.type}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400 capitalize">{item.type.replace('_', ' ')}</span>
                                            <span className="text-gray-900 dark:text-white font-bold">{item.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000"
                                                style={{ width: `${(item.total / (stats.total_jobs || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No data available</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Success Rate</h3>
                            <div className="flex items-center justify-center p-6">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-100 dark:text-gray-800 stroke-current"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-green-500 stroke-current"
                                            strokeWidth="3"
                                            strokeDasharray={`${stats.success_rate}, 100`}
                                            strokeLinecap="round"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <text x="18" y="20.35" className="text-gray-900 dark:text-white font-bold text-center" textAnchor="middle" fontSize="8px">
                                            {stats.success_rate}%
                                        </text>
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">Percentage of completed vs total operations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
