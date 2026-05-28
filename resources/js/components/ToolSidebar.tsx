import React from "react";
import { Link } from "react-router-dom";

// Navigation links for all tool pages
const tools = [
  { path: "/image-to-pdf", label: "Image to PDF" },
  { path: "/merge-pdf", label: "Merge PDF" },
  { path: "/split-pdf", label: "Split PDF" },
  { path: "/watermark-pdf", label: "Watermark PDF" },
  { path: "/protect-pdf", label: "Protect PDF" },
  { path: "/organize-pdf", label: "Organize PDF" },
  { path: "/ai-summarizer", label: "Summarize PDF" },
  { path: "/ai-keywords", label: "Extract Keywords" },
  { path: "/ai-translate", label: "Translate PDF" },
  { path: "/edit-metadata", label: "Edit Metadata" },
  { path: "/ai-chat", label: "Chat with PDF" },
  { path: "/unlock-pdf", label: "Unlock PDF" },
  { path: "/file-to-pdf", label: "File to PDF" },
  { path: "/pdf-to-txt", label: "PDF to Text" },
  { path: "/pdf-to-docx", label: "PDF to DOCX" },
];

export const ToolSidebar: React.FC = () => (
  <nav className="space-y-2">
    {tools.map((tool) => (
      <Link
        key={tool.path}
        to={tool.path}
        className="block text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors"
      >
        {tool.label}
      </Link>
    ))}
  </nav>
);
