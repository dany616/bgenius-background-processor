export const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
export const DEFAULT_OPTIONS = {
    quality: 90,
    format: 'png',
    maxWidth: 2048,
    maxHeight: 2048,
};
export const DEFAULT_REMOVAL_OPTIONS = {
    ...DEFAULT_OPTIONS,
    model: 'tensorflow',
    precision: 'medium',
};
export const DEFAULT_GENERATION_OPTIONS = {
    ...DEFAULT_OPTIONS,
    negativePrompt: 'blurry, low quality, distorted',
    steps: 30,
    style: 'realistic',
};
export const API_ENDPOINTS = {
    REMOVE_BG: 'https://api.remove.bg/v1.0/removebg',
    BRIA: 'https://platform.bria.ai/api/v1/image/generate',
};
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];
export const ERROR_MESSAGES = {
    INVALID_IMAGE: 'Invalid image format or corrupted file',
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    API_KEY_MISSING: 'API key is required for this operation',
    NETWORK_ERROR: 'Network error occurred during processing',
    PROCESSING_FAILED: 'Image processing failed',
    INVALID_PROMPT: 'Prompt is required for background generation',
};
