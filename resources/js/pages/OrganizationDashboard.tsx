import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Settings,
    Plus,
    Shield,
    Layout,
    FileText,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import { api } from "../utils/api";
import { Link } from "react-router-dom";

const OrganizationDashboard: React.FC = () => {
    // This would typically fetch the active organization's data
    const { data, isLoading } = useQuery({
        queryKey: ["organizations"],
        queryFn: () => (api as any).client.get("/organizations"),
    });

    const organizations = data?.data?.data || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Layout className="h-8 w-8 mr-3 text-red-600" />
                        Team Workspace
                    </h1>
                    <p className="text-gray-600 mt-2">Collaborate with your team and manage shared PDF operations.</p>
                </div>
                <button className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg transition-all">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Organization
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Organizations List */}
                <div className="lg:col-span-2 space-y-6">
                    {isLoading ? (
                        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading your workspace...</p>
                        </div>
                    ) : organizations.length > 0 ? (
                        organizations.map((org: any) => (
                            <div key={org.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-2xl border border-red-100">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
                                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                                                <Users className="h-4 w-4 mr-1" />
                                                Managed by You • {org.slug}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                            Manage Team
                                        </button>
                                        <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200 transition-all">
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No organizations found</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                Create a team workspace to share files and collaborate with your colleagues.
                            </p>
                            <button className="mt-8 text-red-600 font-bold flex items-center mx-auto hover:underline">
                                Start collaborating <ArrowUpRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar - Team Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-blue-600" />
                            Workspace Benefits
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Shared file storage",
                                "Team activity monitoring",
                                "Role-based permissions",
                                "Collaborative editing",
                            ].map((benefit, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-600">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-600 mr-3 shrink-0" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationDashboard;
