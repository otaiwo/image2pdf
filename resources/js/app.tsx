import "./bootstrap";
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./layouts/AppLayout";

// Lazy load components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ImageToPdfConverter = lazy(() => import("./components/ImageToPdfConverter"));
const MergePdf = lazy(() => import("./pages/MergePdf"));
const SummarizePdf = lazy(() => import("./pages/SummarizePdf"));

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
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route path="/image-to-pdf" element={<ImageToPdfConverter />} />
                                <Route path="/merge-pdf" element={<MergePdf />} />
                                <Route path="/ai-summarizer" element={<SummarizePdf />} />
                                {/* Add more routes as needed */}
                            </Routes>
                        </Suspense>
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
