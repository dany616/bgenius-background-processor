export interface ProcessingOptions {
  quality?: number;
  format?: ImageFormat;
  maxWidth?: number;
  maxHeight?: number;
}

export interface RemovalOptions extends ProcessingOptions {
  model?: 'tensorflow' | 'removebg';
  apiKey?: string | undefined;
  precision?: 'low' | 'medium' | 'high';
}

export interface GenerationOptions extends ProcessingOptions {
  prompt: string;
  negativePrompt?: string | undefined;
  style?: string | undefined;
  seed?: number | undefined;
  steps?: number | undefined;
  apiKey?: string | undefined;
}

export interface ProcessingResult {
  success: boolean;
  data?: Buffer | string | undefined;
  error?: string | undefined;
  metadata?: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    processingTime: number;
    model: string;
  } | undefined;
}

export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

export interface BackgroundRemovalConfig {
  apiKey?: string | undefined;
  modelPath?: string | undefined;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface BackgroundGenerationConfig {
  briaApiKey?: string | undefined;
  endpoint?: string | undefined;
  timeout?: number | undefined;
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
  error?: string | undefined;
  warnings?: string[] | undefined;
} 