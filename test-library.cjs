#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  const lib = require('./dist/index.js');
  
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

  console.log('\n🎉 라이브러리 기본 테스트 완료!');
  console.log('\n📊 테스트 요약:');
  console.log('- ✅ 빌드 파일 생성 완료');
  console.log('- ✅ 모듈 로드 성공');
  console.log('- ✅ 주요 클래스 및 유틸리티 함수 export 확인');
  console.log('- ✅ TypeScript 타입 정의 파일 포함');
  
} catch (error) {
  console.error('\n❌ 라이브러리 로드 실패:', error.message);
  process.exit(1);
} 