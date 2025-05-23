// Main library exports
export { BackgroundRemover } from './lib/background-remover';
export { BackgroundGenerator } from './lib/background-generator';
export { BackgroundProcessor } from './lib/background-processor';

// Types
export type {
  ProcessingOptions,
  RemovalOptions,
  GenerationOptions,
  ProcessingResult,
  ImageFormat,
  BackgroundRemovalConfig,
  BackgroundGenerationConfig,
} from './types';

// Utils
export { validateImage, createImageProcessor } from './lib/utils';

// Constants
export { SUPPORTED_FORMATS, DEFAULT_OPTIONS } from './constants'; 