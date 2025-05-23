import { BackgroundRemover } from './background-remover';
import { BackgroundGenerator } from './background-generator';
export class BackgroundProcessor {
    constructor(removalConfig, generationConfig) {
        this.remover = new BackgroundRemover(removalConfig);
        this.generator = new BackgroundGenerator(generationConfig);
    }
    async processImage(imageBuffer, options) {
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
            const generationResult = await this.generator.generateBackground(Buffer.isBuffer(removalResult.data)
                ? removalResult.data
                : Buffer.from(removalResult.data), {
                prompt: options.prompt,
                negativePrompt: options.negativePrompt,
                style: options.style,
                steps: options.steps,
                seed: options.seed,
                apiKey: options.apiKey,
            });
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Processing failed',
            };
        }
    }
    async dispose() {
        await this.remover.dispose();
    }
}
