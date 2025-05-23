'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
// 추가 백엔드 명시적으로 임포트
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface SelectableObjectBackgroundRemoverProps {
  imageUrl: string;
  onProcessingComplete: (resultImageUrl: string) => void;
  onError: (error: string) => void;
}

// COCO-SSD 모델이 감지할 수 있는 객체 클래스와 한글 명칭
const OBJECT_CLASSES_KO: Record<string, string> = {
  person: '사람',
  bicycle: '자전거',
  car: '자동차',
  motorcycle: '오토바이',
  airplane: '비행기',
  bus: '버스',
  train: '기차',
  truck: '트럭',
  boat: '보트',
  'traffic light': '신호등',
  'fire hydrant': '소화전',
  'stop sign': '정지 표지판',
  'parking meter': '주차 미터기',
  bench: '벤치',
  bird: '새',
  cat: '고양이',
  dog: '개',
  horse: '말',
  sheep: '양',
  cow: '소',
  elephant: '코끼리',
  bear: '곰',
  zebra: '얼룩말',
  giraffe: '기린',
  backpack: '백팩',
  umbrella: '우산',
  handbag: '핸드백',
  tie: '넥타이',
  suitcase: '여행 가방',
  frisbee: '프리스비',
  skis: '스키',
  snowboard: '스노보드',
  'sports ball': '스포츠 공',
  kite: '연',
  'baseball bat': '야구 방망이',
  'baseball glove': '야구 글러브',
  skateboard: '스케이트보드',
  surfboard: '서핑보드',
  'tennis racket': '테니스 라켓',
  bottle: '병',
  'wine glass': '와인 잔',
  cup: '컵',
  fork: '포크',
  knife: '칼',
  spoon: '숟가락',
  bowl: '그릇',
  banana: '바나나',
  apple: '사과',
  sandwich: '샌드위치',
  orange: '오렌지',
  broccoli: '브로콜리',
  carrot: '당근',
  'hot dog': '핫도그',
  pizza: '피자',
  donut: '도넛',
  cake: '케이크',
  chair: '의자',
  couch: '소파',
  'potted plant': '화분',
  bed: '침대',
  'dining table': '식탁',
  toilet: '변기',
  tv: 'TV',
  laptop: '노트북',
  mouse: '마우스',
  remote: '리모컨',
  keyboard: '키보드',
  'cell phone': '휴대폰',
  microwave: '전자레인지',
  oven: '오븐',
  toaster: '토스터',
  sink: '싱크대',
  refrigerator: '냉장고',
  book: '책',
  clock: '시계',
  vase: '꽃병',
  scissors: '가위',
  'teddy bear': '테디 베어',
  'hair drier': '헤어 드라이어',
  toothbrush: '칫솔',
};

const SelectableObjectBackgroundRemover: React.FC<
  SelectableObjectBackgroundRemoverProps
> = ({ imageUrl, onProcessingComplete, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [detectionStage, setDetectionStage] = useState<
    'init' | 'detecting' | 'detected' | 'processing' | 'complete'
  >('init');
  const [detectedObjects, setDetectedObjects] = useState<
    cocoSsd.DetectedObject[]
  >([]);
  const [selectedObjectIds, setSelectedObjectIds] = useState<number[]>([]);
  const [debugCanvas, setDebugCanvas] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 객체 선택 처리 (토글 방식)
  const toggleObjectSelection = (index: number) => {
    setSelectedObjectIds(prev => {
      if (prev.includes(index)) {
        return prev.filter(id => id !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // 모든 객체 선택/선택 해제
  const toggleAllObjects = () => {
    if (selectedObjectIds.length === detectedObjects.length) {
      setSelectedObjectIds([]);
    } else {
      setSelectedObjectIds(detectedObjects.map((_, index) => index));
    }
  };

  // 바운딩 박스 그리기 (미리보기용)
  const drawBoundingBoxes = () => {
    if (
      !previewCanvasRef.current ||
      !imageRef.current ||
      !imageRef.current.complete
    )
      return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 이미지 그리기
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // 각 객체의 바운딩 박스 그리기
    detectedObjects.forEach((prediction, index) => {
      const [x, y, width, height] = prediction.bbox;
      const isSelected = selectedObjectIds.includes(index);

      // 바운딩 박스 스타일 설정
      ctx.strokeStyle = isSelected ? '#00FF00' : '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // 객체 클래스 라벨 표시
      ctx.fillStyle = isSelected
        ? 'rgba(0, 255, 0, 0.7)'
        : 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(x, y - 20, 120, 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      const scorePercent = Math.round(prediction.score * 100);
      const className = OBJECT_CLASSES_KO[prediction.class] || prediction.class;
      ctx.fillText(`${className} ${scorePercent}%`, x + 5, y - 5);
    });
  };

  // 배경 제거 처리 후 서버에 저장하는 기능 추가
  const processSelectedObjects = async () => {
    if (selectedObjectIds.length === 0) {
      onError('객체를 하나 이상 선택해주세요.');
      return;
    }

    setDetectionStage('processing');
    setProgress(60);

    try {
      if (!canvasRef.current || !outputCanvasRef.current || !imageRef.current) {
        throw new Error('캔버스 또는 이미지 요소를 찾을 수 없습니다.');
      }

      const canvas = canvasRef.current;
      const outputCanvas = outputCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const outputCtx = outputCanvas.getContext('2d');

      if (!ctx || !outputCtx) {
        throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      }

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 원본 이미지 그리기
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

      // 바이너리 마스크 생성
      const mask = new Uint8ClampedArray(canvas.width * canvas.height).fill(0);

      // 선택된 객체의 바운딩 박스만 마스크에 포함
      selectedObjectIds.forEach(index => {
        const prediction = detectedObjects[index];
        if (prediction) {
          const [x, y, width, height] = prediction.bbox;

          // 바운딩 박스 영역을 마스크에 표시
          for (
            let j = Math.max(0, Math.floor(y));
            j < Math.min(canvas.height, Math.floor(y + height));
            j++
          ) {
            for (
              let i = Math.max(0, Math.floor(x));
              i < Math.min(canvas.width, Math.floor(x + width));
              i++
            ) {
              mask[j * canvas.width + i] = 1; // 객체 영역은 1로 설정
            }
          }
        }
      });

      // 마스크 가장자리 개선을 위한 확장 처리
      const improvedMask = new Uint8ClampedArray(mask);
      const dilationRadius = 2;

      // 마스크 확장 (가장자리 부드럽게)
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (mask[y * canvas.width + x] === 1) {
            // 주변 픽셀 확장
            for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
              for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                  nx >= 0 &&
                  nx < canvas.width &&
                  ny >= 0 &&
                  ny < canvas.height
                ) {
                  improvedMask[ny * canvas.width + nx] = 1;
                }
              }
            }
          }
        }
      }

      setProgress(80);

      // 출력 이미지 생성
      outputCtx.drawImage(canvas, 0, 0);
      const outputImageData = outputCtx.getImageData(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height
      );
      const outputData = outputImageData.data;

      // 마스크 적용하여 배경 투명하게 처리
      for (let i = 0; i < canvas.width * canvas.height; i++) {
        const idx = i * 4;
        // 객체가 아닌 부분(배경)은 알파값을 0으로 설정
        if (improvedMask[i] === 0) {
          outputData[idx + 3] = 0; // 알파 채널을 0으로 설정
        }
      }

      outputCtx.putImageData(outputImageData, 0, 0);
      setProgress(90);

      // 결과 이미지 URL 생성
      const resultImageUrl = outputCanvas.toDataURL('image/png');

      // 선택된 객체 클래스 정보 수집
      const selectedClasses = selectedObjectIds.map(index => ({
        class: detectedObjects[index].class,
        score: detectedObjects[index].score,
        koName:
          OBJECT_CLASSES_KO[detectedObjects[index].class] ||
          detectedObjects[index].class,
      }));

      // 처리 시작 시간과 종료 시간 계산 (성능 측정용)
      const startTime = performance.now();

      try {
        // 서버 API 호출 - 이미지 저장 요청
        const response = await fetch('/api/backgroundBG/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: resultImageUrl,
            originalImageUrl: imageUrl,
            processingType: 'selectable-object-bg-removal',
            processingTime: (performance.now() - startTime) / 1000, // 처리 시간(초)
            selectedObjects: selectedClasses,
          }),
        });

        if (!response.ok) {
          // 서버 응답이 실패일 경우 오류 처리
          const errorText = await response.text();
          console.error('서버 저장 오류:', errorText);
          // 서버 저장 실패해도 클라이언트에서는 처리 결과 표시
          console.warn('서버 저장 실패했지만 로컬 처리 결과는 표시합니다.');
        } else {
          // 서버 응답이 성공일 경우 응답 데이터 처리
          const data = await response.json();
          console.log('서버 저장 성공:', data);

          // 서버에서 제공하는 URL이 있으면 사용, 없으면 로컬 URL 사용
          if (data && data.result_image_url) {
            // 서버에서 반환한 이미지 URL을 사용
            const serverImageUrl = `${window.location.origin}${data.result_image_url}`;
            console.log('서버 이미지 URL:', serverImageUrl);
            // 여기서는 서버 URL을 사용하지 않고 로컬 URL을 사용 (지연 방지)
          }
        }
      } catch (apiError) {
        // API 호출 중 네트워크 오류 등이 발생해도 로컬 처리 결과는 표시
        console.error('API 호출 오류:', apiError);
        console.warn('API 호출 실패했지만 로컬 처리 결과는 표시합니다.');
      }

      // 메모리 정리
      mask.fill(0);
      improvedMask.fill(0);

      setProgress(100);
      setDetectionStage('complete');
      onProcessingComplete(resultImageUrl);
    } catch (error) {
      console.error('배경 제거 중 오류 발생:', error);
      onError(
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.'
      );
      setDetectionStage('detected'); // 오류 발생 시 선택 단계로 돌아감
    }
  };

  // 객체 감지 초기화
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000; // 1초

    const initializeDOM = () => {
      // 모든 참조 요소가 초기화되었는지 확인
      return new Promise<void>((resolve, reject) => {
        // DOM 요소 생성 및 참조 설정
        const checkElements = () => {
          console.log('DOM 요소 확인 중...');

          const containerElement = document.getElementById(
            'hidden-elements-container'
          );
          const previewContainer = document.getElementById(
            'preview-canvas-container'
          );

          if (!containerElement || !previewContainer) {
            console.log('컨테이너 요소가 없습니다. 재시도 중...');
            retryCount++;
            if (retryCount < maxRetries) {
              setTimeout(checkElements, retryDelay);
            } else {
              reject(
                new Error(
                  'DOM 요소 컨테이너를 찾을 수 없습니다. 페이지를 새로고침해 주세요.'
                )
              );
            }
            return;
          }

          // 기존 요소들이 있는지 확인하고 없으면 생성
          if (!imageRef.current) {
            // 이미 존재하는 이미지를 찾거나 새로 생성
            const existingImg = containerElement.querySelector('img');
            if (existingImg) {
              // 기존 이미지 사용
              console.log('기존 이미지 요소 사용');
            } else {
              // 새 이미지 생성
              const img = document.createElement('img');
              img.src = imageUrl;
              img.alt = 'Original';
              img.crossOrigin = 'anonymous';
              img.style.width = 'auto';
              img.style.height = 'auto';
              img.style.maxWidth = '800px';
              img.onerror = () =>
                onError('이미지를 로드하는 중 오류가 발생했습니다.');
              containerElement.appendChild(img);
            }
          }

          // 캔버스 요소들 확인
          if (!canvasRef.current) {
            const existingCanvas = containerElement.querySelector(
              'canvas:nth-of-type(1)'
            );
            if (!existingCanvas) {
              const canvas = document.createElement('canvas');
              containerElement.appendChild(canvas);
            }
          }

          if (!outputCanvasRef.current) {
            const existingOutputCanvas = containerElement.querySelector(
              'canvas:nth-of-type(2)'
            );
            if (!existingOutputCanvas) {
              const outputCanvas = document.createElement('canvas');
              containerElement.appendChild(outputCanvas);
            }
          }

          if (!previewCanvasRef.current) {
            const existingPreviewCanvas =
              previewContainer.querySelector('canvas');
            if (!existingPreviewCanvas) {
              const previewCanvas = document.createElement('canvas');
              previewContainer.appendChild(previewCanvas);
            }
          }

          // useRef의 current에 직접 할당하지 않고 참조만 업데이트하도록 setTimeout 사용
          setTimeout(() => {
            // 각 참조 업데이트
            if (!imageRef.current) {
              const img = containerElement.querySelector('img');
              if (img) {
                // React 라이프사이클에 영향을 주지 않도록 참조만 가져옴
                // @ts-ignore - useRef에 직접 할당하지 않고 참조하도록 처리
                imageRef.current = img;
              }
            }

            if (!canvasRef.current) {
              const canvas = containerElement.querySelector(
                'canvas:nth-of-type(1)'
              );
              if (canvas) {
                // @ts-ignore
                canvasRef.current = canvas;
              }
            }

            if (!outputCanvasRef.current) {
              const outputCanvas = containerElement.querySelector(
                'canvas:nth-of-type(2)'
              );
              if (outputCanvas) {
                // @ts-ignore
                outputCanvasRef.current = outputCanvas;
              }
            }

            if (!previewCanvasRef.current) {
              const previewCanvas = previewContainer.querySelector('canvas');
              if (previewCanvas) {
                // @ts-ignore
                previewCanvasRef.current = previewCanvas;
              }
            }

            // 모든 요소가 초기화되었는지 확인
            if (
              imageRef.current &&
              canvasRef.current &&
              outputCanvasRef.current &&
              previewCanvasRef.current
            ) {
              console.log('모든 DOM 요소 초기화 완료');
              resolve();
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(
                  `DOM 요소 초기화 재시도 (${retryCount}/${maxRetries})...`
                );
                setTimeout(checkElements, retryDelay);
              } else {
                reject(
                  new Error(
                    'DOM 요소를 초기화할 수 없습니다. 페이지를 새로고침해 주세요.'
                  )
                );
              }
            }
          }, 100);
        };

        // 첫 번째 확인 시작
        checkElements();
      });
    };

    const detectObjects = async () => {
      try {
        if (!isMounted) return;

        setDetectionStage('detecting');
        setProgress(10);

        // DOM 요소가 초기화될 때까지 대기
        await initializeDOM();

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
          tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
          tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
          tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 0);
          tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
          tf.env().set('CHECK_COMPUTATION_FOR_ERRORS', false);
        } catch (webglError) {
          console.warn('WebGL 백엔드 초기화 실패:', webglError);
          console.log('CPU 백엔드로 전환합니다.');
          await tf.setBackend('cpu');
        }

        setProgress(20);

        // COCO-SSD 모델 로드
        const model = await cocoSsd.load({
          base: 'mobilenet_v2', // 더 정확한 모델 사용
        });
        setProgress(30);

        // 이미지가 로드될 때까지 대기
        if (imageRef.current && !imageRef.current.complete) {
          console.log('이미지 로딩 대기 중...');
          await new Promise<void>(resolve => {
            if (!imageRef.current) return resolve();

            const onLoad = () => {
              console.log('이미지 로드 완료');
              imageRef.current?.removeEventListener('load', onLoad);
              resolve();
            };

            const onError = () => {
              console.error('이미지 로드 실패');
              imageRef.current?.removeEventListener('error', onError);
              resolve(); // 에러가 발생해도 계속 진행
            };

            imageRef.current.addEventListener('load', onLoad);
            imageRef.current.addEventListener('error', onError);

            // 이미 로드되었을 수 있으므로 상태 확인
            if (imageRef.current.complete) {
              console.log('이미지가 이미 로드되어 있음');
              resolve();
            }
          });
        }

        if (!imageRef.current) {
          throw new Error(
            '이미지 요소를 찾을 수 없습니다. 이미지가 올바르게 로드되었는지 확인하세요.'
          );
        }

        console.log(
          '이미지 크기:',
          imageRef.current.naturalWidth,
          'x',
          imageRef.current.naturalHeight
        );

        // 이미지 크기 최적화 - naturalWidth/Height 사용
        const maxDimension = 800;
        const imgWidth =
          imageRef.current.naturalWidth || imageRef.current.width;
        const imgHeight =
          imageRef.current.naturalHeight || imageRef.current.height;

        if (imgWidth === 0 || imgHeight === 0) {
          throw new Error(
            '이미지 크기가 0입니다. 이미지가 올바르게 로드되었는지 확인하세요.'
          );
        }

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

        console.log('조정된 크기:', targetWidth, 'x', targetHeight);

        // 캔버스 크기 설정
        if (
          !canvasRef.current ||
          !outputCanvasRef.current ||
          !previewCanvasRef.current
        ) {
          throw new Error(
            '캔버스 요소를 찾을 수 없습니다. DOM이 올바르게 초기화되었는지 확인하세요.'
          );
        }

        const canvas = canvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        const previewCanvas = previewCanvasRef.current;

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        outputCanvas.width = targetWidth;
        outputCanvas.height = targetHeight;
        previewCanvas.width = targetWidth;
        previewCanvas.height = targetHeight;

        // 원본 이미지를 캔버스에 그리기
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');

        try {
          ctx.drawImage(imageRef.current, 0, 0, targetWidth, targetHeight);

          // 미리보기 캔버스에도 이미지 그리기
          const previewCtx = previewCanvas.getContext('2d');
          if (previewCtx) {
            previewCtx.drawImage(
              imageRef.current,
              0,
              0,
              targetWidth,
              targetHeight
            );
          } else {
            console.warn('미리보기 캔버스 컨텍스트를 가져올 수 없습니다.');
          }
        } catch (drawError) {
          console.error('이미지 그리기 오류:', drawError);
          throw new Error(
            `이미지를 캔버스에 그리는 중 오류가 발생했습니다: ${drawError instanceof Error ? drawError.message : String(drawError)}`
          );
        }

        setProgress(40);

        // 객체 감지 수행
        console.log('객체 감지 시작...');
        const predictions = await model.detect(canvas, 20, 0.4);
        console.log('감지된 객체:', predictions.length);
        setProgress(50);

        // 객체가 감지되지 않은 경우
        if (predictions.length === 0) {
          throw new Error(
            '이미지에서 객체를 감지할 수 없습니다. 다른 이미지를 시도해보세요.'
          );
        }

        // 스코어가 높은 순으로 정렬 (최대 10개까지만 표시)
        const sortedPredictions = [...predictions]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        console.log('정렬된 객체:', sortedPredictions.length);
        setDetectedObjects(sortedPredictions);
        setSelectedObjectIds([0]); // 기본적으로 첫 번째 객체 선택
        setDetectionStage('detected');
        setProgress(0);
        setIsLoading(false);
      } catch (error) {
        console.error('객체 감지 중 오류 발생:', error);
        onError(
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.'
        );
        setDetectionStage('init');
        setIsLoading(false);
      }
    };

    if (imageUrl) {
      console.log('이미지 URL 제공됨, 객체 감지 시작:', imageUrl);
      // 컴포넌트가 마운트된 후 약간의 지연을 두고 처리 시작 (DOM 안정화를 위해)
      const timer = setTimeout(() => {
        if (isMounted) {
          detectObjects();
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        isMounted = false;

        // 컴포넌트 언마운트 시 메모리 정리
        try {
          tf.disposeVariables();
          tf.tidy(() => {});
        } catch (e) {
          console.error('언마운트 시 메모리 정리 오류:', e);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrl, onError]);

  // 선택된 객체가 변경될 때마다 바운딩 박스 다시 그리기
  useEffect(() => {
    if (detectionStage === 'detected') {
      try {
        drawBoundingBoxes();
      } catch (error) {
        console.error('바운딩 박스 그리기 오류:', error);
      }
    }
  }, [selectedObjectIds, detectionStage]);

  return (
    <div className='w-full'>
      {detectionStage === 'detecting' && (
        <div className='mt-4 mb-8 w-full'>
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div
              className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className='text-center mt-2 text-gray-600'>
            객체 감지 중... {progress}%
          </p>
        </div>
      )}

      {detectionStage === 'processing' && (
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

      {detectionStage === 'detected' && (
        <div className='mt-4'>
          <div className='relative w-full'>
            <div
              id='preview-canvas-container'
              className='w-full rounded-lg shadow-md'
            >
              <canvas
                ref={previewCanvasRef}
                className='w-full rounded-lg shadow-md'
              />
            </div>

            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
              <div className='flex justify-between items-center mb-3'>
                <h3 className='text-lg font-medium text-gray-800'>
                  감지된 객체
                </h3>
                <button
                  onClick={toggleAllObjects}
                  className='px-4 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200'
                >
                  {selectedObjectIds.length === detectedObjects.length
                    ? '모두 해제'
                    : '모두 선택'}
                </button>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                {detectedObjects.map((obj, index) => (
                  <div
                    key={index}
                    onClick={() => toggleObjectSelection(index)}
                    className={`
                      cursor-pointer p-2 rounded-md transition-colors
                      ${
                        selectedObjectIds.includes(index)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}
                  >
                    <span className='font-medium'>
                      {OBJECT_CLASSES_KO[obj.class] || obj.class}
                    </span>
                    <span className='text-sm ml-1 opacity-80'>
                      {Math.round(obj.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className='mt-4 flex justify-end'>
                <button
                  onClick={processSelectedObjects}
                  disabled={selectedObjectIds.length === 0}
                  className={`
                    px-5 py-2 rounded-lg font-medium
                    ${
                      selectedObjectIds.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  선택 객체 배경 제거
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 숨겨진 처리용 요소들 - class 이름을 absolute로 변경하여 화면에는 보이지 않지만 DOM에 렌더링되도록 함 */}
      <div
        id='hidden-elements-container'
        className='absolute opacity-0 pointer-events-none'
        style={{ zIndex: -1 }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt='Original'
          crossOrigin='anonymous'
          onError={() => onError('이미지를 로드하는 중 오류가 발생했습니다.')}
          style={{ width: 'auto', height: 'auto', maxWidth: '800px' }}
        />
        <canvas ref={canvasRef} />
        <canvas ref={outputCanvasRef} />
      </div>
    </div>
  );
};

export default SelectableObjectBackgroundRemover;
