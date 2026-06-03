/**
 * Centralized CSRF token management
 * Single source of truth for CSRF token retrieval and validation
 */

import { AppError } from "./errors";

export class CsrfTokenManager {
    private static instance: CsrfTokenManager;
    private token: string | null = null;
    private readonly STORAGE_KEY = "__csrf_token";

    private constructor() {
        this.initializeToken();
        this.setupTokenRefresh();
    }

    /**
     * Get or create singleton instance
     */
    static getInstance(): CsrfTokenManager {
        if (!CsrfTokenManager.instance) {
            CsrfTokenManager.instance = new CsrfTokenManager();
        }
        return CsrfTokenManager.instance;
    }

    /**
     * Initialize CSRF token from meta tag
     * @throws Error if token not found in meta tag
     */
    private initializeToken(): void {
        const meta = document.querySelector('meta[name="csrf-token"]');
        const token = meta?.getAttribute("content");

        if (!token) {
            const error = new AppError(
                "CSRF_CONFIG_ERROR",
                'CSRF token not found. Ensure <meta name="csrf-token" content="..."> exists in HTML head',
                undefined
            );

            console.error(error.message);

            // Fail loudly in development
            if (process.env.NODE_ENV !== "production") {
                throw error;
            }

            return;
        }

        this.token = token;
        sessionStorage.setItem(this.STORAGE_KEY, token);
    }

    /**
     * Setup listener for token refresh events
     */
    private setupTokenRefresh(): void {
        window.addEventListener("csrf-token-refreshed", (event: Event) => {
            if (event instanceof CustomEvent) {
                const newToken = event.detail?.token;
                if (newToken && typeof newToken === "string") {
                    this.token = newToken;
                    sessionStorage.setItem(this.STORAGE_KEY, newToken);
                }
            }
        });
    }

    /**
     * Get current CSRF token
     * @throws Error if token not available
     */
    getToken(): string {
        if (!this.token) {
            const stored = sessionStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.token = stored;
                return stored;
            }

            throw new AppError(
                "CSRF_TOKEN_UNAVAILABLE",
                "CSRF token is not initialized"
            );
        }

        return this.token;
    }

    /**
     * Check if token is available and valid
     */
    isValid(): boolean {
        return !!this.token || !!sessionStorage.getItem(this.STORAGE_KEY);
    }

    /**
     * Refresh CSRF token from backend
     * Called when server returns 419 (token mismatch)
     */
    async refreshToken(): Promise<string> {
        try {
            const response = await fetch("/csrf-token", {
                method: "GET",
                headers: { "Accept": "application/json" },
                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new AppError(
                    "CSRF_REFRESH_FAILED",
                    `Failed to refresh CSRF token (${response.status})`,
                    response.status
                );
            }

            const data = await response.json() as { token: string };

            if (!data.token) {
                throw new AppError(
                    "CSRF_INVALID_RESPONSE",
                    "Invalid CSRF token in response"
                );
            }

            this.token = data.token;
            sessionStorage.setItem(this.STORAGE_KEY, data.token);

            // Notify other instances
            window.dispatchEvent(
                new CustomEvent("csrf-token-refreshed", {
                    detail: { token: data.token },
                })
            );

            return data.token;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "CSRF_REFRESH_ERROR",
                error instanceof Error ? error.message : "Failed to refresh CSRF token"
            );
        }
    }

    /**
     * Get CSRF token with fallback to cached value
     */
    getTokenSafe(): string | null {
        try {
            return this.getToken();
        } catch {
            return sessionStorage.getItem(this.STORAGE_KEY);
        }
    }

    /**
     * Reset token (for testing or logout)
     */
    reset(): void {
        this.token = null;
        sessionStorage.removeItem(this.STORAGE_KEY);
    }
}

/**
 * Export singleton instance
 */
export const csrf = CsrfTokenManager.getInstance();
