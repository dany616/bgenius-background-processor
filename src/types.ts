export interface ProcessingOptions {
  quality?: number;
  format?: ImageFormat;
  maxWidth?: number;
  maxHeight?: number;
}

export interface RemovalOptions extends ProcessingOptions {
  model?: 'tensorflow' | 'removebg';
  apiKey?: string;
  precision?: 'low' | 'medium' | 'high';
}

export interface GenerationOptions extends ProcessingOptions {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  seed?: number;
  steps?: number;
  apiKey?: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: Buffer | string;
  error?: string;
  metadata?: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    processingTime: number;
    model: string;
  };
}

export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

export interface BackgroundRemovalConfig {
  apiKey?: string;
  modelPath?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface BackgroundGenerationConfig {
  briaApiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface ImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[] | undefined;
} 