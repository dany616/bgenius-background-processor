import { BackgroundRemover } from './background-remover';
import { BackgroundGenerator } from './background-generator';
import type { ProcessingResult, BackgroundRemovalConfig, BackgroundGenerationConfig } from '../types';

interface ProcessingOptions {
  prompt: string;
  removalModel?: 'tensorflow' | 'removebg';
  apiKey?: string;
  negativePrompt?: string;
  style?: string;
  steps?: number;
  seed?: number;
}

export class BackgroundProcessor {
  private remover: BackgroundRemover;
  private generator: BackgroundGenerator;

  constructor(
    removalConfig?: BackgroundRemovalConfig,
    generationConfig?: BackgroundGenerationConfig
  ) {
    this.remover = new BackgroundRemover(removalConfig);
    this.generator = new BackgroundGenerator(generationConfig);
  }

  async processImage(
    imageBuffer: Buffer,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Step 1: Remove background
      const removalResult = await this.remover.removeBackground(imageBuffer, {
        model: options.removalModel || 'tensorflow',
        apiKey: options.apiKey,
      });

      if (!removalResult.success || !removalResult.data) {
        return {
          success: false,
          error: `Background removal failed: ${removalResult.error || 'Unknown error'}`,
        };
      }

      // Step 2: Generate new background
      const generationResult = await this.generator.generateBackground(
        Buffer.isBuffer(removalResult.data) ? removalResult.data : Buffer.from(removalResult.data),
        {
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          style: options.style,
          steps: options.steps,
          seed: options.seed,
          apiKey: options.apiKey,
        }
      );

      if (!generationResult.success) {
        return {
          success: false,
          error: `Background generation failed: ${generationResult.error || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        data: generationResult.data,
        metadata: {
          originalSize: { width: 0, height: 0 }, // Would be filled with actual image dimensions
          processedSize: { width: 0, height: 0 },
          processingTime: Date.now() - startTime,
          model: 'combined',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  async dispose(): Promise<void> {
    await this.remover.dispose();
  }
} 