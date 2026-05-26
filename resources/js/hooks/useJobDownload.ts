import { useCallback } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { StatusResponse } from "../utils/api";

/**
 * Hook that returns a download handler for a job.
 * Mirrors the logic used in UserDashboard.
 */
export const useJobDownload = () => {
    const handleDownload = useCallback(async (job: StatusResponse) => {
        if (!job?.job_id) {
            toast.error("Invalid job data");
            return;
        }
        try {
            const blob = await api.downloadPdf(job.job_id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = job.filename || "download.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Download started");
        } catch (error) {
            toast.error("Failed to download PDF");
        }
    }, []);

    return { handleDownload };
};
