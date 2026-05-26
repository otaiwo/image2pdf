import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    FileStack,
    Scissors,
    FileDown,
    RefreshCw,
    Image as ImageIcon,
    Zap,
    ShieldCheck,
    Cpu,
    ArrowRight,
    Search,
    Stamp,
    Lock,
    Unlock,
    Type,
    FileText,
    MessageSquare
} from "lucide-react";

const allTools = [
    { name: "Merge PDF", description: "Combine multiple PDFs into one.", icon: FileStack, category: "Organize", link: "/merge-pdf" },
    { name: "Split PDF", description: "Extract pages from your PDF.", icon: Scissors, category: "Organize", link: "/split-pdf" },
    { name: "Add Watermark", description: "Stamp text on your PDF.", icon: Stamp, category: "Edit", link: "/watermark-pdf" },
    { name: "AI Summarizer", description: "Summarize PDF with AI.", icon: Cpu, category: "AI", link: "/ai-summarizer" },
    { name: "AI Chat", description: "Ask questions from PDF.", icon: MessageSquare, category: "AI", link: "/ai-chat" },
    { name: "Image to PDF", description: "Convert images to PDF.", icon: ImageIcon, category: "Convert", link: "/image-to-pdf" },
    { name: "PDF to Text", description: "Extract text from PDF.", icon: FileText, category: "Convert", link: "#" },
    { name: "Protect PDF", description: "Add password to PDF.", icon: Lock, category: "Security", link: "/protect-pdf" },
    { name: "Unlock PDF", description: "Remove PDF password.", icon: Unlock, category: "Security", link: "/unlock-pdf" },
];

const ToolsHub: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", "Organize", "Edit", "Convert", "AI", "Security"];

    const filteredTools = allTools.filter(tool => {
        const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
        return matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Tools for Every Need</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Everything you need to merge, split, compress, convert, and secure your PDF documents in one place.
                </p>
            </div>

            {/* Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeCategory === cat
                                        ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredTools.map((tool) => (
                    <Link
                        to={tool.link}
                        key={tool.name}
                        className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <div className="bg-gray-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-50 transition-colors">
                            <tool.icon className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">{tool.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{tool.description}</p>
                        <div className="flex items-center text-xs font-bold text-red-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Open Tool <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                    </Link>
                ))}
            </div>

            {filteredTools.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No tools found</h3>
                    <p className="text-gray-500">Try searching for something else.</p>
                </div>
            )}
        </div>
    );
};

export default ToolsHub;
