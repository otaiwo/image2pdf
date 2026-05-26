import React from "react";
import { ToolLayout } from "../components/ToolLayout";

/**
 * Simple static page for the "About Us" footer link.
 * Uses the existing {@link ToolLayout} component for consistent styling
 * with the rest of the application.
 */
const AboutUs: React.FC = () => {
    return (
        <ToolLayout title="About Us">
            <div className="prose dark:prose-dark max-w-3xl mx-auto py-8">
                <h2>About PDFMaster AI</h2>
                <p>
                    PDFMaster AI provides professional‑grade PDF tools powered by AI.
                    Our mission is to make PDF manipulation fast, easy, and accessible
                    for everyone. This page will contain more detailed information about
                    the company, our team, and our values.
                </p>
            </div>
        </ToolLayout>
    );
};

export default AboutUs;
