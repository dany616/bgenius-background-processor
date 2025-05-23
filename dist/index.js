'use strict';

var tf = require('@tensorflow/tfjs-node');
var bodyPix = require('@tensorflow-models/body-pix');
var axios = require('axios');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function () {
                  return e[k];
                },
              }
        );
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var tf__namespace = /*#__PURE__*/ _interopNamespaceDefault(tf);
var bodyPix__namespace = /*#__PURE__*/ _interopNamespaceDefault(bodyPix);

const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
const DEFAULT_OPTIONS = {
  quality: 90,
  format: 'png',
  maxWidth: 2048,
  maxHeight: 2048,
};
const DEFAULT_REMOVAL_OPTIONS = {
  ...DEFAULT_OPTIONS,
  model: 'tensorflow',
  precision: 'medium',
};
const DEFAULT_GENERATION_OPTIONS = {
  ...DEFAULT_OPTIONS,
  negativePrompt: 'blurry, low quality, distorted',
  steps: 30,
  style: 'realistic',
};
const API_ENDPOINTS = {
  REMOVE_BG: 'https://api.remove.bg/v1.0/removebg',
  BRIA: 'https://platform.bria.ai/api/v1/image/generate',
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
const ERROR_MESSAGES = {
  INVALID_IMAGE: 'Invalid image format or corrupted file',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  API_KEY_MISSING: 'API key is required for this operation',
  NETWORK_ERROR: 'Network error occurred during processing',
  PROCESSING_FAILED: 'Image processing failed',
  INVALID_PROMPT: 'Prompt is required for background generation',
};

function validateImage(file) {
  const warnings = [];
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
    };
  }
  // Check MIME type
  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_IMAGE,
    };
  }
  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }
  // Add warnings for large files
  if (file.size > 5 * 1024 * 1024) {
    warnings.push('Large file size may result in slower processing');
  }
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
function createImageProcessor(_options = {}) {
  return {
    process: () => Promise.resolve(Buffer.alloc(0)),
  };
}
function bufferToBase64(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

class BackgroundRemover {
  constructor(_config = {}) {
    this.bodyPixModel = null;
    // Configuration would be used for future features
  }
  async removeBackground(imageBuffer, options = {}) {
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
      let processedBuffer;
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
  async removeBackgroundWithRemoveBg(imageBuffer, apiKey) {
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
  async removeBackgroundWithTensorFlow(imageBuffer) {
    try {
      if (!this.bodyPixModel) {
        throw new Error('TensorFlow model not loaded');
      }
      // Load the image tensor
      const imageTensor = tf__namespace.node.decodeImage(imageBuffer, 3);
      // Perform segmentation
      const segmentation = await this.bodyPixModel.segmentPerson(imageTensor);
      // Create mask and apply to image
      const maskData = segmentation.data;
      const { height, width } = segmentation;
      // Convert mask to tensor
      const mask = tf__namespace.tensor(Array.from(maskData), [
        height,
        width,
        1,
      ]);
      const resizedMask = tf__namespace.image.resizeBilinear(mask, [
        imageTensor.shape[0],
        imageTensor.shape[1],
      ]);
      // Apply mask to remove background
      const maskedImage = tf__namespace.mul(
        imageTensor,
        resizedMask.expandDims(-1)
      );
      // Convert to buffer
      const processedImageData =
        await tf__namespace.browser.toPixels(maskedImage);
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
  async loadBodyPixModel() {
    try {
      this.bodyPixModel = await bodyPix__namespace.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });
    } catch (error) {
      throw new Error(`Failed to load BodyPix model: ${error}`);
    }
  }
  async dispose() {
    if (this.bodyPixModel) {
      // BodyPix models don't have a dispose method
      this.bodyPixModel = null;
    }
  }
}

class BackgroundGenerator {
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
      const processedBuffer = await this.generateBackgroundWithBRIA(
        imageBuffer,
        mergedOptions
      );
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
  async generateBackgroundWithBRIA(imageBuffer, options) {
    const apiKey = options.apiKey || this.config.briaApiKey;
    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }
    const base64Image = bufferToBase64(imageBuffer, 'image/png');
    const payload = {
      model: 'bria-2.3',
      prompt: options.prompt,
      negative_prompt:
        options.negativePrompt || 'blurry, low quality, distorted',
      num_inference_steps: options.steps || 30,
      guidance_scale: 7.5,
      seed: options.seed,
      image: base64Image,
      strength: 0.8,
    };
    const response = await axios.post(
      this.config.endpoint || API_ENDPOINTS.BRIA,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout || 30000,
      }
    );
    if (response.data && response.data.image) {
      // Convert base64 response to buffer
      const base64Data = response.data.image.replace(
        /^data:image\/[a-z]+;base64,/,
        ''
      );
      return Buffer.from(base64Data, 'base64');
    }
    throw new Error('No image data received from BRIA API');
  }
}

class BackgroundProcessor {
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
      const generationResult = await this.generator.generateBackground(
        Buffer.isBuffer(removalResult.data)
          ? removalResult.data
          : Buffer.from(removalResult.data),
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
  async dispose() {
    await this.remover.dispose();
  }
}

exports.BackgroundGenerator = BackgroundGenerator;
exports.BackgroundProcessor = BackgroundProcessor;
exports.BackgroundRemover = BackgroundRemover;
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
exports.SUPPORTED_FORMATS = SUPPORTED_FORMATS;
exports.createImageProcessor = createImageProcessor;
exports.validateImage = validateImage;
//# sourceMappingURL=index.js.map
