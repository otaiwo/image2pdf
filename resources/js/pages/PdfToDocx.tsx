import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { FileDown } from "lucide-react";

const PdfToDocx: React.FC = () => {
    return (
        <ToolLayout
            title="PDF to DOCX"
            description="Convert your PDF documents to editable Microsoft Word files."
            icon={FileDown}
        >
            <div className="max-w-4xl mx-auto">
                <FileConverter initialType="pdf_to_docx" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default PdfToDocx;
