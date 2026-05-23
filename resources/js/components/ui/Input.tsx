import React from "react";
import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className,
    ...props
}) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(
                        "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none",
                        icon && "pl-11",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
