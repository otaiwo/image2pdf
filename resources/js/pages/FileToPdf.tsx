import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { File } from "lucide-react";

const FileToPdf: React.FC = () => {
    return (
        <ToolLayout
            title="File to PDF"
            description="Convert Word (DOCX), PowerPoint (PPTX), and Text (TXT) files to high-quality PDF."
            icon={File}
        >
            <div className="max-w-4xl mx-auto">
                <FileConverter initialType="file_to_pdf" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default FileToPdf;
