'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
// 추가 백엔드 명시적으로 임포트
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Image from 'next/image';

interface ObjectBackgroundRemoverProps {
  imageUrl: string;
  onProcessingComplete: (resultImageUrl: string) => void;
  onError: (error: string) => void;
}

// COCO-SSD 모델이 감지할 수 있는 객체 클래스
const OBJECT_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 
  'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 
  'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 
  'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 
  'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 
  'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 
  'hair drier', 'toothbrush'
];

const ObjectBackgroundRemover: React.FC<ObjectBackgroundRemoverProps> = ({
  imageUrl,
  onProcessingComplete,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<cocoSsd.DetectedObject[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        if (!isMounted) return;

        setProgress(10);
        // GPU 지원 백엔드 로드 및 메모리 관리 설정
        await tf.ready();
        
        // 백엔드 설정 - WebGL이 불안정할 경우 CPU로 폴백
        try {
          await tf.setBackend('webgl');
          console.log('WebGL 백엔드 초기화 성공');
          
          // WebGL 메모리 최적화 설정
          const gl = (tf.getBackend() === 'webgl') ? 
            (tf.backend() as any).getGPGPUContext().gl : null;
          if (gl) {
            // 메모리 해제를 더 적극적으로 수행하도록 설정
            gl.getExtension('WEBGL_lose_context');
          }
          
          // 메모리 사용량 모니터링 설정
          tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0); // 사용하지 않는 텍스처 즉시 삭제
          tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);  // WebGL 명령 더 자주 플러시
          tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 0); // 작은 데이터를 위한 별도 최적화
          tf.env().set('WEBGL_FORCE_F16_TEXTURES', true); // 메모리 사용량 줄이기 위해 16비트 텍스처 사용
          tf.env().set('CHECK_COMPUTATION_FOR_ERRORS', false); // 오류 검사 비활성화로 메모리 절약
          
        } catch (webglError) {
          console.warn('WebGL 백엔드 초기화 실패:', webglError);
          console.log('CPU 백엔드로 전환합니다.');
          await tf.setBackend('cpu');
        }
        
        // 텐서 메모리 초기화
        tf.disposeVariables();
        tf.tidy(() => {});
        
        setProgress(20);
        
        // COCO-SSD 모델 로드 - 가벼운 버전
        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // 더 가벼운 모델 사용
        });
        setProgress(40);
        
        if (!imageRef.current || !canvasRef.current || !outputCanvasRef.current) {
          throw new Error('이미지 또는 캔버스 요소를 찾을 수 없습니다.');
        }

        // 이미지가 로드될 때까지 대기
        if (!imageRef.current.complete) {
          await new Promise((resolve) => {
            if (imageRef.current) {
              imageRef.current.onload = resolve;
            }
          });
        }
        
        // 이미지 크기 조정 (필요한 경우 이미지 크기를 줄여 메모리 사용량 감소)
        const maxDimension = 800; // 최대 이미지 크기 제한 (더 작게 설정)
        const imgWidth = imageRef.current.width;
        const imgHeight = imageRef.current.height;
        let targetWidth = imgWidth;
        let targetHeight = imgHeight;
        
        if (imgWidth > maxDimension || imgHeight > maxDimension) {
          if (imgWidth > imgHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.floor(imgHeight * (maxDimension / imgWidth));
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.floor(imgWidth * (maxDimension / imgHeight));
          }
        }

        // 캔버스 설정
        const canvas = canvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const outputCtx = outputCanvas.getContext('2d');
        
        if (!ctx || !outputCtx) {
          throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
        }

        // 캔버스 크기 설정
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        outputCanvas.width = targetWidth;
        outputCanvas.height = targetHeight;

        // 원본 이미지를 조정된 크기로 그리기
        ctx.drawImage(imageRef.current, 0, 0, targetWidth, targetHeight);
        setProgress(50);

        // 중간에 메모리 정리
        tf.tidy(() => {});

        // 객체 감지 수행 - 낮은 confidence 임계값으로 설정하여 더 적은 객체 감지
        const predictions = await model.detect(canvas, 10, 0.4);
        setDetectedObjects(predictions);
        setProgress(70);

        // 객체가 감지되지 않은 경우
        if (predictions.length === 0) {
          console.warn('객체가 감지되지 않았습니다.');
          onError('이미지에서 객체를 감지할 수 없습니다.');
          setIsLoading(false);
          return;
        }

        // 감지된 객체 마스크 생성 (바이너리 마스크)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const mask = new Uint8ClampedArray(canvas.width * canvas.height);

        // 각 객체별 바운딩 박스 영역을 마스크로 설정
        // 너무 많은 객체를 처리하지 않도록 최대 3개로 제한
        const limitedPredictions = predictions.slice(0, 3);
        for (const prediction of limitedPredictions) {
          const [x, y, width, height] = prediction.bbox;
          
          // 바운딩 박스 영역 내부를 마스크로 표시
          for (let j = Math.max(0, Math.floor(y)); j < Math.min(canvas.height, Math.floor(y + height)); j++) {
            for (let i = Math.max(0, Math.floor(x)); i < Math.min(canvas.width, Math.floor(x + width)); i++) {
              mask[j * canvas.width + i] = 1; // 객체 영역은 1로 설정
            }
          }
        }

        // 메모리 효율적인 마스크 처리
        // 마스크 확장 (윤곽선 부드럽게) - 더 작은 반경 사용
        const dilationRadius = 1; // 반경 축소
        const improvedMask = new Uint8ClampedArray(mask);
        
        // 단순화된 확장 알고리즘 - 모든 픽셀을 처리하지 않고 필요한 부분만 처리
        for (let y = 0; y < canvas.height; y += 2) { // 격자 처리로 연산량 감소
          for (let x = 0; x < canvas.width; x += 2) {
            if (mask[y * canvas.width + x] === 1) {
              // 주변 픽셀 확장
              for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
                for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    improvedMask[ny * canvas.width + nx] = 1;
                  }
                }
              }
            }
          }
        }

        // 메모리 정리
        mask.fill(0);
        
        setProgress(80);
        
        // 출력 이미지 생성
        outputCtx.drawImage(canvas, 0, 0); // 크기가 조정된 이미지 사용
        const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const outputData = outputImageData.data;
        
        // 메모리 효율적인 방식으로 마스크 적용
        const totalPixels = canvas.width * canvas.height;
        const batchSize = 10000; // 한 번에 처리할 픽셀 수
        
        for (let offset = 0; offset < totalPixels; offset += batchSize) {
          const end = Math.min(offset + batchSize, totalPixels);
          for (let i = offset; i < end; i++) {
            const idx = i * 4;
            // 객체가 아닌 부분(배경)은 알파값을 0으로 설정
            if (improvedMask[i] === 0) {
              outputData[idx + 3] = 0; // 알파 채널을 0으로 설정
            }
          }
        }
        
        outputCtx.putImageData(outputImageData, 0, 0);
        setProgress(90);
        
        // 결과 이미지 URL 생성
        const resultImageUrl = outputCanvas.toDataURL('image/png');
        
        // 메모리 정리
        improvedMask.fill(0);
        const contextGL = (tf.getBackend() === 'webgl') ? 
          (tf.backend() as any).getGPGPUContext()?.gl : null;
        if (contextGL) {
          // 텐서 메모리 해제
          tf.disposeVariables();
          tf.tidy(() => {}); // 정리되지 않은 텐서 정리
        }
        
        if (isMounted) {
          onProcessingComplete(resultImageUrl);
          setIsLoading(false);
          setProgress(100);
        }
      } catch (error) {
        console.error('배경 제거 중 오류 발생:', error);
        // 오류 발생 시에도 메모리 정리 시도
        try {
          tf.disposeVariables();
          tf.tidy(() => {});
        } catch (e) {
          console.error('메모리 정리 중 추가 오류:', e);
        }
        
        if (isMounted) {
          onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
          setIsLoading(false);
        }
      }
    };

    if (imageUrl) {
      loadModels();
    }

    return () => {
      isMounted = false;
      // 컴포넌트 언마운트 시 메모리 정리
      try {
        tf.disposeVariables();
        tf.tidy(() => {});
      } catch (e) {
        console.error('언마운트 시 메모리 정리 오류:', e);
      }
    };
  }, [imageUrl, onProcessingComplete, onError]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className="mt-4 mb-8 w-full">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center mt-2 text-gray-600">배경 제거 처리 중... {progress}%</p>
        </div>
      )}
      
      {/* 감지된 객체 표시 (디버깅용, 숨김 처리) */}
      {detectedObjects.length > 0 && !isLoading && (
        <div className="hidden">
          <p className="text-sm text-gray-500">
            감지된 객체: {detectedObjects.map(obj => `${obj.class} (${Math.round(obj.score * 100)}%)`).join(', ')}
          </p>
        </div>
      )}
      
      {/* 숨겨진 이미지와 캔버스 (처리용) */}
      <div className="hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Original"
          crossOrigin="anonymous"
          onError={() => onError('이미지를 로드하는 중 오류가 발생했습니다.')}
        />
        <canvas ref={canvasRef} />
        <canvas ref={outputCanvasRef} />
      </div>
    </div>
  );
};

export default ObjectBackgroundRemover; 