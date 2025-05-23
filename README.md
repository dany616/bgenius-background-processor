# @bgenius/background-processor

<p align="center">
  <img src="https://img.shields.io/npm/v/@bgenius/background-processor" alt="npm version" />
  <img src="https://img.shields.io/npm/l/@bgenius/background-processor" alt="license" />
  <img src="https://img.shields.io/github/actions/workflow/status/dany616/Bgenius_cilent/ci.yml" alt="CI Status" />
  <img src="https://img.shields.io/codecov/c/github/dany616/Bgenius_cilent" alt="Coverage" />
  <img src="https://img.shields.io/npm/dm/@bgenius/background-processor" alt="downloads" />
</p>

AI-powered background removal and generation library with CLI tools. Built with TypeScript, TensorFlow.js, and modern tooling for production-ready image processing.

## ✨ Features

- 🎯 **Background Removal**: Remove backgrounds using TensorFlow.js or Remove.bg API
- 🎨 **Background Generation**: Generate new backgrounds with BRIA AI
- ⚡ **One-Click Processing**: Remove and generate backgrounds in a single operation
- 🔧 **CLI Tools**: Command-line interface for batch processing and automation
- 📦 **Library API**: Programmatic interface for integration into applications
- 🛡️ **Type Safety**: Full TypeScript support with strict type checking
- 🧪 **Well Tested**: Comprehensive test suite with high coverage
- 📖 **Documentation**: Complete API reference and usage examples

## 🔧 Installation

### As a Library

```bash
npm install @bgenius/background-processor
```

### As a CLI Tool

```bash
npm install -g @bgenius/background-processor
```

## 🚀 Quick Start

### CLI Usage

```bash
# Remove background only
bgenius remove input.jpg -o output.png

# Generate new background
bgenius generate input-no-bg.png -o result.png -p "sunset beach scene"

# Full process (remove + generate)
bgenius process input.jpg -o final.png -p "professional office background"

# Interactive mode
bgenius interactive
```

### Library Usage

```typescript
import { BackgroundRemover, BackgroundGenerator, BackgroundProcessor } from '@bgenius/background-processor';

// Remove background
const remover = new BackgroundRemover();
const result = await remover.removeBackground(imageBuffer, {
  model: 'tensorflow', // or 'removebg'
  precision: 'high'
});

// Generate background
const generator = new BackgroundGenerator();
const generated = await generator.generateBackground(imageBuffer, {
  prompt: 'modern office space with plants',
  style: 'realistic'
});

// Full processing pipeline
const processor = new BackgroundProcessor();
const processed = await processor.processImage(imageBuffer, {
  prompt: 'sunset landscape',
  removalModel: 'tensorflow'
});
```

## 📚 API Reference

### BackgroundRemover

Remove backgrounds from images using AI models.

```typescript
interface RemovalOptions {
  model?: 'tensorflow' | 'removebg';
  apiKey?: string;
  precision?: 'low' | 'medium' | 'high';
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
}

class BackgroundRemover {
  constructor(config?: BackgroundRemovalConfig)
  async removeBackground(buffer: Buffer, options?: RemovalOptions): Promise<ProcessingResult>
  async dispose(): Promise<void>
}
```

### BackgroundGenerator

Generate new backgrounds using AI.

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
  constructor(config?: BackgroundGenerationConfig)
  async generateBackground(buffer: Buffer, options: GenerationOptions): Promise<ProcessingResult>
}
```

### Utility Functions

```typescript
// Validate image files
function validateImage(file: ImageFile): ValidationResult

// Create image processor with custom options
function createImageProcessor(options?: ProcessingOptions): ImageProcessor

// Convert between formats
function bufferToBase64(buffer: Buffer, mimeType: string): string
function base64ToBuffer(base64String: string): { buffer: Buffer; mimeType: string }
```

## 🔑 Configuration

### Environment Variables

```bash
# API Keys
REMOVE_BG_API_KEY=your_remove_bg_api_key
BRIA_API_TOKEN=your_bria_api_token

# AWS S3 (for temporary storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### API Key Setup

#### Remove.bg
1. Sign up at [Remove.bg](https://www.remove.bg/)
2. Go to API section and create a new API key
3. Set the `REMOVE_BG_API_KEY` environment variable

#### BRIA AI
1. Sign up at [BRIA Platform](https://platform.bria.ai/)
2. Navigate to API keys section
3. Generate a new API token
4. Set the `BRIA_API_TOKEN` environment variable

## 🛠️ Development

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Setup

```bash
git clone https://github.com/dany616/Bgenius_cilent.git
cd Bgenius_cilent/Ai_Image_Optimizer_Client
npm install
```

### Available Scripts

```bash
# Development
npm run dev              # Watch mode development
npm run build            # Build library
npm run start            # Run CLI tool

# Quality Assurance
npm run lint             # Lint and fix code
npm run lint:check       # Check linting
npm run prettier         # Format code
npm run prettier:check   # Check formatting
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode testing
npm run test:coverage    # Run tests with coverage

# Validation
npm run validate         # Run all checks (lint, format, type, test)
```

### Project Structure

```
src/
├── lib/                 # Core library modules
│   ├── background-remover.ts
│   ├── background-generator.ts
│   ├── background-processor.ts
│   └── utils.ts
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── cli.ts             # CLI tool entry point
├── index.ts           # Library entry point
└── test/              # Test utilities and setup
    ├── setup.ts
    └── *.test.ts
```

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for testing with comprehensive coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Individual function and class testing
- **Integration Tests**: API and workflow testing
- **CLI Tests**: Command-line interface testing
- **Type Tests**: TypeScript type safety validation

## 📊 Performance

### Benchmarks

| Operation | Model | Average Time | Memory Usage |
|-----------|-------|-------------|--------------|
| Background Removal | TensorFlow.js | ~2.3s | ~150MB |
| Background Removal | Remove.bg API | ~1.1s | ~50MB |
| Background Generation | BRIA API | ~8.5s | ~80MB |
| Full Process | Combined | ~11s | ~200MB |

*Benchmarks performed on images ~2MB, 1920x1080 resolution*

## 🔒 Security

- API keys are never logged or stored in temporary files
- All image processing happens in memory when possible
- Temporary files are automatically cleaned up
- Input validation prevents malicious file uploads
- Regular security audits with `npm audit`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Write tests for all new features
- Update documentation for API changes
- Run `npm run validate` before submitting PRs
- Follow conventional commit messages

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) for client-side AI processing
- [Remove.bg](https://www.remove.bg/) for background removal API
- [BRIA AI](https://platform.bria.ai/) for background generation
- The open-source community for inspiration and tools

## 📞 Support

- 📖 [Documentation](https://github.com/dany616/Bgenius_cilent#readme)
- 🐛 [Issues](https://github.com/dany616/Bgenius_cilent/issues)
- 💬 [Discussions](https://github.com/dany616/Bgenius_cilent/discussions)

---

**Built with ❤️ using TypeScript, TensorFlow.js, and modern development practices.**
