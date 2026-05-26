import React from "react";
import { ToolLayout } from "../components/ToolLayout";

/**
 * Placeholder privacy policy page.
 */
const PrivacyPolicy: React.FC = () => {
    return (
        <ToolLayout title="Privacy Policy">
            <div className="prose dark:prose-dark max-w-3xl mx-auto py-8">
                <h2>Privacy Policy</h2>
                <p>
                    This is a placeholder for the privacy policy. In a real
                    application you would detail how user data is collected,
                    stored, and processed.
                </p>
            </div>
        </ToolLayout>
    );
};

export default PrivacyPolicy;
