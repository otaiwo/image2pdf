import React from "react";
import {
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
} from "lucide-react";
import { StatusResponse } from "../utils/api";

interface ConversionProgressProps {
    job: StatusResponse;
    onDownload?: () => void;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({
    job,
    onDownload,
}) => {
    const getStatusColor = () => {
        switch (job.status) {
            case "completed":
                return "text-green-600 bg-green-50 border-green-200";
            case "failed":
                return "text-red-600 bg-red-50 border-red-200";
            case "processing":
                return "text-blue-600 bg-blue-50 border-blue-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const getStatusIcon = () => {
        switch (job.status) {
            case "completed":
                return <CheckCircle2 className="h-5 w-5" />;
            case "failed":
                return <XCircle className="h-5 w-5" />;
            case "processing":
                return <Loader2 className="h-5 w-5 animate-spin" />;
            default:
                return <Clock className="h-5 w-5" />;
        }
    };

    const getStatusText = () => {
        switch (job.status) {
            case "completed":
                return "Conversion Complete";
            case "failed":
                return "Conversion Failed";
            case "processing":
                return "Processing Images";
            default:
                return "Pending";
        }
    };

    return (
        <div className={`border-2 rounded-xl p-6 ${getStatusColor()}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {getStatusIcon()}
                    <div>
                        <h3 className="font-semibold">{getStatusText()}</h3>
                        <p className="text-sm opacity-75">
                            Job ID: {job.job_id.substring(0, 8)}...
                        </p>
                    </div>
                </div>
                {job.is_expired && (
                    <span className="text-sm font-medium px-3 py-1 bg-red-100 text-red-700 rounded-full">
                        Expired
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {job.status === "processing" && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Job Info */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="opacity-75">Status:</span>
                    <span className="font-medium capitalize">{job.status}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-75">Filename:</span>
                    <span className="font-medium truncate max-w-xs">
                        {job.filename}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-75">Started:</span>
                    <span>
                        {new Date(job.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>

            {/* Download Button */}
            {job.is_completed && !job.is_expired && onDownload && (
                <div className="mt-6">
                    <button
                        onClick={onDownload}
                        className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                    <p className="text-xs text-center mt-2 opacity-75">
                        Link expires in 1 hour
                    </p>
                </div>
            )}

            {/* Error Message */}
            {job.status === "failed" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                            The conversion failed. Please try again with
                            different images.
                        </p>
                    </div>
                </div>
            )}

            {/* Expired Message */}
            {job.is_expired && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                            This download link has expired. Please convert your
                            images again.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversionProgress;
