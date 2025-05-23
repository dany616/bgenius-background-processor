'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as bodyPix from '@tensorflow-models/body-pix';
import Image from 'next/image';

interface BackgroundRemoverProps {
  imageUrl: string;
  onProcessingComplete: (resultImageUrl: string) => void;
  onError: (error: string) => void;
}

const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({
  imageUrl,
  onProcessingComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTFJSModel = async () => {
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
          const gl =
            tf.getBackend() === 'webgl'
              ? (tf.backend() as any).getGPGPUContext().gl
              : null;
          if (gl) {
            // 메모리 해제를 더 적극적으로 수행하도록 설정
            gl.getExtension('WEBGL_lose_context');
          }

          // 메모리 사용량 모니터링 설정
          tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0); // 사용하지 않는 텍스처 즉시 삭제
          tf.env().set('WEBGL_FLUSH_THRESHOLD', 1); // WebGL 명령 더 자주 플러시
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

        setProgress(30);

        // BodyPix 모델 로드 - 메모리 사용량을 줄이기 위한 매개변수 조정
        const model = await bodyPix.load({
          architecture: 'MobileNetV1', // 더 가벼운 MobileNetV1 아키텍처 사용
          outputStride: 16,
          multiplier: 0.75, // 정밀도와 성능 간의 균형을 위해 0.75 사용
          quantBytes: 2, // 메모리 사용량 감소를 위해 2바이트 정밀도 사용
        });
        setProgress(50);

        if (!imageRef.current || !canvasRef.current || !maskCanvasRef.current) {
          throw new Error('이미지 또는 캔버스 요소를 찾을 수 없습니다.');
        }

        // 이미지가 로드될 때까지 대기
        if (!imageRef.current.complete) {
          await new Promise(resolve => {
            if (imageRef.current) {
              imageRef.current.onload = resolve;
            }
          });
        }

        // 이미지 크기 조정 (필요한 경우 이미지 크기를 줄여 메모리 사용량 감소)
        const maxDimension = 1000; // 최대 이미지 크기 제한
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
        const maskCanvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');

        if (!ctx || !maskCtx) {
          throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
        }

        // 조정된 크기로 캔버스 설정
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        maskCanvas.width = targetWidth;
        maskCanvas.height = targetHeight;

        // 원본 이미지를 조정된 크기로 그리기
        ctx.drawImage(imageRef.current, 0, 0, targetWidth, targetHeight);

        // 세그멘테이션 매개변수 최적화
        setProgress(60);
        const segmentation = await model.segmentPerson(canvas, {
          flipHorizontal: false,
          internalResolution: 'medium', // 메모리 사용량 감소를 위해 'medium' 해상도 사용
          segmentationThreshold: 0.7, // 약간 높은 임계값으로 노이즈 감소
          maxDetections: 1, // 여러 사람 대신 한 사람에 집중
        });
        setProgress(70);

        // 마스크 캔버스에 세그멘테이션 데이터 그리기
        const maskImageData = maskCtx.createImageData(
          maskCanvas.width,
          maskCanvas.height
        );
        const maskData = maskImageData.data;

        // 마스크 생성 (이진 마스크)
        for (let i = 0; i < segmentation.data.length; i++) {
          const j = i * 4;
          if (segmentation.data[i]) {
            // 전경(사람) 부분은 흰색으로
            maskData[j] = 255;
            maskData[j + 1] = 255;
            maskData[j + 2] = 255;
            maskData[j + 3] = 255;
          } else {
            // 배경 부분은 검은색으로
            maskData[j] = 0;
            maskData[j + 1] = 0;
            maskData[j + 2] = 0;
            maskData[j + 3] = 255;
          }
        }

        maskCtx.putImageData(maskImageData, 0, 0);

        // 메모리 해제를 위해 세그멘테이션 데이터 참조 제거
        (segmentation as any).data = null;

        // 마스크 가장자리 개선을 위한 모폴로지 연산 적용
        applyMorphologicalOperations(
          maskCtx,
          maskCanvas.width,
          maskCanvas.height
        );
        setProgress(80);

        // 개선된 마스크 적용
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const maskImprovedData = maskCtx.getImageData(
          0,
          0,
          maskCanvas.width,
          maskCanvas.height
        ).data;

        for (let i = 0; i < data.length; i += 4) {
          // 마스크 값이 임계값 미만이면 배경으로 간주
          if (maskImprovedData[i] < 128) {
            data[i + 3] = 0; // 알파 값을 0으로 설정 (투명)
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProgress(95);

        // 결과 이미지 URL 생성
        const resultImageUrl = canvas.toDataURL('image/png');

        // 메모리 정리
        const contextGL =
          tf.getBackend() === 'webgl'
            ? (tf.backend() as any).getGPGPUContext()?.gl
            : null;
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
        if (isMounted) {
          onError(
            error instanceof Error
              ? error.message
              : '알 수 없는 오류가 발생했습니다.'
          );
          setIsLoading(false);
        }
      }
    };

    // 마스크 가장자리 개선을 위한 모폴로지 연산
    const applyMorphologicalOperations = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // 마스크 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 확장 연산 (Dilation) - 가장자리 주변의 작은 구멍 메우기
      const dilatedData = new Uint8ClampedArray(data.length);
      dilate(data, dilatedData, width, height, 2); // 반경 축소로 메모리 사용 최적화

      // 침식 연산 (Erosion) - 노이즈 제거
      const erodedData = new Uint8ClampedArray(dilatedData.length);
      erode(dilatedData, erodedData, width, height, 1);

      // 결과 이미지 데이터 생성
      const resultImageData = new ImageData(erodedData, width, height);
      ctx.putImageData(resultImageData, 0, 0);

      // 가우시안 블러를 시뮬레이션하여 가장자리 부드럽게 하기 (간단한 박스 블러)
      ctx.filter = 'blur(1px)'; // 블러 효과 감소로 성능 개선
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = 'none';
    };

    // 확장 연산 (Dilation)
    const dilate = (
      srcData: Uint8ClampedArray,
      dstData: Uint8ClampedArray,
      width: number,
      height: number,
      radius: number
    ) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let maxVal = 0;

          // 커널 영역 순회
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const posX = Math.min(width - 1, Math.max(0, x + kx));
              const posY = Math.min(height - 1, Math.max(0, y + ky));

              const idx = (posY * width + posX) * 4;
              maxVal = Math.max(maxVal, srcData[idx]);
            }
          }

          const i = (y * width + x) * 4;
          dstData[i] = maxVal;
          dstData[i + 1] = maxVal;
          dstData[i + 2] = maxVal;
          dstData[i + 3] = 255;
        }
      }
    };

    // 침식 연산 (Erosion)
    const erode = (
      srcData: Uint8ClampedArray,
      dstData: Uint8ClampedArray,
      width: number,
      height: number,
      radius: number
    ) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let minVal = 255;

          // 커널 영역 순회
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const posX = Math.min(width - 1, Math.max(0, x + kx));
              const posY = Math.min(height - 1, Math.max(0, y + ky));

              const idx = (posY * width + posX) * 4;
              minVal = Math.min(minVal, srcData[idx]);
            }
          }

          const i = (y * width + x) * 4;
          dstData[i] = minVal;
          dstData[i + 1] = minVal;
          dstData[i + 2] = minVal;
          dstData[i + 3] = 255;
        }
      }
    };

    if (imageUrl) {
      loadTFJSModel();
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrl, onProcessingComplete, onError]);

  return (
    <div className='w-full'>
      {isLoading && (
        <div className='mt-4 mb-8 w-full'>
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div
              className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className='text-center mt-2 text-gray-600'>
            배경 제거 처리 중... {progress}%
          </p>
        </div>
      )}

      {/* 숨겨진 이미지와 캔버스 (처리용) */}
      <div className='hidden'>
        <img
          ref={imageRef}
          src={imageUrl}
          alt='Original'
          crossOrigin='anonymous'
          onError={() => onError('이미지를 로드하는 중 오류가 발생했습니다.')}
        />
        <canvas ref={canvasRef} />
        <canvas ref={maskCanvasRef} />
      </div>
    </div>
  );
};

export default BackgroundRemover;
