import type {
  ProcessingResult,
  BackgroundRemovalConfig,
  BackgroundGenerationConfig,
} from '../types';
interface ProcessingOptions {
  prompt: string;
  removalModel?: 'tensorflow' | 'removebg';
  apiKey?: string;
  negativePrompt?: string;
  style?: string;
  steps?: number;
  seed?: number;
}
export declare class BackgroundProcessor {
  private remover;
  private generator;
  constructor(
    removalConfig?: BackgroundRemovalConfig,
    generationConfig?: BackgroundGenerationConfig
  );
  processImage(
    imageBuffer: Buffer,
    options: ProcessingOptions
  ): Promise<ProcessingResult>;
  dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=background-processor.d.ts.map
