// Test setup file for Vitest
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup global test environment
  console.log('🧪 Setting up test environment...');
});

afterAll(() => {
  // Cleanup global test resources
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Mock global objects for testing
Object.defineProperty(globalThis, 'fetch', {
  writable: true,
  value: vi.fn(),
});

// Simple FormData mock
Object.defineProperty(globalThis, 'FormData', {
  writable: true,
  value: class FormData {
    private data = new Map<string, any>();

    append(key: string, value: any) {
      this.data.set(key, value);
    }

    get(key: string) {
      return this.data.get(key);
    }

    has(key: string) {
      return this.data.has(key);
    }

    delete(key: string) {
      return this.data.delete(key);
    }

    entries() {
      return this.data.entries();
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return this.data.values();
    }

    forEach(callback: (value: any, key: string) => void) {
      this.data.forEach(callback);
    }

    getAll(key: string) {
      return this.data.has(key) ? [this.data.get(key)] : [];
    }

    set(key: string, value: any) {
      this.data.set(key, value);
    }
  },
});

// Simple Blob mock
Object.defineProperty(globalThis, 'Blob', {
  writable: true,
  value: class Blob {
    constructor(
      public blobParts?: any[],
      public options?: any
    ) {}

    size = 0;
    type = '';

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(0));
    }

    stream(): ReadableStream {
      return new ReadableStream();
    }

    text(): Promise<string> {
      return Promise.resolve('');
    }

    slice(_start?: number, _end?: number, _contentType?: string): Blob {
      return new Blob();
    }

    bytes(): Promise<Uint8Array> {
      return Promise.resolve(new Uint8Array(0));
    }
  },
});
