import type { ImageFile, ValidationResult, ProcessingOptions } from '../types';
export declare function validateImage(file: ImageFile): ValidationResult;
export declare function createImageProcessor(_options?: ProcessingOptions): {
    process: () => Promise<Buffer<ArrayBuffer>>;
};
export declare function resizeImage(buffer: Buffer, _width?: number, _height?: number): Promise<Buffer>;
export declare function convertFormat(buffer: Buffer, _format: string): Promise<Buffer>;
export declare function bufferToBase64(buffer: Buffer, mimeType: string): string;
export declare function base64ToBuffer(base64String: string): {
    buffer: Buffer;
    mimeType: string;
};
export declare function generateId(): string;
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map