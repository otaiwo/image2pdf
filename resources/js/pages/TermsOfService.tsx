import React from "react";
import { ToolLayout } from "../components/ToolLayout";

/**
 * Placeholder terms of service page.
 */
const TermsOfService: React.FC = () => {
    return (
        <ToolLayout title="Terms of Service">
            <div className="prose dark:prose-dark max-w-3xl mx-auto py-8">
                <h2>Terms of Service</h2>
                <p>
                    This is a placeholder for the terms of service. It should outline
                    the legal agreement between the service provider and its users.
                </p>
            </div>
        </ToolLayout>
    );
};

export default TermsOfService;
