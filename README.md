# @bgenius/background-processor

<p align="center">
  <img src="https://img.shields.io/github/license/dany616/bgenius-background-processor" alt="license" />
  <img src="https://img.shields.io/github/last-commit/dany616/bgenius-background-processor" alt="Last Commit" />
</p>

AI-powered background removal and generation library

AI 기반 배경 제거 및 생성 라이브러리

## ✨ Features

## ✨ 주요 기능

- 🎯 **Background Removal**: Remove backgrounds using TensorFlow.js or Remove.bg API
- 🎯 **배경 제거**: TensorFlow.js 또는 Remove.bg API를 사용한 배경 제거
- 🎨 **Background Generation**: Generate new backgrounds with BRIA AI
- 🎨 **배경 생성**: BRIA AI를 사용한 새로운 배경 생성
- ⚡ **One-Click Processing**: Remove and generate backgrounds in a single operation
- ⚡ **원클릭 처리**: 단일 작업으로 배경 제거 및 생성
- 🔧 **CLI Tools**: Command-line interface for batch processing and automation
- 🔧 **CLI 도구**: 일괄 처리 및 자동화를 위한 명령줄 인터페이스
- 📦 **Library API**: Programmatic interface for integration into applications
- 📦 **라이브러리 API**: 애플리케이션 통합을 위한 프로그래밍 인터페이스
- 🛡️ **Type Safety**: Full TypeScript support with strict type checking
- 🛡️ **타입 안전성**: 엄격한 타입 검사를 통한 완전한 TypeScript 지원
- 🧪 **Well Tested**: Comprehensive test suite with high coverage
- 🧪 **철저한 테스트**: 높은 커버리지를 가진 포괄적인 테스트 스위트
- 📖 **Documentation**: Complete API reference and usage examples
- 📖 **문서화**: 완전한 API 참조 및 사용 예제

## 🔧 Installation

## 🔧 설치

### As a Library

### 라이브러리로 설치

```bash
npm install @bgenius/background-processor
```

### As a CLI Tool

### CLI 도구로 설치

```bash
npm install -g @bgenius/background-processor
```

## 🚀 Quick Start

## 🚀 빠른 시작

### CLI Usage

### CLI 사용법

```bash
# Remove background only
# 배경 제거만 수행
bgenius remove input.jpg -o output.png

# Generate new background
# 새로운 배경 생성
bgenius generate input-no-bg.png -o result.png -p "sunset beach scene"

# Full process (remove + generate)
# 전체 처리 (제거 + 생성)
bgenius process input.jpg -o final.png -p "professional office background"

# Interactive mode
# 대화형 모드
bgenius interactive
```

### Library Usage

### 라이브러리 사용법

```typescript
import {
  BackgroundRemover,
  BackgroundGenerator,
  BackgroundProcessor,
} from '@bgenius/background-processor';

// Remove background
// 배경 제거
const remover = new BackgroundRemover();
const result = await remover.removeBackground(imageBuffer, {
  model: 'tensorflow', // or 'removebg'
  precision: 'high',
});

// Generate background
// 배경 생성
const generator = new BackgroundGenerator();
const generated = await generator.generateBackground(imageBuffer, {
  prompt: 'modern office space with plants',
  style: 'realistic',
});

// Full processing pipeline
// 전체 처리 파이프라인
const processor = new BackgroundProcessor();
const processed = await processor.processImage(imageBuffer, {
  prompt: 'sunset landscape',
  removalModel: 'tensorflow',
});
```

## 📚 API Reference

## 📚 API 참조

### BackgroundRemover

### 배경 제거 클래스

Remove backgrounds from images using AI models.

AI 모델을 사용하여 이미지에서 배경을 제거합니다.

```typescript
interface RemovalOptions {
  model?: 'tensorflow' | 'removebg';
  apiKey?: string;
  precision?: 'low' | 'medium' | 'high';
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
}

class BackgroundRemover {
  constructor(config?: BackgroundRemovalConfig);
  async removeBackground(
    buffer: Buffer,
    options?: RemovalOptions
  ): Promise<ProcessingResult>;
  async dispose(): Promise<void>;
}
```

### BackgroundGenerator

### 배경 생성 클래스

Generate new backgrounds using AI.

AI를 사용하여 새로운 배경을 생성합니다.

```typescript
interface GenerationOptions {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  steps?: number;
  seed?: number;
  apiKey?: string;
}

class BackgroundGenerator {
  constructor(config?: BackgroundGenerationConfig);
  async generateBackground(
    buffer: Buffer,
    options: GenerationOptions
  ): Promise<ProcessingResult>;
}
```

### Utility Functions

### 유틸리티 함수

```typescript
// Validate image files
// 이미지 파일 검증
function validateImage(file: ImageFile): ValidationResult;

// Create image processor with custom options
// 사용자 정의 옵션으로 이미지 프로세서 생성
function createImageProcessor(options?: ProcessingOptions): ImageProcessor;

// Convert between formats
// 형식 간 변환
function bufferToBase64(buffer: Buffer, mimeType: string): string;
function base64ToBuffer(base64String: string): {
  buffer: Buffer;
  mimeType: string;
};
```

## 🔑 Configuration

## 🔑 설정

### Environment Variables

### 환경 변수

```bash
# API Keys
# API 키
REMOVE_BG_API_KEY=your_remove_bg_api_key
BRIA_API_TOKEN=your_bria_api_token

# AWS S3 (for temporary storage)
# AWS S3 (임시 저장용)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### API Key Setup

### API 키 설정

#### Remove.bg

1. Sign up at [Remove.bg](https://www.remove.bg/)
1. [Remove.bg](https://www.remove.bg/)에 가입하세요
1. Go to API section and create a new API key
1. API 섹션으로 이동하여 새 API 키를 생성하세요
1. Set the `REMOVE_BG_API_KEY` environment variable
1. `REMOVE_BG_API_KEY` 환경 변수를 설정하세요

#### BRIA AI

1. Sign up at [BRIA Platform](https://platform.bria.ai/)
1. [BRIA Platform](https://platform.bria.ai/)에 가입하세요
1. Navigate to API keys section
1. API 키 섹션으로 이동하세요
1. Generate a new API token
1. 새 API 토큰을 생성하세요
1. Set the `BRIA_API_TOKEN` environment variable
1. `BRIA_API_TOKEN` 환경 변수를 설정하세요

## 🛠️ Development

## 🛠️ 개발

### Prerequisites

### 필수 조건

- Node.js 16.x or higher
- Node.js 16.x 이상
- npm or yarn package manager
- npm 또는 yarn 패키지 매니저

### Setup

### 설정

```bash
git clone https://github.com/dany616/bgenius-background-processor.git
cd bgenius-background-processor/Ai_Image_Optimizer_Client
npm install
```

### Available Scripts

### 사용 가능한 스크립트

```bash
# Development
# 개발
npm run dev              # Watch mode development
npm run dev              # 감시 모드 개발
npm run build            # Build library
npm run build            # 라이브러리 빌드
npm run start            # Run CLI tool
npm run start            # CLI 도구 실행

# Quality Assurance
# 품질 보증
npm run lint             # Lint and fix code
npm run lint             # 코드 린트 및 수정
npm run lint:check       # Check linting
npm run lint:check       # 린팅 검사
npm run prettier         # Format code
npm run prettier         # 코드 포맷팅
npm run prettier:check   # Check formatting
npm run prettier:check   # 포맷팅 검사
npm run type-check       # TypeScript type checking
npm run type-check       # TypeScript 타입 검사

# Testing
# 테스팅
npm run test             # Run tests
npm run test             # 테스트 실행
npm run test:watch       # Watch mode testing
npm run test:watch       # 감시 모드 테스팅
npm run test:coverage    # Run tests with coverage
npm run test:coverage    # 커버리지로 테스트 실행

# Validation
# 검증
npm run validate         # Run all checks (lint, format, type, test)
npm run validate         # 모든 검사 실행 (린트, 포맷, 타입, 테스트)
```
