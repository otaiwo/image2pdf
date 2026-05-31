import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { Presentation } from "lucide-react";

const PdfToPpt: React.FC = () => {
    return (
        <ToolLayout
            title="PDF to PowerPoint"
            description="Convert your PDF pages into editable PowerPoint presentation slides."
            icon={Presentation}
        >
            <div className="max-w-4xl mx-auto">
                <FileConverter initialType="pdf_to_pptx" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default PdfToPpt;
