import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { FileDown } from "lucide-react";

const PdfToDocx: React.FC = () => {
    return (
        <ToolLayout
            title="PDF to DOCX"
        >
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
                        <FileDown className="h-8 w-8 text-red-600" />
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        PDF to DOCX
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                        Convert your PDF documents to editable Microsoft Word files.
                    </p>
                </div>

                <FileConverter initialType="pdf_to_docx" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default PdfToDocx;
