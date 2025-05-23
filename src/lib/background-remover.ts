import * as tf from '@tensorflow/tfjs-node';
import * as bodyPix from '@tensorflow-models/body-pix';
import axios from 'axios';

import type {
  RemovalOptions,
  ProcessingResult,
  BackgroundRemovalConfig,
} from '../types';
import {
  API_ENDPOINTS,
  ERROR_MESSAGES,
  DEFAULT_REMOVAL_OPTIONS,
} from '../constants';
import { validateImage } from './utils';

export class BackgroundRemover {
  private bodyPixModel: bodyPix.BodyPix | null = null;

  constructor(_config: BackgroundRemovalConfig = {}) {
    // Configuration would be used for future features
  }

  async removeBackground(
    imageBuffer: Buffer,
    options: RemovalOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const mergedOptions = { ...DEFAULT_REMOVAL_OPTIONS, ...options };

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

      let processedBuffer: Buffer;

      if (mergedOptions.model === 'removebg') {
        if (!mergedOptions.apiKey) {
          return {
            success: false,
            error: ERROR_MESSAGES.API_KEY_MISSING,
          };
        }

        processedBuffer = await this.removeBackgroundWithRemoveBg(
          imageBuffer,
          mergedOptions.apiKey
        );
      } else {
        // Ensure model is loaded
        if (!this.bodyPixModel) {
          await this.loadBodyPixModel();
        }

        processedBuffer =
          await this.removeBackgroundWithTensorFlow(imageBuffer);
      }

      return {
        success: true,
        data: processedBuffer,
        metadata: {
          originalSize: { width: 0, height: 0 }, // Would be filled with actual image dimensions
          processedSize: { width: 0, height: 0 },
          processingTime: Date.now() - startTime,
          model: mergedOptions.model || 'tensorflow',
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.PROCESSING_FAILED,
      };
    }
  }

  private async removeBackgroundWithRemoveBg(
    imageBuffer: Buffer,
    apiKey: string
  ): Promise<Buffer> {
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer]));
    formData.append('size', 'auto');

    const response = await axios.post(API_ENDPOINTS.REMOVE_BG, formData, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  private async removeBackgroundWithTensorFlow(
    imageBuffer: Buffer
  ): Promise<Buffer> {
    try {
      if (!this.bodyPixModel) {
        throw new Error('TensorFlow model not loaded');
      }

      // Load the image tensor
      const imageTensor = tf.node.decodeImage(imageBuffer, 3) as tf.Tensor3D;

      // Perform segmentation
      const segmentation = await this.bodyPixModel.segmentPerson(
        imageTensor as any
      );

      // Create mask and apply to image
      const maskData = segmentation.data;
      const { height, width } = segmentation;

      // Convert mask to tensor
      const mask = tf.tensor(Array.from(maskData), [
        height,
        width,
        1,
      ]) as tf.Tensor3D;
      const resizedMask = tf.image.resizeBilinear(mask, [
        imageTensor.shape[0],
        imageTensor.shape[1],
      ]);

      // Apply mask to remove background
      const maskedImage = tf.mul(imageTensor, resizedMask.expandDims(-1));

      // Convert to buffer
      const processedImageData = await tf.browser.toPixels(
        maskedImage as tf.Tensor3D
      );
      const processedBuffer = Buffer.from(processedImageData);

      // Cleanup
      imageTensor.dispose();
      mask.dispose();
      resizedMask.dispose();
      maskedImage.dispose();

      return processedBuffer;
    } catch (error) {
      throw new Error(
        `TensorFlow processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async loadBodyPixModel(): Promise<void> {
    try {
      this.bodyPixModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });
    } catch (error) {
      throw new Error(`Failed to load BodyPix model: ${error}`);
    }
  }

  async dispose(): Promise<void> {
    if (this.bodyPixModel) {
      // BodyPix models don't have a dispose method
      this.bodyPixModel = null;
    }
  }
}
