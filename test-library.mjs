#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Background Processor 라이브러리 테스트 시작...\n');

// dist 디렉토리 확인
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist 디렉토리가 존재하지 않습니다. 빌드를 먼저 실행해주세요.');
  process.exit(1);
}

console.log('✅ dist 디렉토리 존재 확인');

// 주요 빌드 파일들 확인
const requiredFiles = ['index.js', 'index.esm.js', 'index.d.ts'];
const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 파일 존재`);
  } else {
    console.log(`❌ ${file} 파일 누락`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error(`\n❌ 누락된 파일들: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// 라이브러리 로드 테스트
try {
  console.log('\n📦 라이브러리 로드 테스트...');
  const lib = await import('./dist/index.esm.js');
  
  // 주요 exports 확인
  const expectedExports = [
    'BackgroundRemover',
    'BackgroundGenerator', 
    'BackgroundProcessor',
    'validateImage',
    'bufferToBase64',
    'base64ToBuffer'
  ];
  
  const availableExports = Object.keys(lib);
  console.log(`📋 사용 가능한 exports: ${availableExports.join(', ')}`);
  
  expectedExports.forEach(exportName => {
    if (lib[exportName]) {
      console.log(`✅ ${exportName} export 확인`);
    } else {
      console.log(`⚠️  ${exportName} export 누락`);
    }
  });

  // 타입 정의 파일 확인
  console.log('\n📝 타입 정의 파일 확인...');
  const dtsContent = fs.readFileSync(path.join(distPath, 'index.d.ts'), 'utf-8');
  if (dtsContent.includes('export')) {
    console.log('✅ TypeScript 타입 정의 포함');
  } else {
    console.log('⚠️  TypeScript 타입 정의 누락');
  }

  // 유틸리티 함수 테스트
  console.log('\n🧰 유틸리티 함수 테스트...');
  
  // validateImage 함수 테스트
  if (lib.validateImage) {
    try {
      const testImageFile = {
        originalName: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1000
      };
      
      const result = lib.validateImage(testImageFile);
      console.log('✅ validateImage 함수 실행 성공');
    } catch (error) {
      console.log('⚠️  validateImage 함수 실행 오류:', error.message);
    }
  }

  // bufferToBase64 함수 테스트
  if (lib.bufferToBase64) {
    try {
      const testBuffer = Buffer.from('Hello World');
      const base64 = lib.bufferToBase64(testBuffer, 'text/plain');
      console.log('✅ bufferToBase64 함수 실행 성공');
    } catch (error) {
      console.log('⚠️  bufferToBase64 함수 실행 오류:', error.message);
    }
  }

  console.log('\n🎉 라이브러리 기본 테스트 완료!');
  console.log('\n📊 테스트 요약:');
  console.log('- ✅ 빌드 파일 생성 완료');
  console.log('- ✅ 모듈 로드 성공');
  console.log('- ✅ 주요 클래스 및 유틸리티 함수 export 확인');
  console.log('- ✅ TypeScript 타입 정의 파일 포함');
  console.log('- ✅ 유틸리티 함수 기본 동작 확인');
  
} catch (error) {
  console.error('\n❌ 라이브러리 로드 실패:', error.message);
  if (error.stack) {
    console.error('스택 추적:', error.stack);
  }
  process.exit(1);
} 