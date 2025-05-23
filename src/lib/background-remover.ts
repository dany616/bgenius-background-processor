import * as tf from '@tensorflow/tfjs-node';
import * as bodyPix from '@tensorflow-models/body-pix';
import axios from 'axios';

import type { RemovalOptions, ProcessingResult, BackgroundRemovalConfig } from '../types';
import { API_ENDPOINTS, ERROR_MESSAGES, DEFAULT_REMOVAL_OPTIONS } from '../constants';
import { validateImage, bufferToBase64 } from './utils';

export class BackgroundRemover {
  private config: BackgroundRemovalConfig;
  private bodyPixModel: bodyPix.BodyPix | null = null;

  constructor(config: BackgroundRemovalConfig = {}) {
    this.config = {
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      ...config,
    };
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
        processedBuffer = await this.removeBackgroundWithRemoveBg(
          imageBuffer,
          mergedOptions
        );
      } else {
        processedBuffer = await this.removeBackgroundWithTensorFlow(
          imageBuffer,
          mergedOptions
        );
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
        error: error instanceof Error ? error.message : ERROR_MESSAGES.PROCESSING_FAILED,
      };
    }
  }

  private async removeBackgroundWithRemoveBg(
    imageBuffer: Buffer,
    options: RemovalOptions
  ): Promise<Buffer> {
    const apiKey = options.apiKey || this.config.apiKey;
    
    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }

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
    imageBuffer: Buffer,
    options: RemovalOptions
  ): Promise<Buffer> {
    if (!this.bodyPixModel) {
      await this.loadBodyPixModel();
    }

    if (!this.bodyPixModel) {
      throw new Error('Failed to load TensorFlow model');
    }

    // Convert buffer to tensor
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    
    // Get person segmentation
    const segmentation = await this.bodyPixModel.segmentPerson(imageTensor);
    
    // Create mask
    const mask = tf.cast(segmentation.allPoses.length > 0 ? 
      tf.expandDims(segmentation.data, -1) : 
      tf.zeros([imageTensor.shape[0], imageTensor.shape[1], 1]), 'float32');
    
    // Apply mask to image
    const maskedImage = tf.mul(imageTensor, mask);
    
    // Convert back to buffer
    const processedBuffer = await tf.node.encodeJpeg(maskedImage as tf.Tensor3D);
    
    // Cleanup tensors
    imageTensor.dispose();
    mask.dispose();
    maskedImage.dispose();
    
    return processedBuffer;
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