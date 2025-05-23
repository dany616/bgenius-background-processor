import { MAX_FILE_SIZE, SUPPORTED_MIME_TYPES, ERROR_MESSAGES, } from '../constants';
export function validateImage(file) {
    const warnings = [];
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.FILE_TOO_LARGE,
        };
    }
    // Check MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.INVALID_IMAGE,
        };
    }
    // Check if file is empty
    if (file.size === 0) {
        return {
            isValid: false,
            error: 'File is empty',
        };
    }
    // Add warnings for large files
    if (file.size > 5 * 1024 * 1024) {
        warnings.push('Large file size may result in slower processing');
    }
    return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
export function createImageProcessor(_options = {}) {
    return {
        process: () => Promise.resolve(Buffer.alloc(0)),
    };
}
export function resizeImage(buffer, _width, _height) {
    // Placeholder implementation
    return Promise.resolve(buffer);
}
export function convertFormat(buffer, _format) {
    // Placeholder implementation
    return Promise.resolve(buffer);
}
export function bufferToBase64(buffer, mimeType) {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
export function base64ToBuffer(base64String) {
    const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || !matches[1] || !matches[2]) {
        throw new Error('Invalid base64 string format');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType };
}
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
