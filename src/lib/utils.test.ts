import { describe, it, expect } from 'vitest';

import {
  validateImage,
  bufferToBase64,
  base64ToBuffer,
  generateId,
} from './utils';
import type { ImageFile } from '../types';

describe('Utils', () => {
  describe('validateImage', () => {
    it('should validate correct image file', () => {
      const validFile: ImageFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 1024,
      };

      const result = validateImage(validFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file that is too large', () => {
      const largeFile: ImageFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 15 * 1024 * 1024, // 15MB
      };

      const result = validateImage(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maximum allowed size');
    });

    it('should reject invalid MIME type', () => {
      const invalidFile: ImageFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'text/plain',
        originalname: 'test.txt',
        size: 1024,
      };

      const result = validateImage(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid image format');
    });

    it('should reject empty file', () => {
      const emptyFile: ImageFile = {
        buffer: Buffer.from(''),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 0,
      };

      const result = validateImage(emptyFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should warn about large files', () => {
      const largeFile: ImageFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 6 * 1024 * 1024, // 6MB
      };

      const result = validateImage(largeFile);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Large file size');
    });
  });

  describe('bufferToBase64', () => {
    it('should convert buffer to base64 string', () => {
      const buffer = Buffer.from('Hello, World!');
      const mimeType = 'text/plain';

      const result = bufferToBase64(buffer, mimeType);
      expect(result).toBe('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==');
    });
  });

  describe('base64ToBuffer', () => {
    it('should convert base64 string to buffer', () => {
      const base64String = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';

      const result = base64ToBuffer(base64String);
      expect(result.buffer.toString()).toBe('Hello, World!');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should throw error for invalid base64 format', () => {
      const invalidBase64 = 'invalid-base64-string';

      expect(() => base64ToBuffer(invalidBase64)).toThrow(
        'Invalid base64 string format'
      );
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs of reasonable length', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(30);
    });
  });
});
