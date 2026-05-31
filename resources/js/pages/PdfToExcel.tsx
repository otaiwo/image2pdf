import React from "react";
import { ToolLayout } from "../components/ToolLayout";
import FileConverter from "../components/FileConverter";
import { FileSpreadsheet } from "lucide-react";

const PdfToExcel: React.FC = () => {
    return (
        <ToolLayout
            title="PDF to Excel"
            description="Extract tables and data from PDF documents directly into Microsoft Excel spreadsheets."
            icon={FileSpreadsheet}
        >
            <div className="max-w-4xl mx-auto">
                <FileConverter initialType="pdf_to_xlsx" showTypeSelector={false} />
            </div>
        </ToolLayout>
    );
};

export default PdfToExcel;
