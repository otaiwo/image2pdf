import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileCode2, Mail, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.axios.post("/login", { email, password });
            if (response.data.success) {
                setAuth(response.data.user, response.data.token);
                toast.success("Welcome back!");
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="bg-red-600 p-2 rounded-xl">
                            <FileCode2 className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">PDFMaster AI</span>
                    </Link>
                    <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
                    <p className="mt-2 text-gray-600">Please enter your details to sign in</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link to="/forgot-password" title="Forgot Password" className="text-sm font-medium text-red-600 hover:text-red-700">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center group disabled:opacity-50"
                        >
                            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-bold text-red-600 hover:text-red-700">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
