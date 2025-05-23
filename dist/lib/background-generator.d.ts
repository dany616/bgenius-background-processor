import type { GenerationOptions, ProcessingResult, BackgroundGenerationConfig } from '../types';
export declare class BackgroundGenerator {
    private config;
    constructor(config?: BackgroundGenerationConfig);
    generateBackground(imageBuffer: Buffer, options: GenerationOptions): Promise<ProcessingResult>;
    private generateBackgroundWithBRIA;
}
//# sourceMappingURL=background-generator.d.ts.map