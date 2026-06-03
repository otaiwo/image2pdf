import axios from "axios";
import { CsrfTokenManager } from "./utils/csrf";

window.axios = axios;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Initialize CSRF token protection
try {
    const csrf = CsrfTokenManager.getInstance();
    window.axios.defaults.headers.common["X-CSRF-TOKEN"] = csrf.getToken();
} catch (error) {
    console.error("Failed to initialize CSRF protection:", error);
    // Fail loudly in development
    if (process.env.NODE_ENV !== "production") {
        throw error;
    }
}
