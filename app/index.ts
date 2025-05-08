'use client';

import { useEffect, useState } from 'react';

interface LoadedModels {
  bodyPix?: any;
  cocoSsd?: any;
  [key: string]: any;
}

let tfLoaded = false;

export default function TensorFlowInitializer() {
  const [loadedModels, setLoadedModels] = useState<LoadedModels>({});

  useEffect(() => {
    // TensorFlow.js 및 관련 모델 로드 상태 추적
    if (tfLoaded) {
      console.log('TensorFlow.js가 이미 로드되어 있습니다.');
      return;
    }
    
    const loadTensorFlowJS = async () => {
      try {
        // 필요한 TensorFlow.js 패키지를 동적으로 로드
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        
        // TensorFlow 버전 확인
        console.log(`TensorFlow.js 로드됨 - 버전: ${tf.version.tfjs}`);

        // 기본 CPU 백엔드 로드
        await import('@tensorflow/tfjs-backend-cpu');

        // WebGL 백엔드 로드 (GPU 가속)
        try {
          const webgl = await import('@tensorflow/tfjs-backend-webgl');
          await tf.setBackend('webgl');
          console.log('WebGL 백엔드로 설정됨');
          
          // WebGL 상태 확인
          const backend = tf.getBackend();
          console.log(`현재 백엔드: ${backend}`);
          
          if (backend === 'webgl') {
            const webglInfo = (tf as any).webgl.getWebGLContext().getParameter(
              (tf as any).webgl.getWebGLContext().VERSION
            );
            console.log(`WebGL 정보: ${webglInfo}`);
          }
        } catch (webglError) {
          console.warn('WebGL 백엔드 로드 실패, CPU 백엔드 사용:', webglError);
          await tf.setBackend('cpu');
        }
        
        // TensorFlow 초기화 완��� 표시
        tfLoaded = true;
        
      } catch (error) {
        console.error('TensorFlow.js 로드 중 오류:', error);
      }
    };

    loadTensorFlowJS();

    // 메모리 누수 방지를 위한 정리 함수
    return () => {
      // 필요한 정리 작업 수행
    };
  }, []);

  // 이 컴포넌트는 아무것도 렌더링하지 않음
  return null;
}
