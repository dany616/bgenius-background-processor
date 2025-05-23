'use client';

import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import {
  FiUpload,
  FiLink,
  FiImage,
  FiCpu,
  FiCloud,
  FiLayers,
  FiBox,
  FiScissors,
  FiMousePointer,
  FiStar,
  FiZap,
  FiPlusCircle,
  FiServer,
  FiMoon,
  FiSun,
  FiKey,
  FiArrowLeft,
} from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../layout';

// 동적으로 ApiKeyManager 컴포넌트 가져오기
const ApiKeyManager = dynamic(
  () => import('../components/ApiKeyManager').then(mod => mod.default),
  {
    loading: () => <p>API 키 관리 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 BackgroundRemover 컴포넌트 가져오기
const BackgroundRemover = dynamic(
  () => import('../components/BackgroundRemover').then(mod => mod.default),
  {
    loading: () => <p>배경 제거 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 EdgeDetector 컴포넌트 가져오기
const EdgeDetector = dynamic(
  () => import('../components/EdgeDetector').then(mod => mod.default),
  {
    loading: () => <p>엣지 감지 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 ObjectBackgroundRemover 컴포넌트 가져오기
const ObjectBackgroundRemover = dynamic(
  () =>
    import('../components/ObjectBackgroundRemover').then(mod => mod.default),
  {
    loading: () => <p>객체-배경 제거 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 AdvancedBackgroundRemover 컴포넌트 가져오기
const AdvancedBackgroundRemover = dynamic(
  () =>
    import('../components/AdvancedBackgroundRemover').then(mod => mod.default),
  {
    loading: () => <p>고급 배경 제거 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 SelectableObjectBackgroundRemover 컴포넌트 가져오기
const SelectableObjectBackgroundRemover = dynamic(
  () =>
    import('../components/SelectableObjectBackgroundRemover').then(
      mod => mod.default
    ),
  {
    loading: () => <p>선택 가능한 객체-배경 제거 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 BriaBackgroundGenerator 컴포넌트 가져오기
const BriaBackgroundGenerator = dynamic(
  () =>
    import('../components/BriaBackgroundGenerator').then(mod => mod.default),
  {
    loading: () => <p>BRIA 배경 생성 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 동적으로 RemoveAndGenerateForm 컴포넌트 가져오기
const RemoveAndGenerateForm = dynamic(
  () => import('../components/RemoveAndGenerateForm').then(mod => mod.default),
  {
    loading: () => <p>배경 제거 및 생성 구성 요소를 불러오는 중...</p>,
    ssr: false,
  }
);

// 처리 방식
export type ProcessingMode =
  | 'advanced-bg-removal'
  | 'bg-removal'
  | 'object-bg-removal'
  | 'selectable-object-bg-removal'
  | 'edge-detection'
  | 'api-bg-removal'
  | 'bria-bg-generation'
  | 'bg-removal-and-generation';

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [processingMode, setProcessingMode] = useState<ProcessingMode | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState<boolean | null>(
    null
  );
  const [intermediateImage, setIntermediateImage] = useState<string | null>(
    null
  );
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // 서버 상태 확인
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log('서버 상태 확인 중...');
        // 먼저 health 엔드포인트로 확인
        let response = await fetch('/api/health', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          setIsServerAvailable(true);
          console.log('서버 상태 확인 결과: 접속 가능 (health 엔드포인트)');
          return;
        }

        // health 엔드포인트가 없는 경우 루트로 확인
        response = await fetch('/api', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        setIsServerAvailable(response.ok);
        console.log(
          '서버 상태 확인 결과:',
          response.ok ? '접속 가능 (루트 엔드포인트)' : '접속 불가'
        );
      } catch (error) {
        console.error('서버 상태 확인 중 오류:', error);
        setIsServerAvailable(false);
      }
    };

    checkServerStatus();

    // 30초마다 서버 상태 확인
    const intervalId = setInterval(checkServerStatus, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    const url = urlInputRef.current?.value;
    if (!url) {
      setError('URL을 입력해주세요.');
      return;
    }

    try {
      setError(null);
      setPreview(url);
    } catch (error) {
      console.error('URL 이미지 처리 중 오류 발생:', error);
      setError('URL 이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setError(null);
      handleImageUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: false,
  });

  const handleProcessImage = (mode: ProcessingMode) => {
    if (mode === 'api-bg-removal') {
      setShowTokenWarning(true);
    } else if (mode === 'bg-removal-and-generation') {
      setProcessingMode(mode);
      setIsProcessing(true);
      setProcessedImage(null);
    } else {
      setProcessingMode(mode);
      setIsProcessing(true);
      setProcessedImage(null);
    }
  };

  const confirmTokenUsage = () => {
    // 서버 접속 가능 여부 확인
    if (isServerAvailable === false) {
      setShowTokenWarning(false);
      setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      return;
    }

    // API 키 관련 경고
    if (preview && selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      // 5MB 이상 파일의 경우 경고 추가
      console.warn(
        '큰 파일 크기로 인해 API 처리가 오래 걸릴 수 있습니다:',
        selectedFile.size / (1024 * 1024),
        'MB'
      );
    }

    setShowTokenWarning(false);
    setProcessingMode('api-bg-removal');
    setIsProcessing(true);
    setProcessedImage(null);
  };

  const cancelTokenUsage = () => {
    setShowTokenWarning(false);
  };

  const handleProcessingComplete = (resultImageUrl: string) => {
    setProcessedImage(resultImageUrl);
    setIsProcessing(false);
  };

  const handleProcessingError = (errorMessage: string | Error) => {
    const errorText =
      errorMessage instanceof Error ? errorMessage.message : errorMessage;
    setError(errorText);
    setIsProcessing(false);
  };

  // 배경 제거 후 배경 생성 처리 함수
  const handleBgRemovalAndGeneration = async () => {
    if (!selectedFile) return;

    // 먼저 배경 제거 시작
    setProcessingMode('api-bg-removal');
    setIsProcessing(true);
    setProcessedImage(null);
    setIntermediateImage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // API 엔드포인트 호출
      const apiUrl = '/api/background/remove';
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `배경 제거 실패: ${response.status}, 상세: ${errorText}`
        );
      }

      const data = await response.json();

      if (data && data.result_image_url) {
        // 배경 제거 결과 이미지 URL을 중간 이미지로 저장
        const imageUrl = `${window.location.origin}${data.result_image_url}`;
        setIntermediateImage(imageUrl);

        // 바로 배경 생성 모드로 전환
        setProcessingMode('bria-bg-generation');
      } else {
        throw new Error('서버에서 처리된 이미지 URL을 반환하지 않았습니다.');
      }
    } catch (error) {
      console.error('배경 제거 및 생성 중 오류 발생:', error);
      const errorMsg =
        error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.';
      setError(errorMsg);
      setIsProcessing(false);
    }
  };

  // API를 사용한 배경 제거 처리
  useEffect(() => {
    const processWithApi = async () => {
      if (
        processingMode !== 'api-bg-removal' ||
        !selectedFile ||
        !isProcessing
      ) {
        return;
      }

      try {
        setError(null);
        console.log(
          'API 호출 시작: 파일 크기',
          selectedFile.size,
          '파일 타입:',
          selectedFile.type
        );

        const formData = new FormData();
        formData.append('file', selectedFile);

        // API 엔드포인트 URL 수정 (백엔드 controller/background_removal.py의 라우터와 일치)
        // router는 prefix="/api/background"로 설정되어 있음
        const apiUrl = '/api/background/remove';
        console.log('API 호출 URL:', apiUrl);

        // 외부 라이브러리 없이 fetch API 사용
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        });

        console.log('API 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API 오류 응답:', errorText);

          if (response.status === 404) {
            throw new Error(
              `서버 연결 오류: API 엔드포인트를 찾을 수 없습니다. 서버가 실행 중인지 확인해주세요.`
            );
          } else if (response.status === 500) {
            if (errorText.includes('API 키가 설정되지 않았습니다')) {
              throw new Error(
                `서버 오류: Remove.bg API 키가 설정되지 않았습니다. 백엔드 서버의 .env 파일을 확인해주세요.`
              );
            } else {
              throw new Error(
                `서버 내부 오류: 백엔드 서버에 문제가 발생했습니다. 상세: ${errorText}`
              );
            }
          } else {
            throw new Error(
              `서버 오류: ${response.status}, 상세: ${errorText}`
            );
          }
        }

        const data = await response.json();
        console.log('API 응답 데이터:', data);

        if (data && data.result_image_url) {
          // 서버에서 반환한 이미지 URL을 사용
          const imageUrl = `${window.location.origin}${data.result_image_url}`;
          console.log('결과 이미지 URL:', imageUrl);
          setProcessedImage(imageUrl);
        } else {
          throw new Error(
            '서버에서 처리된 이미지 URL을 반환하지 않았습니다. 응답: ' +
              JSON.stringify(data)
          );
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        setError(
          '배경 제거 API 호출 중 오류가 발생했습니다. ' +
            (error instanceof Error ? error.message : String(error))
        );
      } finally {
        setIsProcessing(false);
      }
    };

    if (processingMode === 'api-bg-removal' && selectedFile && isProcessing) {
      processWithApi();
    }
  }, [processingMode, selectedFile, isProcessing]);

  const resetProcess = () => {
    setProcessedImage(null);
    setProcessingMode(null);
  };

  // 모듈 이름을 한글로 표시
  const getProcessingModeName = (mode: ProcessingMode): string => {
    switch (mode) {
      case 'bg-removal':
        return '인물 배경 제거 (BodyPix)';
      case 'object-bg-removal':
        return '사물 배경 제거 (COCO-SSD)';
      case 'selectable-object-bg-removal':
        return '사물 선택 배경 제거 (COCO-SSD)';
      case 'advanced-bg-removal':
        return '고급 배경 제거 (색상 분석)';
      case 'edge-detection':
        return '윤곽선 감지';
      case 'api-bg-removal':
        return '서버 API 배경 제거';
      case 'bria-bg-generation':
        return 'BRIA 배경 생성';
      case 'bg-removal-and-generation':
        return '배경 제거 후 배경 생성';
      default:
        return '';
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className='max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div
          className={`text-center mb-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          <h1 className='text-3xl font-bold'>이미지 업로드</h1>
          <p
            className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
          >
            배경을 제거하고 변경할 이미지를 업로드하세요
          </p>
        </div>

        {/* API 키 관리 버튼 및 모드 선택 탭 */}
        <div className='mb-6 flex justify-between items-center'>
          <div>
            {showApiKeyManager && (
              <button
                onClick={() => setShowApiKeyManager(false)}
                className={`flex items-center transition-colors ${
                  theme === 'dark'
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-500 hover:text-blue-700'
                }`}
              >
                <FiArrowLeft className='mr-1' /> 이미지 업로드로 돌아가기
              </button>
            )}
          </div>
          <button
            onClick={() => setShowApiKeyManager(!showApiKeyManager)}
            className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
              showApiKeyManager
                ? theme === 'dark'
                  ? 'bg-blue-900 text-blue-300 border border-blue-700'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                : theme === 'dark'
                  ? 'bg-gray-800 text-blue-400 shadow-lg border border-gray-700 hover:bg-gray-700'
                  : 'bg-white text-blue-600 shadow hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <FiKey className='mr-2' />
            API 키 관리
          </button>
        </div>

        {/* API 키 관리 컴포넌트 */}
        {showApiKeyManager ? (
          <ApiKeyManager />
        ) : (
          <div
            className={`${
              theme === 'dark'
                ? 'bg-gray-800 border border-gray-700 text-white'
                : 'bg-white border border-gray-200'
            } shadow-lg rounded-lg p-6`}
          >
            {/* 서버 상태 표시 */}
            {isServerAvailable === false && (
              <div className='mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 mr-2'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <div>
                  <span className='font-medium'>
                    서버 연결에 실패했습니다. API 기능을 사용할 수 없습니다.
                  </span>
                  <div className='mt-1 text-sm'>
                    <p>해결 방법:</p>
                    <ol className='list-decimal list-inside mt-1 ml-2 space-y-1'>
                      <li>백엔드 서버가 실행 중인지 확인해주세요.</li>
                      <li>
                        터미널에서{' '}
                        <code className='bg-yellow-100 px-1 rounded'>
                          cd Backend_server && python -m uvicorn main:app
                          --reload --port 8001
                        </code>{' '}
                        명령을 실행하세요.
                      </li>
                      <li>
                        Next.js 서버 설정(next.config.js)에서 올바른 백엔드
                        URL을 확인하세요.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* 토큰 사용 경고창 */}
            {showTokenWarning && (
              <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div
                  className={`${
                    theme === 'dark'
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-white'
                  } rounded-lg p-6 max-w-sm mx-auto`}
                >
                  <h3
                    className={`text-lg font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    토큰 사용 경고
                  </h3>
                  <p
                    className={`mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    서버 API로 배경 제거 기능은 계정에서 1개의 토큰을
                    사용합니다. 계속하시겠습니까?
                  </p>
                  <div className='flex justify-end space-x-3'>
                    <button
                      onClick={cancelTokenUsage}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      취소
                    </button>
                    <button
                      onClick={confirmTokenUsage}
                      className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
                    >
                      계속하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!preview && (
              <div className='text-center'>
                <button
                  onClick={() => setIsUrlMode(false)}
                  className={`px-4 py-3 rounded-full text-lg font-medium transition-colors ${!isUrlMode ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                >
                  업로드
                </button>
                <button
                  onClick={() => setIsUrlMode(true)}
                  className={`px-4 py-3 rounded-full text-lg font-medium transition-colors ${isUrlMode ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                >
                  URL
                </button>
              </div>
            )}

            {!preview && !isUrlMode && (
              <div
                {...getRootProps()}
                className={`mt-6 border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              >
                <input {...getInputProps()} />
                <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100'>
                  <FiUpload className='h-8 w-8 text-blue-600' />
                </div>
                <button className='mt-6 px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-medium hover:bg-blue-600 transition-colors'>
                  Upload Image
                </button>
                <p className='mt-4 text-xl text-gray-500'>or drop a file,</p>
                <p className='mt-2 text-gray-400'>
                  paste image or{' '}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setIsUrlMode(true);
                    }}
                    className='text-blue-500 hover:underline'
                  >
                    URL
                  </button>
                </p>
              </div>
            )}

            {!preview && isUrlMode && (
              <div className='mt-6 p-6 border-2 border-dashed border-gray-300 rounded-xl'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <FiLink className='h-6 w-6 text-gray-400' />
                  </div>
                  <div className='ml-3 flex-1'>
                    <input
                      ref={urlInputRef}
                      type='text'
                      className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border'
                      placeholder='https://example.com/image.jpg'
                    />
                  </div>
                  <div className='ml-3'>
                    <button
                      onClick={handleUrlSubmit}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600'
                    >
                      입력
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className='mt-4 p-4 bg-red-50 text-red-600 rounded-lg'>
                <p className='font-medium'>{error}</p>
                {error.includes('API 엔드포인트') && (
                  <div className='mt-2 text-sm'>
                    <p className='font-medium'>해결 방법:</p>
                    <ol className='list-decimal list-inside mt-1 space-y-1'>
                      <li>
                        백엔드 서버가 실행 중인지 확인해주세요. (포트: 8001)
                      </li>
                      <li>
                        백엔드 서버가 "/api/background/remove" 엔드포인트를
                        제공하는지 확인해주세요.
                      </li>
                      <li>서버의 라우터 설정이 올바른지 확인해주세요.</li>
                    </ol>
                  </div>
                )}
                {error.includes('API 키가 설정되지 않았습니다') && (
                  <div className='mt-2 text-sm'>
                    <p className='font-medium'>해결 방법:</p>
                    <ol className='list-decimal list-inside mt-1 space-y-1'>
                      <li>
                        Backend_server 폴더의 .env 파일에 Remove.bg API 키가
                        설정되어 있는지 확인하세요.
                      </li>
                      <li>
                        REMOVE_BG_API_KEY="your-api-key-here" 형식으로 입력되어
                        있어야 합니다.
                      </li>
                      <li>
                        <a
                          href='https://www.remove.bg/api'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          Remove.bg
                        </a>
                        에서 API 키를 발급받으세요.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {preview &&
              !processedImage &&
              !isProcessing &&
              processingMode === null && (
                <div className='mt-6'>
                  <div className='relative aspect-video w-full overflow-hidden rounded-lg'>
                    <Image
                      src={preview}
                      alt='업로드된 이미지 미리보기'
                      fill
                      className='object-contain'
                    />
                  </div>
                  <p
                    className={`mt-4 text-lg font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    처리 방식 선택
                  </p>
                  <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    <button
                      onClick={() => handleProcessImage('bg-removal')}
                      className='flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors'
                    >
                      <FiScissors className='mr-2' />
                      인물 배경 제거
                    </button>
                    <button
                      onClick={() => handleProcessImage('object-bg-removal')}
                      className='flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors'
                    >
                      <FiImage className='mr-2' />
                      자동 사물 배경 제거
                    </button>
                    <button
                      onClick={() =>
                        handleProcessImage('selectable-object-bg-removal')
                      }
                      className='flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors'
                    >
                      <FiMousePointer className='mr-2' />
                      사물 선택 배경 제거
                    </button>
                    <button
                      onClick={() => handleProcessImage('advanced-bg-removal')}
                      className='flex items-center justify-center px-4 py-3 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors'
                    >
                      <FiStar className='mr-2' />
                      고급 배경 제거
                    </button>
                    <button
                      onClick={() => handleProcessImage('edge-detection')}
                      className='flex items-center justify-center px-4 py-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors'
                    >
                      <FiZap className='mr-2' />
                      윤곽선 감지
                    </button>
                    <button
                      onClick={() => handleProcessImage('api-bg-removal')}
                      className='flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors'
                    >
                      <FiServer className='mr-2' />
                      서버 API로 배경 제거
                    </button>
                    <button
                      onClick={() => handleProcessImage('bria-bg-generation')}
                      className='flex items-center justify-center px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors'
                    >
                      <FiPlusCircle className='mr-2' />
                      BRIA 배경 생성
                    </button>
                    <button
                      onClick={() =>
                        handleProcessImage('bg-removal-and-generation')
                      }
                      className='flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors'
                    >
                      <FiScissors className='mr-2' />
                      배경제거 후 배경생성
                    </button>
                  </div>
                  <div className='mt-4 flex justify-between'>
                    <button
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

            {isProcessing && (
              <div className='mt-8'>
                {processingMode === 'bg-removal' && preview && (
                  <BackgroundRemover
                    imageUrl={preview}
                    onProcessingComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                  />
                )}

                {processingMode === 'object-bg-removal' && preview && (
                  <ObjectBackgroundRemover
                    imageUrl={preview}
                    onProcessingComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                  />
                )}

                {processingMode === 'selectable-object-bg-removal' &&
                  preview && (
                    <SelectableObjectBackgroundRemover
                      imageUrl={preview}
                      onProcessingComplete={handleProcessingComplete}
                      onError={handleProcessingError}
                    />
                  )}

                {processingMode === 'advanced-bg-removal' && preview && (
                  <AdvancedBackgroundRemover
                    imageUrl={preview}
                    onProcessingComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                  />
                )}

                {processingMode === 'edge-detection' && preview && (
                  <EdgeDetector
                    imageUrl={preview}
                    onProcessingComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                  />
                )}

                {processingMode === 'api-bg-removal' && (
                  <div className='mt-4 mb-8 w-full'>
                    <div className='w-full bg-gray-200 rounded-full h-2.5'>
                      <div
                        className='bg-green-600 h-2.5 rounded-full animate-pulse'
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <p
                      className={`text-center mt-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      서버에서 처리 중...
                    </p>
                  </div>
                )}

                {processingMode === 'bria-bg-generation' &&
                  (intermediateImage || preview) && (
                    <BriaBackgroundGenerator
                      imageUrl={intermediateImage || preview || ''}
                      onComplete={handleProcessingComplete}
                      onError={handleProcessingError}
                    />
                  )}

                {processingMode === 'bg-removal-and-generation' && preview && (
                  <RemoveAndGenerateForm
                    imageUrl={preview}
                    onComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                  />
                )}
              </div>
            )}

            {processedImage && (
              <div className='mt-6'>
                <div
                  className={`border rounded-lg overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className='relative bg-grid'>
                    <Image
                      src={processedImage}
                      alt='Processed'
                      width={800}
                      height={600}
                      className='w-full'
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className='p-4 border-t'>
                    <h3
                      className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {getProcessingModeName(processingMode as ProcessingMode)}{' '}
                      - 결과
                    </h3>
                    <div className='mt-2 flex space-x-2'>
                      <a
                        href={processedImage}
                        download={`bgenius-${Date.now()}.png`}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors'
                      >
                        다운로드
                      </a>
                      <button
                        onClick={resetProcess}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        다시 처리
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOM 컨테이너 요소 추가 - SelectableObjectBackgroundRemover 컴포넌트를 위한 필수 요소 */}
            <div
              id='hidden-elements-container'
              className='absolute opacity-0 pointer-events-none'
              style={{ zIndex: -1 }}
            ></div>
            <div
              id='preview-canvas-container'
              className='absolute opacity-0 pointer-events-none'
              style={{ zIndex: -1 }}
            ></div>
          </div>
        )}
      </div>

      {/* 다크모드 토글 버튼 */}
      <div className='fixed bottom-5 right-5 z-50'>
        <div className='theme-toggle-switch'>
          <button
            onClick={toggleTheme}
            className='flex items-center gap-2'
            aria-label='테마 전환'
          >
            {theme === 'dark' ? (
              <FiSun className='text-yellow-400 w-5 h-5' />
            ) : (
              <FiMoon className='text-gray-600 w-5 h-5' />
            )}

            <span
              className={`text-sm mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              나는 {theme === 'dark' ? '밤' : '낮'}이에요
            </span>

            <div className='theme-toggle-track'>
              <div className='theme-toggle-thumb'></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
