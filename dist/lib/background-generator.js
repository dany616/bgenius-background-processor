import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, DEFAULT_GENERATION_OPTIONS, } from '../constants';
import { validateImage, bufferToBase64 } from './utils';
export class BackgroundGenerator {
    constructor(config = {}) {
        this.config = {
            endpoint: API_ENDPOINTS.BRIA,
            timeout: 30000,
            retryAttempts: 3,
            ...config,
        };
    }
    async generateBackground(imageBuffer, options) {
        const startTime = Date.now();
        const mergedOptions = { ...DEFAULT_GENERATION_OPTIONS, ...options };
        try {
            const validation = validateImage({
                buffer: imageBuffer,
                mimetype: 'image/png', // Assume PNG for now
                originalname: 'input.png',
                size: imageBuffer.length,
            });
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                };
            }
            if (!mergedOptions.prompt) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_PROMPT,
                };
            }
            const processedBuffer = await this.generateBackgroundWithBRIA(imageBuffer, mergedOptions);
            return {
                success: true,
                data: processedBuffer,
                metadata: {
                    originalSize: { width: 0, height: 0 }, // Would be filled with actual image dimensions
                    processedSize: { width: 0, height: 0 },
                    processingTime: Date.now() - startTime,
                    model: 'bria',
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : ERROR_MESSAGES.PROCESSING_FAILED,
            };
        }
    }
    async generateBackgroundWithBRIA(imageBuffer, options) {
        const apiKey = options.apiKey || this.config.briaApiKey;
        if (!apiKey) {
            throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
        }
        const base64Image = bufferToBase64(imageBuffer, 'image/png');
        const payload = {
            model: 'bria-2.3',
            prompt: options.prompt,
            negative_prompt: options.negativePrompt || 'blurry, low quality, distorted',
            num_inference_steps: options.steps || 30,
            guidance_scale: 7.5,
            seed: options.seed,
            image: base64Image,
            strength: 0.8,
        };
        const response = await axios.post(this.config.endpoint || API_ENDPOINTS.BRIA, payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: this.config.timeout || 30000,
        });
        if (response.data && response.data.image) {
            // Convert base64 response to buffer
            const base64Data = response.data.image.replace(/^data:image\/[a-z]+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        }
        throw new Error('No image data received from BRIA API');
    }
}
