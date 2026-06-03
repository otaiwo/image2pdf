/**
 * Centralized error handling for the application
 * All errors are typed and can be classified for appropriate handling
 */

export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode?: number,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "AppError";
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static isAppError(error: unknown): error is AppError {
        return error instanceof AppError;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
        };
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        public fields: Record<string, string[]> = {}
    ) {
        super("VALIDATION_ERROR", message, 422);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication required") {
        super("AUTH_ERROR", message, 401);
        this.name = "AuthenticationError";
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Insufficient permissions") {
        super("AUTHZ_ERROR", message, 403);
        this.name = "AuthorizationError";
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = "Resource") {
        super("NOT_FOUND", `${resource} not found`, 404);
        this.name = "NotFoundError";
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class NetworkError extends AppError {
    constructor(message: string = "Network request failed") {
        super("NETWORK_ERROR", message);
        this.name = "NetworkError";
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource conflict") {
        super("CONFLICT_ERROR", message, 409);
        this.name = "ConflictError";
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export class RateLimitError extends AppError {
    constructor(
        message: string = "Too many requests",
        public retryAfter?: number
    ) {
        super("RATE_LIMIT_ERROR", message, 429);
        this.name = "RateLimitError";
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * Convert Axios errors to typed AppError instances
 */
export function handleAxiosError(error: any): AppError {
    // Network error (no response from server)
    if (!error.response) {
        return new NetworkError(
            error.message || "Unable to reach the server"
        );
    }

    const { status, data } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
        case 401:
            return new AuthenticationError(
                data?.message || "Your session has expired"
            );

        case 403:
            return new AuthorizationError(
                data?.message || "You do not have permission to perform this action"
            );

        case 404:
            return new NotFoundError(
                data?.message || "Resource"
            );

        case 409:
            return new ConflictError(
                data?.message || "This resource already exists"
            );

        case 422:
            return new ValidationError(
                data?.message || "Validation failed",
                data?.errors || {}
            );

        case 429:
            return new RateLimitError(
                data?.message || "Too many requests",
                parseInt(error.response.headers["retry-after"]) || undefined
            );

        default:
            return new AppError(
                `HTTP_${status}`,
                data?.message || `An error occurred (${status})`,
                status,
                error
            );
    }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (AppError.isAppError(error)) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "An unexpected error occurred";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (AppError.isAppError(error)) {
        return (
            error.code === "NETWORK_ERROR" ||
            error.code === "RATE_LIMIT_ERROR" ||
            error.statusCode === 408 || // Request Timeout
            error.statusCode === 500 || // Internal Server Error
            error.statusCode === 502 || // Bad Gateway
            error.statusCode === 503 || // Service Unavailable
            error.statusCode === 504    // Gateway Timeout
        );
    }

    return false;
}

/**
 * Log error with context
 */
export function logError(
    error: unknown,
    context?: Record<string, any>
): void {
    const errorData = AppError.isAppError(error)
        ? error.toJSON()
        : { message: String(error) };

    console.error("Error:", {
        ...errorData,
        context,
        timestamp: new Date().toISOString(),
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
        // Example: Sentry.captureException(error, { contexts: { app: context } });
    }
}
