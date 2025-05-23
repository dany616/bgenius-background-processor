'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface EdgeDetectorProps {
  imageUrl: string;
  onProcessingComplete: (resultImageUrl: string) => void;
  onError: (error: string) => void;
}

const EdgeDetector: React.FC<EdgeDetectorProps> = ({
  imageUrl,
  onProcessingComplete,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const detectEdges = async () => {
      try {
        if (!isMounted) return;

        setProgress(10);
        
        if (!imageRef.current || !canvasRef.current) {
          throw new Error('이미지 또는 캔버스 요소를 찾을 수 없습니다.');
        }
        
        setProgress(30);
        
        // 이미지가 로드될 때까지 대기
        if (!imageRef.current.complete) {
          await new Promise((resolve) => {
            if (imageRef.current) {
              imageRef.current.onload = resolve;
            }
          });
        }
        
        setProgress(40);
        
        // 캔버스 설정
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
        }
        
        // 캔버스 크기 설정
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;
        
        // 원본 이미지 그리기
        ctx.drawImage(imageRef.current, 0, 0);
        
        setProgress(60);
        
        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 소벨 필터를 사용한 Edge Detection 구현
        const sobelData = new Uint8ClampedArray(data.length);
        const width = canvas.width;
        const height = canvas.height;
        
        // 그레이스케일 변환
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            const idx = (i * width + j) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // 그레이스케일 가중 평균
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;
            
            sobelData[idx] = gray;
            sobelData[idx + 1] = gray;
            sobelData[idx + 2] = gray;
            sobelData[idx + 3] = data[idx + 3]; // 원본 알파 유지
          }
        }
        
        setProgress(70);
        
        // 소벨 에지 감지 적용
        const edges = new Uint8ClampedArray(data.length);
        const threshold = 50; // 에지 감지 임계값
        
        for (let i = 1; i < height - 1; i++) {
          for (let j = 1; j < width - 1; j++) {
            const idx = (i * width + j) * 4;
            
            // 소벨 커널 적용
            const gx =
              -1 * sobelData[((i - 1) * width + (j - 1)) * 4] +
              -2 * sobelData[((i - 1) * width + j) * 4] +
              -1 * sobelData[((i - 1) * width + (j + 1)) * 4] +
              1 * sobelData[((i + 1) * width + (j - 1)) * 4] +
              2 * sobelData[((i + 1) * width + j) * 4] +
              1 * sobelData[((i + 1) * width + (j + 1)) * 4];
            
            const gy =
              -1 * sobelData[((i - 1) * width + (j - 1)) * 4] +
              1 * sobelData[((i - 1) * width + (j + 1)) * 4] +
              -2 * sobelData[(i * width + (j - 1)) * 4] +
              2 * sobelData[(i * width + (j + 1)) * 4] +
              -1 * sobelData[((i + 1) * width + (j - 1)) * 4] +
              1 * sobelData[((i + 1) * width + (j + 1)) * 4];
            
            // 그라디언트 크기 계산
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            
            // 임계값 적용
            const edgeValue = magnitude > threshold ? 255 : 0;
            
            edges[idx] = edgeValue;
            edges[idx + 1] = edgeValue;
            edges[idx + 2] = edgeValue;
            edges[idx + 3] = 255; // 완전히 불투명
          }
        }
        
        setProgress(90);
        
        // 최종 이미지 생성
        const edgeImageData = new ImageData(edges, width, height);
        ctx.putImageData(edgeImageData, 0, 0);
        
        // 결과 URL 생성
        const resultImageUrl = canvas.toDataURL('image/png');
        
        if (isMounted) {
          onProcessingComplete(resultImageUrl);
          setIsLoading(false);
          setProgress(100);
        }
      } catch (error) {
        console.error('에지 감지 중 오류 발생:', error);
        if (isMounted) {
          onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
          setIsLoading(false);
        }
      }
    };

    if (imageUrl) {
      detectEdges();
    }

    return () => {
      isMounted = false;
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
          <p className="text-center mt-2 text-gray-600">윤곽선 감지 중... {progress}%</p>
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
      </div>
    </div>
  );
};

export default EdgeDetector; 