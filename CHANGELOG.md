# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of @bgenius/background-processor
- Background removal using TensorFlow.js and Remove.bg API
- Background generation using BRIA AI
- CLI tool with interactive mode
- Complete TypeScript support with strict type checking
- Comprehensive test suite with Vitest
- GitHub Actions CI/CD pipeline
- ESLint and Prettier configuration
- Rollup build system for library distribution
- Full API documentation and usage examples

### Features
- **BackgroundRemover**: AI-powered background removal
- **BackgroundGenerator**: AI-powered background generation  
- **BackgroundProcessor**: Combined removal and generation pipeline
- **CLI Tools**: Command-line interface for batch processing
- **Type Safety**: Full TypeScript support
- **Testing**: Comprehensive test coverage
- **Documentation**: Complete API reference

### Developer Experience
- Modern development tooling (ESLint, Prettier, Husky)
- Automated testing and CI/CD
- Strict TypeScript configuration
- Code quality enforcement
- Comprehensive documentation

### Supported Formats
- Input: PNG, JPG, JPEG, WebP
- Output: PNG, JPG, WebP
- Maximum file size: 10MB

### APIs Supported
- TensorFlow.js (client-side processing)
- Remove.bg API (background removal)
- BRIA AI API (background generation) 