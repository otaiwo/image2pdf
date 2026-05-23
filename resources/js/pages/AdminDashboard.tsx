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
    RefreshCw
} from "lucide-react";
import { api } from "../utils/api";

const AdminDashboard: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["adminStats"],
        queryFn: () => api.getAdminStats(),
    });

    const stats = data?.data?.metrics || {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        total_users: 0,
        success_rate: 0,
    };

    const recentJobs = data?.data?.recent_jobs || [];

    const cards = [
        { name: "Total Operations", value: stats.total_jobs, icon: Activity, color: "text-blue-600 bg-blue-100" },
        { name: "Success Rate", value: `${stats.success_rate}%`, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
        { name: "Total Users", value: stats.total_users, icon: Users, color: "text-purple-600 bg-purple-100" },
        { name: "Failed Tasks", value: stats.failed_jobs, icon: AlertCircle, color: "text-red-600 bg-red-100" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <ShieldAlert className="h-8 w-8 mr-3 text-red-600" />
                        Admin Analytics
                    </h1>
                    <p className="text-gray-600 mt-2">Global system performance and usage metrics.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {cards.map((card) => (
                    <div key={card.name} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">{card.name}</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Jobs Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                Global Activity Log
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Job ID</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                                                Loading global activity...
                                            </td>
                                        </tr>
                                    ) : recentJobs.length > 0 ? (
                                        recentJobs.map((job: any) => (
                                            <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                                    {job.job_id.substring(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                                        {job.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                                        job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        job.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {job.user}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
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
                <div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                            Tool Usage
                        </h3>
                        <div className="space-y-4">
                            {data?.data?.usage_by_type?.map((item: any) => (
                                <div key={item.type}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 capitalize">{item.type.replace('_', ' ')}</span>
                                        <span className="text-gray-900 font-bold">{item.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="bg-purple-600 h-1.5 rounded-full"
                                            style={{ width: `${(item.total / (stats.total_jobs || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
