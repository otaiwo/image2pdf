import React from "react";
import { Upload, type LucideIcon } from "lucide-react";

interface UploadDropzoneProps {
    getRootProps: () => Record<string, unknown>;
    getInputProps: () => Record<string, unknown>;
    isDragActive: boolean;
    title: string;
    activeTitle?: string;
    subtitle?: string;
    hint?: string;
    icon?: LucideIcon;
    compact?: boolean;
    className?: string;
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({
    getRootProps,
    getInputProps,
    isDragActive,
    title,
    activeTitle,
    subtitle,
    hint,
    icon: Icon = Upload,
    compact = false,
    className = "",
}) => (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors ${className}`}>
        <div
            {...getRootProps()}
            role="button"
            className={`text-center cursor-pointer transition-all duration-200 ${
                compact ? "p-10" : "p-10 sm:p-16 lg:p-24"
            } ${
                isDragActive
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }`}
        >
            <input {...getInputProps()} />
            <div className={`inline-flex items-center justify-center rounded-full mb-6 transition-colors ${
                compact ? "w-16 h-16" : "w-20 h-20"
            } ${
                isDragActive ? "bg-red-100 dark:bg-red-900/40" : "bg-red-50 dark:bg-red-900/10"
            }`}>
                <Icon className={`transition-colors ${
                    compact ? "h-8 w-8" : "h-10 w-10"
                } ${
                    isDragActive ? "text-red-600 dark:text-red-400" : "text-red-600"
                }`} />
            </div>
            <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold text-gray-900 dark:text-white mb-2`}>
                {isDragActive ? activeTitle ?? title : title}
            </h3>
            {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                </p>
            )}
            {hint && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                    {hint}
                </p>
            )}
        </div>
    </div>
);

export default UploadDropzone;
