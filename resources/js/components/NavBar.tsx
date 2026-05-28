import React from "react";
import { Link, useLocation } from "react-router-dom";

export const NavBar: React.FC = () => {
  // Map of routes → human‑readable titles
  const TOOL_TITLES: Record<string, string> = {
    "/image-to-pdf": "Image to PDF",
    "/merge-pdf": "Merge PDF",
    "/split-pdf": "Split PDF",
    "/watermark-pdf": "Watermark PDF",
    "/protect-pdf": "Protect PDF",
    "/organize-pdf": "Organize PDF",
    "/ai-summarizer": "Summarize PDF",
    "/ai-keywords": "Extract Keywords",
    "/ai-translate": "Translate PDF",
    "/edit-metadata": "Edit Metadata",
    "/ai-chat": "Chat with PDF",
    "/unlock-pdf": "Unlock PDF",
    "/file-to-pdf": "File to PDF",
    "/pdf-to-txt": "PDF to Text",
    "/pdf-to-docx": "PDF to DOCX",
  };

  const location = useLocation();
  const currentTitle = TOOL_TITLES[location.pathname] ?? "Image2PDF";

  return (
    <nav className="bg-white dark:bg-gray-900 shadow">
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex justify-between items-center">
        {/* Dynamic title – links back to home */}
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          {currentTitle}
        </Link>

        {/* Static link to the tools hub */}
        <Link
          to="/tools"
          className="text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors"
        >
          Tools
        </Link>
      </div>
    </nav>
  );
};