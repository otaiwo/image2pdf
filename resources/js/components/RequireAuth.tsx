import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Simple authentication guard for routes that require a logged‑in user.
 * If the user is not authenticated, they are redirected to the login page.
 * Otherwise the wrapped children are rendered.
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Preserve the intended location so the login page can redirect back if needed.
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
