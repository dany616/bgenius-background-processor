import type { ProcessingOptions, RemovalOptions, GenerationOptions } from './types';
export declare const SUPPORTED_FORMATS: readonly ["png", "jpg", "jpeg", "webp"];
export declare const DEFAULT_OPTIONS: ProcessingOptions;
export declare const DEFAULT_REMOVAL_OPTIONS: RemovalOptions;
export declare const DEFAULT_GENERATION_OPTIONS: Partial<GenerationOptions>;
export declare const API_ENDPOINTS: {
    readonly REMOVE_BG: "https://api.remove.bg/v1.0/removebg";
    readonly BRIA: "https://platform.bria.ai/api/v1/image/generate";
};
export declare const MAX_FILE_SIZE: number;
export declare const SUPPORTED_MIME_TYPES: readonly ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export declare const ERROR_MESSAGES: {
    readonly INVALID_IMAGE: "Invalid image format or corrupted file";
    readonly FILE_TOO_LARGE: "File size exceeds maximum allowed size";
    readonly API_KEY_MISSING: "API key is required for this operation";
    readonly NETWORK_ERROR: "Network error occurred during processing";
    readonly PROCESSING_FAILED: "Image processing failed";
    readonly INVALID_PROMPT: "Prompt is required for background generation";
};
//# sourceMappingURL=constants.d.ts.map