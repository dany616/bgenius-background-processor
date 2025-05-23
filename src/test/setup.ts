// Test setup file for Vitest
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

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

// Mock global fetch for API tests
global.fetch = vi.fn();

// Mock FormData for browser-specific tests
global.FormData = class FormData {
  private data: Map<string, any> = new Map();
  
  append(key: string, value: any): void {
    this.data.set(key, value);
  }
  
  get(key: string): any {
    return this.data.get(key);
  }
  
  has(key: string): boolean {
    return this.data.has(key);
  }
  
  delete(key: string): void {
    this.data.delete(key);
  }
  
  entries(): IterableIterator<[string, any]> {
    return this.data.entries();
  }
};

// Mock Blob for file upload tests
global.Blob = class Blob {
  constructor(private chunks: any[], private options?: BlobPropertyBag) {}
  
  get size(): number {
    return this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  
  get type(): string {
    return this.options?.type || '';
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
  
  stream(): ReadableStream {
    throw new Error('Not implemented');
  }
  
  text(): Promise<string> {
    return Promise.resolve(this.chunks.join(''));
  }
  
  slice(): Blob {
    return new Blob([]);
  }
}; 