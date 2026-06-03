/**
 * Comprehensive file validation with magic number detection
 * Prevents MIME type spoofing and malicious file uploads
 */

import { AppError } from "./errors";

export interface FileValidationOptions {
    maxSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    customValidators?: ((file: File) => Promise<boolean>)[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Magic number signatures for common file types
const FILE_SIGNATURES: Record<string, number[][]> = {
    "image/jpeg": [[0xff, 0xd8, 0xff, 0xe0]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (need to check for WEBP)
    "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

export const DEFAULT_IMAGE_VALIDATORS: FileValidationOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
};

export const DEFAULT_PDF_VALIDATORS: FileValidationOptions = {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["application/pdf"],
    allowedExtensions: [".pdf"],
};

/**
 * Validates files based on size, MIME type, extension, and magic numbers
 */
export class FileValidator {
    private options: FileValidationOptions;

    constructor(options: Partial<FileValidationOptions> = {}) {
        this.options = { ...DEFAULT_IMAGE_VALIDATORS, ...options };
    }

    /**
     * Validate a single file
     * @throws ValidationError if validation fails
     */
    async validate(file: File): Promise<ValidationResult> {
        const errors: string[] = [];

        // 1. Check file size
        const sizeError = this.validateSize(file.size);
        if (sizeError) {
            errors.push(sizeError);
        }

        // 2. Check MIME type
        if (!this.isMimeTypeAllowed(file.type)) {
            errors.push(
                `Invalid file type: ${file.type || "unknown"}. ` +
                `Allowed: ${this.options.allowedMimeTypes.join(", ")}`
            );
        }

        // 3. Check file extension
        if (!this.isExtensionAllowed(file.name)) {
            errors.push(
                `Invalid file extension. Allowed: ${this.options.allowedExtensions.join(", ")}`
            );
        }

        // 4. Verify magic number (file signature) to prevent MIME type spoofing
        const magicValid = await this.validateMagicNumber(file);
        if (!magicValid) {
            errors.push(
                "File content does not match the declared type (magic number mismatch). " +
                "This may indicate a malicious file."
            );
        }

        // 5. Run custom validators
        if (this.options.customValidators && this.options.customValidators.length > 0) {
            for (const validator of this.options.customValidators) {
                try {
                    const isValid = await validator(file);
                    if (!isValid) {
                        errors.push("File failed custom validation checks");
                        break; // Stop after first custom validator failure
                    }
                } catch (error) {
                    errors.push(
                        `Custom validation error: ${error instanceof Error ? error.message : "Unknown error"}`
                    );
                    break;
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate multiple files
     */
    async validateMultiple(files: File[]): Promise<Map<string, ValidationResult>> {
        const results = new Map<string, ValidationResult>();

        for (const file of files) {
            const result = await this.validate(file);
            results.set(file.name, result);
        }

        return results;
    }

    /**
     * Validate file size
     */
    private validateSize(fileSize: number): string | null {
        if (fileSize > this.options.maxSize) {
            return (
                `File too large: ${this.formatFileSize(fileSize)}. ` +
                `Maximum allowed: ${this.formatFileSize(this.options.maxSize)}`
            );
        }

        if (fileSize === 0) {
            return "File is empty";
        }

        return null;
    }

    /**
     * Check if MIME type is allowed
     */
    private isMimeTypeAllowed(mimeType: string): boolean {
        if (!mimeType) return false;

        return this.options.allowedMimeTypes.some((allowed) => {
            if (allowed.endsWith("/*")) {
                // Handle wildcard MIME types like "image/*"
                const prefix = allowed.replace("/*", "/");
                return mimeType.startsWith(prefix);
            }
            return mimeType === allowed;
        });
    }

    /**
     * Check if file extension is allowed
     */
    private isExtensionAllowed(filename: string): boolean {
        if (!filename) return false;

        const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
        if (!ext) return false;

        return this.options.allowedExtensions.includes(ext);
    }

    /**
     * Verify file magic number (signature) to prevent MIME type spoofing
     * Reads first few bytes of file to verify it matches declared type
     */
    private async validateMagicNumber(file: File): Promise<boolean> {
        try {
            // Read first 12 bytes for signature detection
            const buffer = await file.slice(0, 12).arrayBuffer();
            const view = new Uint8Array(buffer);

            // If we don't have a signature definition, allow it
            const signatures = FILE_SIGNATURES[file.type];
            if (!signatures) {
                return true; // No signature to check
            }

            // Check if file starts with any known signature for this type
            return signatures.some((signature) =>
                signature.every((byte, i) => view[i] === byte)
            );
        } catch (error) {
            // If we can't read the file, be conservative and reject it
            console.error("Failed to validate magic number:", error);
            return false;
        }
    }

    /**
     * Format bytes to human-readable size
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 B";

        const units = ["B", "KB", "MB", "GB"];
        const k = 1024;
        let size = bytes;
        let unitIndex = 0;

        while (size >= k && unitIndex < units.length - 1) {
            size /= k;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Get maximum allowed file size in human-readable format
     */
    getMaxSizeFormatted(): string {
        return this.formatFileSize(this.options.maxSize);
    }

    /**
     * Get list of allowed extensions
     */
    getAllowedExtensions(): string[] {
        return this.options.allowedExtensions;
    }

    /**
     * Get list of allowed MIME types
     */
    getAllowedMimeTypes(): string[] {
        return this.options.allowedMimeTypes;
    }
}

/**
 * Create image file validator
 */
export function createImageValidator(): FileValidator {
    return new FileValidator(DEFAULT_IMAGE_VALIDATORS);
}

/**
 * Create PDF file validator
 */
export function createPdfValidator(): FileValidator {
    return new FileValidator(DEFAULT_PDF_VALIDATORS);
}

/**
 * Validate dropped files from drag-drop
 */
export async function validateDroppedFiles(
    files: File[],
    validator: FileValidator
): Promise<{ valid: File[]; invalid: Map<string, string[]> }> {
    const valid: File[] = [];
    const invalid = new Map<string, string[]>();

    for (const file of files) {
        const result = await validator.validate(file);
        if (result.isValid) {
            valid.push(file);
        } else {
            invalid.set(file.name, result.errors);
        }
    }

    return { valid, invalid };
}
