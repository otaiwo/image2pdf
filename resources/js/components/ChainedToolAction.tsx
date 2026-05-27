import React from "react";
import { Link } from "react-router-dom";
import { 
    FileStack, 
    Scissors, 
    FileDown, 
    Image as ImageIcon, 
    Cpu, 
    ArrowRight,
    Stamp,
    Lock,
    Unlock,
    FileText,
    File,
    Info,
    Tags,
    Globe
} from "lucide-react";

const allTools = [
    { name: "Merge PDF", icon: FileStack, link: "/merge-pdf" },
    { name: "Split PDF", icon: Scissors, link: "/split-pdf" },
    { name: "Add Watermark", icon: Stamp, link: "/watermark-pdf" },
    { name: "Edit Metadata", icon: Info, link: "/edit-metadata" },
    { name: "AI Summarizer", icon: Cpu, link: "/ai-summarizer" },
    { name: "AI Keywords", icon: Tags, link: "/ai-keywords" },
    { name: "AI Translate", icon: Globe, link: "/ai-translate" },
    { name: "Image to PDF", icon: ImageIcon, link: "/image-to-pdf" },
    { name: "Protect PDF", icon: Lock, link: "/protect-pdf" },
    { name: "Unlock PDF", icon: Unlock, link: "/unlock-pdf" },
    { name: "File to PDF", icon: File, link: "/file-to-pdf" },
    { name: "PDF to Text", icon: FileText, link: "/pdf-to-txt" },
    { name: "PDF to DOCX", icon: FileDown, link: "/pdf-to-docx" },
];

interface ChainedToolActionProps {
    currentTool: string;
}

export const ChainedToolAction: React.FC<ChainedToolActionProps> = ({ currentTool }) => {
    // Filter out the current tool and pick 3 random ones
    const suggestions = allTools
        .filter(t => t.name !== currentTool)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    return (
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                What's Next?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {suggestions.map((tool) => (
                    <Link
                        key={tool.name}
                        to={tool.link}
                        className="group flex items-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/30 transition-all"
                    >
                        <div className="bg-white dark:bg-gray-900 p-2 rounded-xl mr-3 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                            <tool.icon className="h-4 w-4 text-gray-500 group-hover:text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {tool.name}
                            </p>
                            <p className="text-[10px] text-gray-500 flex items-center">
                                Try now <ArrowRight className="ml-1 h-2 w-2" />
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
