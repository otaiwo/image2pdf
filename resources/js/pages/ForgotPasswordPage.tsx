import React from "react";
import { Link } from "react-router-dom";
import { FileCode2, Mail, ArrowLeft } from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
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
                    <h2 className="text-3xl font-extrabold text-gray-900">Reset password</h2>
                    <p className="mt-2 text-gray-600">Enter your email and we'll send you a link</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all">
                            Send Reset Link
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/login" className="inline-flex items-center font-bold text-gray-600 hover:text-red-600 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
