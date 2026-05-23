import React from "react";
import { cn } from "../../utils/cn";

const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn("animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md", className)} />
    );
};

export const ActivitySkeleton = () => (
    <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
        ))}
    </div>
);

export default Skeleton;
