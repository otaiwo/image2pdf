import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
    Globe,
    Zap,
    FileCode,
    RefreshCw
} from "lucide-react";

const allTools = [
    { name: "Merge PDF", description: "Combine multiple PDFs into one.", icon: FileStack, category: "Organize", link: "/merge-pdf" },
    { name: "Split PDF", description: "Extract pages from your PDF.", icon: Scissors, category: "Organize", link: "/split-pdf" },
    { name: "Add Watermark", description: "Stamp text on your PDF.", icon: Stamp, category: "Edit", link: "/watermark-pdf" },
    { name: "Edit Metadata", description: "Change PDF Title, Author, and tags.", icon: Info, category: "Edit", link: "/edit-metadata" },
    { name: "AI Summarizer", description: "Summarize PDF with AI.", icon: Cpu, category: "AI", link: "/ai-summarizer" },
    { name: "AI Keywords", description: "Extract tags with AI.", icon: Tags, category: "AI", link: "/ai-keywords" },
    { name: "AI Translate", description: "Translate PDF content.", icon: Globe, category: "AI", link: "/ai-translate" },
    { name: "Image to PDF", description: "Convert images to PDF.", icon: ImageIcon, category: "Convert", link: "/image-to-pdf" },
    { name: "Protect PDF", description: "Add password to PDF.", icon: Lock, category: "Security", link: "/protect-pdf" },
    { name: "Unlock PDF", description: "Remove PDF password.", icon: Unlock, category: "Security", link: "/unlock-pdf" },
    // New conversion tools
   { name: "File to PDF", description: "Convert supported files to PDF.", icon: File, category: "Convert", link: "/file-to-pdf" },
    { name: "PDF to Text", description: "Extract plain text from PDFs.", icon: FileText, category: "Convert", link: "/pdf-to-txt" },
    { name: "PDF to DOCX", description: "Convert PDF documents to DOCX format.", icon: FileDown, category: "Convert", link: "/pdf-to-docx" },
    { name: "PDF to Image", description: "Convert PDF to JPG/PNG.", icon: ImageIcon, category: "Convert", link: "/pdf-to-image" },
    { name: "Compress PDF", description: "Reduce PDF file size.", icon: Zap, category: "Organize", link: "/compress-pdf" },
    { name: "Extract Pages", description: "Get specific pages from PDF.", icon: Scissors, category: "Organize", link: "/extract-pages" },
    { name: "Add Page Numbers", description: "Number PDF pages automatically.", icon: Hash, category: "Edit", link: "/add-page-numbers" },
    { name: "Sign PDF", description: "Sign your documents digitally.", icon: PenTool, category: "Edit", link: "/sign-pdf" },
    { name: "PDF to Excel", description: "Export PDF data to Excel.", icon: FileSpreadsheet, category: "Convert", link: "/pdf-to-excel" },
    { name: "PDF to PowerPoint", description: "Export PDF to PowerPoint.", icon: Presentation, category: "Convert", link: "/pdf-to-pptx" },
];

const ToolsHub: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    // Retrieve optional search query from URL (e.g., /tools?search=watermark)
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

    const categories = ["All", "Organize", "Edit", "Convert", "AI", "Security"];

    const filteredTools = allTools.filter(tool => {
        const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
        const matchesSearch = searchQuery
            ? tool.name.toLowerCase().includes(searchQuery) ||
              tool.description.toLowerCase().includes(searchQuery)
            : true;
        return matchesCategory && matchesSearch;
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
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
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
        </div>
    );
};

export default ToolsHub;
