# @bgenius/background-processor

<p align="center">
  <img src="https://img.shields.io/github/license/dany616/Bgenius_cilent" alt="license" />
  <img src="https://img.shields.io/github/actions/workflow/status/dany616/Bgenius_cilent/ci.yml" alt="CI Status" />
  <img src="https://img.shields.io/github/last-commit/dany616/Bgenius_cilent" alt="Last Commit" />
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
2. Go to API section and create a new API key
2. API 섹션으로 이동하여 새 API 키를 생성하세요
3. Set the `REMOVE_BG_API_KEY` environment variable
3. `REMOVE_BG_API_KEY` 환경 변수를 설정하세요

#### BRIA AI

1. Sign up at [BRIA Platform](https://platform.bria.ai/)
1. [BRIA Platform](https://platform.bria.ai/)에 가입하세요
2. Navigate to API keys section
2. API 키 섹션으로 이동하세요
3. Generate a new API token
3. 새 API 토큰을 생성하세요
4. Set the `BRIA_API_TOKEN` environment variable
4. `BRIA_API_TOKEN` 환경 변수를 설정하세요

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

### Project Structure
### 프로젝트 구조

```
src/
├── lib/                 # Core library modules
├── lib/                 # 핵심 라이브러리 모듈
│   ├── background-remover.ts
│   ├── background-generator.ts
│   ├── background-processor.ts
│   └── utils.ts
├── types.ts            # TypeScript type definitions
├── types.ts            # TypeScript 타입 정의
├── constants.ts        # Application constants
├── constants.ts        # 애플리케이션 상수
├── cli.ts             # CLI tool entry point
├── cli.ts             # CLI 도구 진입점
├── index.ts           # Library entry point
├── index.ts           # 라이브러리 진입점
└── test/              # Test utilities and setup
└── test/              # 테스트 유틸리티 및 설정
    ├── setup.ts
    └── *.test.ts
```

## 🧪 Testing
## 🧪 테스팅

This project uses [Vitest](https://vitest.dev/) for testing with comprehensive coverage:

이 프로젝트는 포괄적인 커버리지를 위해 [Vitest](https://vitest.dev/)를 사용합니다:

```bash
# Run all tests
# 모든 테스트 실행
npm test

# Run tests in watch mode
# 감시 모드로 테스트 실행
npm run test:watch

# Generate coverage report
# 커버리지 보고서 생성
npm run test:coverage
```

### Test Categories
### 테스트 범주

- **Unit Tests**: Individual function and class testing
- **단위 테스트**: 개별 함수 및 클래스 테스팅
- **Integration Tests**: API and workflow testing
- **통합 테스트**: API 및 워크플로우 테스팅
- **CLI Tests**: Command-line interface testing
- **CLI 테스트**: 명령줄 인터페이스 테스팅
- **Type Tests**: TypeScript type safety validation
- **타입 테스트**: TypeScript 타입 안전성 검증

## 📊 Performance
## 📊 성능

### Benchmarks
### 벤치마크

| Operation             | Model         | Average Time | Memory Usage |
| 작업                  | 모델          | 평균 시간    | 메모리 사용량 |
| --------------------- | ------------- | ------------ | ------------ |
| Background Removal    | TensorFlow.js | ~2.3s        | ~150MB       |
| 배경 제거             | TensorFlow.js | ~2.3초       | ~150MB       |
| Background Removal    | Remove.bg API | ~1.1s        | ~50MB        |
| 배경 제거             | Remove.bg API | ~1.1초       | ~50MB        |
| Background Generation | BRIA API      | ~8.5s        | ~80MB        |
| 배경 생성             | BRIA API      | ~8.5초       | ~80MB        |
| Full Process          | Combined      | ~11s         | ~200MB       |
| 전체 처리             | 결합          | ~11초        | ~200MB       |

_Benchmarks performed on images ~2MB, 1920x1080 resolution_

_이미지 ~2MB, 1920x1080 해상도에서 수행된 벤치마크_

## 🔒 Security
## 🔒 보안

- API keys are never logged or stored in temporary files
- API 키는 절대 로그에 기록되거나 임시 파일에 저장되지 않습니다
- All image processing happens in memory when possible
- 가능한 모든 이미지 처리는 메모리에서 수행됩니다
- Temporary files are automatically cleaned up
- 임시 파일은 자동으로 정리됩니다
- Input validation prevents malicious file uploads
- 입력 검증으로 악성 파일 업로드를 방지합니다
- Regular security audits with `npm audit`
- `npm audit`를 통한 정기적인 보안 감사

## 🤝 Contributing
## 🤝 기여하기

1. Fork the repository
1. 저장소를 포크하세요
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Open a Pull Request
5. Pull Request를 열어주세요

### Development Guidelines
### 개발 가이드라인

- Follow TypeScript strict mode requirements
- TypeScript strict 모드 요구사항을 따르세요
- Write tests for all new features
- 모든 새로운 기능에 대해 테스트를 작성하세요
- Update documentation for API changes
- API 변경 시 문서를 업데이트하세요
- Run `npm run validate` before submitting PRs
- PR 제출 전에 `npm run validate`를 실행하세요
- Follow conventional commit messages
- 관례적인 커밋 메시지를 따르세요

## 📝 Changelog
## 📝 변경로그

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

변경사항 목록과 버전 기록은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.

## 📄 License
## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

이 프로젝트는 MIT 라이선스 하에 있습니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 Acknowledgments
## 🙏 감사의 말

- [TensorFlow.js](https://www.tensorflow.org/js) for client-side AI processing
- 클라이언트 측 AI 처리를 위한 [TensorFlow.js](https://www.tensorflow.org/js)
- [Remove.bg](https://www.remove.bg/) for background removal API
- 배경 제거 API를 위한 [Remove.bg](https://www.remove.bg/)
- [BRIA AI](https://platform.bria.ai/) for background generation
- 배경 생성을 위한 [BRIA AI](https://platform.bria.ai/)
- The open-source community for inspiration and tools
- 영감과 도구를 제공해준 오픈소스 커뮤니티

## 📞 Support
## 📞 지원

- 📖 [Documentation](https://github.com/dany616/bgenius-background-processor#readme)
- 📖 [문서](https://github.com/dany616/bgenius-background-processor#readme)
- 🐛 [Issues](https://github.com/dany616/bgenius-background-processor/issues)
- 🐛 [이슈](https://github.com/dany616/bgenius-background-processor/issues)
- 💬 [Discussions](https://github.com/dany616/bgenius-background-processor/discussions)
- 💬 [토론](https://github.com/dany616/bgenius-background-processor/discussions)

---

**Built with ❤️ using TypeScript, TensorFlow.js, and modern development practices.**

**TypeScript, TensorFlow.js 및 최신 개발 방법론을 사용하여 ❤️로 제작되었습니다.**
