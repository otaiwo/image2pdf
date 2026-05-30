import React, { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "../components/ToolLayout";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    Lock,
    Download,
    Eye,
    EyeOff,
    ShieldCheck,
    X,
    Printer,
    Copy,
    Edit,
    MessageSquare,
    Files,
    Shield,
    FileText,
    Key,
    Droplets
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import type { StatusResponse } from "../types/api";
import { ChainedToolAction } from "../components/ChainedToolAction";
import Button from "../components/ui/Button";
import { usePdfTool } from "../hooks/usePdfTool";

const PermissionToggle: React.FC<{
    icon: any;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ icon: Icon, label, checked, onChange }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-colors ${checked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${checked ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
            <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
    if (!password) return null;

    let strength = 0;
    if (password.length > 6) strength++;
    if (password.length > 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const getStrengthColor = () => {
        if (strength <= 2) return "bg-red-500";
        if (strength <= 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthText = () => {
        if (strength <= 2) return "Weak";
        if (strength <= 3) return "Medium";
        return "Strong";
    };

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Strength: {getStrengthText()}</span>
            </div>
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                />
            </div>
        </div>
    );
};

const ProtectPdf: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [completedJobs, setCompletedJobs] = useState<StatusResponse[]>([]);

    // Security Options
    const [options, setOptions] = useState({
        owner_password: "",
        allow_printing: true,
        allow_copying: true,
        allow_editing: true,
        allow_annotating: true,
        allow_extracting: true,
        scrub_metadata: false,
        watermark_text: ""
    });

    const {
        isProcessing,
        job,
        startJob,
        downloadFile,
        reset
    } = usePdfTool("Protect PDF", {
        onSuccess: () => {
            toast.success("PDF protected successfully!");
        }
    });

    useEffect(() => {
        if (job?.is_completed) {
            setCompletedJobs(prev => {
                const exists = prev.find(j => j.job_id === job.job_id);
                if (exists) return prev;
                return [...prev, job];
            });
        }
    }, [job]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFiles(prev => [...prev, ...acceptedFiles]);
            reset();
            toast.success(`Added ${acceptedFiles.length} file(s)`);
        }
    }, [reset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] }
    });

    const handleProtect = async () => {
        if (files.length === 0) return;

        if (password.length < 4) {
            toast.error("Password must be at least 4 characters long");
            return;
        }

        await startJob(
            () => api.uploadProtectFile(files, password, options),
            (id) => api.getProtectStatus(id)
        );
    };

    const setPreset = (type: 'confidential' | 'review' | 'public') => {
        switch(type) {
            case 'confidential':
                setOptions({
                    ...options,
                    allow_printing: false,
                    allow_copying: false,
                    allow_editing: false,
                    allow_annotating: false,
                    allow_extracting: false
                });
                break;
            case 'review':
                setOptions({
                    ...options,
                    allow_printing: true,
                    allow_copying: true,
                    allow_editing: false,
                    allow_annotating: true,
                    allow_extracting: false
                });
                break;
            case 'public':
                setOptions({
                    ...options,
                    allow_printing: true,
                    allow_copying: true,
                    allow_editing: true,
                    allow_annotating: true,
                    allow_extracting: true
                });
                break;
        }
    };

    const handleDownload = async (jobToDownload?: StatusResponse) => {
        await downloadFile((id) => api.downloadProtectPdf(id), jobToDownload?.filename);
    };

    const handleReset = () => {
        setFiles([]);
        setPassword("");
        reset();
    };

    const sidebarContent = files.length > 0 && !job ? (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-red-600" />
                    Security Settings
                </h3>

                <div className="space-y-4">
                    {/* Presets */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Quick Presets
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPreset('confidential')}
                                className="px-2 py-2 text-[10px] font-bold rounded-lg border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                                Strict
                            </button>
                            <button
                                onClick={() => setPreset('review')}
                                className="px-2 py-2 text-[10px] font-bold rounded-lg border border-yellow-100 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                            >
                                Review
                            </button>
                            <button
                                onClick={() => setPreset('public')}
                                className="px-2 py-2 text-[10px] font-bold rounded-lg border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                                Public
                            </button>
                        </div>
                    </div>

                    {/* Passwords */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                <Key className="h-3 w-3 inline mr-1" />
                                User Password (to open)
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password to open"
                                    disabled={isProcessing}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none disabled:opacity-50 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <PasswordStrength password={password} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                <Shield className="h-3 w-3 inline mr-1" />
                                Owner Password (to edit)
                            </label>

                            <div className="relative">
                                <input
                                    type={showOwnerPassword ? "text" : "password"}
                                    value={options.owner_password}
                                    onChange={(e) => setOptions({...options, owner_password: e.target.value})}
                                    placeholder="Optional: Admin password"
                                    disabled={isProcessing}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none disabled:opacity-50 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Restrict Permissions
                        </label>

                        <PermissionToggle
                            icon={Printer}
                            label="Allow Printing"
                            checked={options.allow_printing}
                            onChange={(v) => setOptions({ ...options, allow_printing: v })}
                        />
                        <PermissionToggle
                            icon={Copy}
                            label="Allow Copying"
                            checked={options.allow_copying}
                            onChange={(v) => setOptions({ ...options, allow_copying: v })}
                        />
                        <PermissionToggle
                            icon={Edit}
                            label="Allow Editing"
                            checked={options.allow_editing}
                            onChange={(v) => setOptions({ ...options, allow_editing: v })}
                        />
                        <PermissionToggle
                            icon={MessageSquare}
                            label="Allow Annotations"
                            checked={options.allow_annotating}
                            onChange={(v) => setOptions({ ...options, allow_annotating: v })}
                        />
                        <PermissionToggle
                            icon={Files}
                            label="Allow Page Extraction"
                            checked={options.allow_extracting}
                            onChange={(v) => setOptions({ ...options, allow_extracting: v })}
                        />
                    </div>

                    {/* Advanced */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                <Droplets className="h-3 w-3 inline mr-1" />
                                Add Text Watermark
                            </label>
                            <input
                                type="text"
                                value={options.watermark_text}
                                onChange={(e) => setOptions({...options, watermark_text: e.target.value})}
                                placeholder="e.g. CONFIDENTIAL"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
                            />
                        </div>

                        <PermissionToggle
                            icon={FileText}
                            label="Scrub Metadata"
                            checked={options.scrub_metadata}
                            onChange={(v) => setOptions({ ...options, scrub_metadata: v })}
                        />
                    </div>
                </div>
            </div>

            <Button
                onClick={handleProtect}
                isLoading={isProcessing}
                disabled={isProcessing || password.length < 4}
                size="lg"
                className="w-full"
            >
                {!isProcessing && <ShieldCheck className="h-5 w-5 mr-2" />}
                {isProcessing ? "Protecting..." : "Protect PDF"}
            </Button>
        </div>
    ) : null;

    return (
        <ToolLayout
            title="Protect PDF"
            description="Secure your PDF document with a password and prevent unauthorized access to your files."
            icon={Lock}
            sidebar={sidebarContent}
            activeJob={job}
            jobs={completedJobs}
            onDownload={handleDownload}
            onReset={handleReset}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {files.length === 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        <div
                            {...getRootProps()}
                            className="p-24 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-200"
                        >
                            <input {...getInputProps()} />
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full mb-6">
                                <Lock className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {isDragActive ? "Drop your PDFs here" : "Select PDF Files"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                or drag and drop your PDFs here (supports batch protection)
                            </p>
                        </div>
                    </div>
                )}

                {files.length > 0 && !job && (
                    <div className="space-y-4">
                        {files.map((file, index) => (
                            <div key={index} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                                        <Lock className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs md:max-w-md">
                                            {file.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}

                        <div
                            {...getRootProps()}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-center cursor-pointer hover:border-red-300 transition-colors"
                        >
                            <input {...getInputProps()} />
                            <p className="text-sm text-gray-500">+ Add more files</p>
                        </div>
                    </div>
                )}

                {job?.is_completed && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <ChainedToolAction currentTool="Protect PDF" />
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default ProtectPdf;
