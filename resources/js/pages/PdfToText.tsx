import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { FileText } from "lucide-react";

const PdfToText: React.FC = () => {
    return (
        <ToolLayout
            title="PDF to Text"
            description="Extract plain text from your PDF documents in seconds."
            icon={FileText}
        >
            <div className="max-w-4xl mx-auto">
                <FileConverter initialType="pdf_to_txt" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default PdfToText;
