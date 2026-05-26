import "./bootstrap";
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./layouts/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ImageToPdfConverter = lazy(() => import("./components/ImageToPdfConverter"));
const MergePdf = lazy(() => import("./pages/MergePdf"));
const SplitPdf = lazy(() => import("./pages/SplitPdf"));
const WatermarkPdf = lazy(() => import("./pages/WatermarkPdf"));
const ProtectPdf = lazy(() => import("./pages/ProtectPdf"));
const OrganizePdf = lazy(() => import("./pages/OrganizePdf"));
const SummarizePdf = lazy(() => import("./pages/SummarizePdf"));
const ChatWithPdf = lazy(() => import("./pages/ChatWithPdf"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const OrganizationDashboard = lazy(() => import("./pages/OrganizationDashboard"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ToolsHub = lazy(() => import("./pages/ToolsHub"));
const UnlockPdf = lazy(() => import("./pages/UnlockPdf"));
const RequireAuth = lazy(() => import("./components/RequireAuth"));
// New static pages for footer navigation
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

// Get CSRF token from meta tag
const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
if (csrfToken) {
    (window as any).csrfToken = csrfToken;
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
);

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <AppLayout>
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/tools" element={<ToolsHub />} />
                                <Route path="/image-to-pdf" element={<ImageToPdfConverter />} />
                                <Route path="/merge-pdf" element={<MergePdf />} />
                                <Route path="/split-pdf" element={<SplitPdf />} />
                                <Route path="/watermark-pdf" element={<WatermarkPdf />} />
                                <Route path="/protect-pdf" element={<ProtectPdf />} />
                                <Route path="/organize-pdf" element={<OrganizePdf />} />
                                <Route path="/ai-summarizer" element={<SummarizePdf />} />
                                <Route path="/ai-chat" element={<ChatWithPdf />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/dashboard" element={<UserDashboard />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/organizations" element={<RequireAuth><OrganizationDashboard /></RequireAuth>} />
                                <Route path="/pricing" element={<PricingPage />} />
                                <Route path="/unlock-pdf" element={<UnlockPdf />} />
                                <Route path="/about-us" element={<AboutUs />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                <Route path="/terms-of-service" element={<TermsOfService />} />
                                {/* Add more routes as needed */}
                            </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </AppLayout>
                </Router>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#363636",
                            color: "#fff",
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: "#10B981",
                                secondary: "#fff",
                            },
                        },
                        error: {
                            duration: 5000,
                            iconTheme: {
                                primary: "#EF4444",
                                secondary: "#fff",
                            },
                        },
                    }}
                />
            </QueryClientProvider>
        </React.StrictMode>,
    );
}
