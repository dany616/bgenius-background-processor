'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface AdvancedBackgroundRemoverProps {
  imageUrl: string;
  onProcessingComplete: (resultImageUrl: string) => void;
  onError: (error: string) => void;
}

const AdvancedBackgroundRemover: React.FC<AdvancedBackgroundRemoverProps> = ({
  imageUrl,
  onProcessingComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const processImage = async () => {
      try {
        if (!isMounted) return;

        setProgress(10);

        if (
          !imageRef.current ||
          !canvasRef.current ||
          !outputCanvasRef.current
        ) {
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

        // 캔버스 설정
        const canvas = canvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const outputCtx = outputCanvas.getContext('2d');

        if (!ctx || !outputCtx) {
          throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
        }

        // 캔버스 크기 설정
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;
        outputCanvas.width = imageRef.current.width;
        outputCanvas.height = imageRef.current.height;

        // 원본 이미지 그리기
        ctx.drawImage(imageRef.current, 0, 0);
        setProgress(30);

        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 배경 제거를 위한 마스크 생성
        setProgress(40);
        const mask = createBackgroundMask(
          imageData,
          canvas.width,
          canvas.height
        );
        setProgress(70);

        // 출력 이미지 준비
        outputCtx.drawImage(imageRef.current, 0, 0);
        const outputImageData = outputCtx.getImageData(
          0,
          0,
          outputCanvas.width,
          outputCanvas.height
        );
        const outputData = outputImageData.data;

        // 마스크 적용 (배경을 투명하게)
        for (let i = 0; i < outputData.length / 4; i++) {
          const idx = i * 4;
          if (mask[i] === 0) {
            // 배경으로 분류된 픽셀
            outputData[idx + 3] = 0; // 알파 채널을 0으로 설정
          }
        }

        // 이미지에 변경사항 적용
        outputCtx.putImageData(outputImageData, 0, 0);
        setProgress(90);

        // 결과 이미지 URL 생성
        const resultImageUrl = outputCanvas.toDataURL('image/png');

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

    if (imageUrl) {
      processImage();
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrl, onProcessingComplete, onError]);

  // 배경/전경 분리를 위한 함수
  const createBackgroundMask = (
    imageData: ImageData,
    width: number,
    height: number
  ): Uint8ClampedArray => {
    const data = imageData.data;
    const mask = new Uint8ClampedArray(width * height);

    // 1. 가장자리 픽셀을 배경으로 가정하고 색상 샘플 수집
    const edgePixels: { r: number; g: number; b: number }[] = [];

    // 상단과 하단 가장자리 샘플링
    for (let x = 0; x < width; x++) {
      // 상단 가장자리
      const topIdx = (0 * width + x) * 4;
      edgePixels.push({
        r: data[topIdx],
        g: data[topIdx + 1],
        b: data[topIdx + 2],
      });

      // 하단 가장자리
      const bottomIdx = ((height - 1) * width + x) * 4;
      edgePixels.push({
        r: data[bottomIdx],
        g: data[bottomIdx + 1],
        b: data[bottomIdx + 2],
      });
    }

    // 좌측과 우측 가장자리 샘플링
    for (let y = 1; y < height - 1; y++) {
      // 좌측 가장자리
      const leftIdx = (y * width + 0) * 4;
      edgePixels.push({
        r: data[leftIdx],
        g: data[leftIdx + 1],
        b: data[leftIdx + 2],
      });

      // 우측 가장자리
      const rightIdx = (y * width + (width - 1)) * 4;
      edgePixels.push({
        r: data[rightIdx],
        g: data[rightIdx + 1],
        b: data[rightIdx + 2],
      });
    }

    // 2. 색상 클러스터링을 통한 배경색 결정
    const backgroundColors = findDominantColors(edgePixels, 3); // 최대 3개의 주요 배경색 추출

    // 3. 각 픽셀이 배경인지 판단
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixelColor = {
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        };

        // 픽셀이 배경색과 유사한지 확인
        let isBackground = false;
        for (const bgColor of backgroundColors) {
          if (colorDistance(pixelColor, bgColor) < 30) {
            // 색상 거리 임계값
            isBackground = true;
            break;
          }
        }

        // 배경이면 0, 아니면 1로 마스크 설정
        mask[y * width + x] = isBackground ? 0 : 1;
      }
    }

    // 4. 마스크 정제 (노이즈 제거)
    return refineMask(mask, width, height);
  };

  // 색상 거리 계산 함수
  const colorDistance = (
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number => {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
        Math.pow(color1.g - color2.g, 2) +
        Math.pow(color1.b - color2.b, 2)
    );
  };

  // 주요 색상 찾기 (단순화된 K-means 클러스터링)
  const findDominantColors = (
    colors: { r: number; g: number; b: number }[],
    k: number
  ): { r: number; g: number; b: number }[] => {
    // 간소화된 구현: 가장 일반적인 색상 반환
    const colorMap = new Map<string, number>();

    for (const color of colors) {
      // 색상을 더 적은 수의 bin으로 양자화 (quantize)
      const quantizedR = Math.floor(color.r / 10) * 10;
      const quantizedG = Math.floor(color.g / 10) * 10;
      const quantizedB = Math.floor(color.b / 10) * 10;

      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    // 가장 일반적인 k개의 색상 찾기
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(entry => {
        const [r, g, b] = entry[0].split(',').map(Number);
        return { r, g, b };
      });

    return sortedColors;
  };

  // 마스크 정제 (노이즈 제거 및 강화)
  const refineMask = (
    mask: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray => {
    const resultMask = new Uint8ClampedArray(mask);

    // 영역 채우기 (Flood fill) 적용
    // 가장자리를 시작점으로 배경 영역 채우기를 수행합니다
    floodFill(resultMask, width, height);

    // 모폴로지 연산: 침식 후 팽창 (Opening) - 작은 노이즈 제거
    applyMorphologicalOperation(resultMask, width, height, 'erode', 2);
    applyMorphologicalOperation(resultMask, width, height, 'dilate', 2);

    return resultMask;
  };

  // 영역 채우기 (Flood fill) 함수
  const floodFill = (
    mask: Uint8ClampedArray,
    width: number,
    height: number
  ): void => {
    const visited = new Uint8ClampedArray(width * height);
    const queue: [number, number][] = [];

    // 가장자리 픽셀을 모두 큐에 추가
    for (let x = 0; x < width; x++) {
      queue.push([x, 0]);
      queue.push([x, height - 1]);
      visited[0 * width + x] = 1;
      visited[(height - 1) * width + x] = 1;
    }

    for (let y = 1; y < height - 1; y++) {
      queue.push([0, y]);
      queue.push([width - 1, y]);
      visited[y * width + 0] = 1;
      visited[y * width + (width - 1)] = 1;
    }

    // 4방향 이웃 (상, 하, 좌, 우)
    const dx = [0, 0, -1, 1];
    const dy = [-1, 1, 0, 0];

    // BFS를 사용한 Flood fill
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const idx = y * width + x;

      // 현재 픽셀을 배경으로 설정
      mask[idx] = 0;

      // 이웃 픽셀 확인
      for (let i = 0; i < 4; i++) {
        const nx = x + dx[i];
        const ny = y + dy[i];

        // 경계 검사
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const nIdx = ny * width + nx;

        // 아직 방문하지 않았고, 배경과 유사한 색상이면 큐에 추가
        if (visited[nIdx] === 0 && mask[nIdx] === 0) {
          visited[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  };

  // 모폴로지 연산 함수 (침식 또는 팽창)
  const applyMorphologicalOperation = (
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    operation: 'erode' | 'dilate',
    radius: number
  ): void => {
    const result = new Uint8ClampedArray(mask);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        if (operation === 'erode') {
          // 침식: 주변에 배경(0)이 있으면 현재 픽셀도 배경으로 설정
          let erode = false;

          for (let dy = -radius; dy <= radius && !erode; dy++) {
            for (let dx = -radius; dx <= radius && !erode; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (mask[ny * width + nx] === 0) {
                  erode = true;
                }
              }
            }
          }

          result[idx] = erode ? 0 : mask[idx];
        } else {
          // 팽창: 주변에 전경(1)이 있으면 현재 픽셀도 전경으로 설정
          let dilate = false;

          for (let dy = -radius; dy <= radius && !dilate; dy++) {
            for (let dx = -radius; dx <= radius && !dilate; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (mask[ny * width + nx] === 1) {
                  dilate = true;
                }
              }
            }
          }

          result[idx] = dilate ? 1 : mask[idx];
        }
      }
    }

    // 결과를 원본 마스크에 복사
    for (let i = 0; i < mask.length; i++) {
      mask[i] = result[i];
    }
  };

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
            고급 배경 제거 처리 중... {progress}%
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
        <canvas ref={outputCanvasRef} />
      </div>
    </div>
  );
};

export default AdvancedBackgroundRemover;
