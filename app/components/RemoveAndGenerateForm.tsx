'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FiCheck, FiDownload, FiSend } from 'react-icons/fi';

interface RemoveAndGenerateFormProps {
  imageUrl: string;
  onComplete: (resultImageUrl: string) => void;
  onError: (error: Error) => void;
}

const RemoveAndGenerateForm: React.FC<RemoveAndGenerateFormProps> = ({
  imageUrl,
  onComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promptText.trim()) {
      alert('배경 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedImages([]);
    setSelectedImageIndex(-1);

    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 이미지 URL에서 Blob 객체 가져오기
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // FormData에 파일 추가
      formData.append('file', blob, 'image.png');
      formData.append('bg_prompt', promptText);
      formData.append('num_results', '4');

      console.log('요청 데이터:', {
        url: '/api/remove-and-generate',
        prompt: promptText,
        num_results: 4,
      });

      // API 호출
      const apiResponse = await fetch('/api/remove-and-generate', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API 오류 응답:', apiResponse.status, errorText);
        throw new Error(
          `배경 제거 및 생성에 실패했습니다. 오류 코드: ${apiResponse.status}`
        );
      }

      const data = await apiResponse.json();
      console.log('API 응답 데이터:', data);

      if (
        data &&
        data.bria_results &&
        data.bria_results.result &&
        data.bria_results.result.length > 0
      ) {
        // 모든 이미지 URL을 배열로 추출
        const allImageUrls = data.bria_results.result.map(
          (result: any) => result[0]
        );
        setGeneratedImages(allImageUrls);

        // 첫 번째 이미지를 기본 선택
        setSelectedImageIndex(0);
      } else {
        throw new Error('서버에서 처리된 이미지 URL을 반환하지 않았습니다.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : '이미지 처리 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      onError(error instanceof Error ? error : new Error(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleConfirmSelection = () => {
    if (selectedImageIndex >= 0 && generatedImages.length > 0) {
      onComplete(generatedImages[selectedImageIndex]);
    }
  };

  const handleDownload = (imageUrl: string) => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `background-generated-image-${selectedImageIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className='w-full'>
      <h2 className='text-xl font-bold text-gray-800 mb-4'>
        배경 제거 후 배경 생성
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='border rounded-lg overflow-hidden'>
          <div className='p-2 bg-gray-50 border-b'>
            <h3 className='font-medium text-center'>원본 이미지</h3>
          </div>
          <div className='relative aspect-square'>
            <Image
              src={imageUrl}
              alt='원본 이미지'
              fill
              className='object-contain'
            />
          </div>
        </div>

        {selectedImageIndex >= 0 && generatedImages.length > 0 && (
          <div className='border rounded-lg overflow-hidden'>
            <div className='p-2 bg-gray-50 border-b'>
              <h3 className='font-medium text-center'>선택된 결과 이미지</h3>
            </div>
            <div className='relative aspect-square'>
              <Image
                src={generatedImages[selectedImageIndex]}
                alt={`선택된 배경 ${selectedImageIndex + 1}`}
                fill
                className='object-contain'
              />
            </div>
            <div className='p-3 border-t bg-gray-50 flex justify-between'>
              <button
                className='px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center'
                onClick={() =>
                  handleDownload(generatedImages[selectedImageIndex])
                }
              >
                <FiDownload className='mr-1' /> 다운로드
              </button>
              <button
                className='px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center'
                onClick={handleConfirmSelection}
              >
                <FiCheck className='mr-1' /> 사용하기
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className='p-4 bg-white border rounded-lg mb-6'
      >
        <div className='mb-4'>
          <label
            htmlFor='promptText'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            원하는 배경 설명:
          </label>
          <input
            id='promptText'
            type='text'
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder='원하는 배경을 설명해주세요 (예: 해변, 숲, 도시 등)'
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            disabled={isLoading}
          />
        </div>

        <button
          type='submit'
          className={`w-full px-4 py-2 text-white font-medium rounded-md ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              처리 중...
            </span>
          ) : (
            <span className='flex items-center justify-center'>
              <FiSend className='mr-2' /> 배경 제거 및 생성 시작
            </span>
          )}
        </button>
      </form>

      {errorMessage && (
        <div className='mb-6 p-4 bg-red-50 text-red-700 rounded-lg'>
          <p className='font-medium'>오류 발생: {errorMessage}</p>
          <p className='mt-2 text-sm'>
            백엔드 서버가 실행 중인지 확인해주세요. (포트: 8001)
          </p>
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className='mb-6'>
          <h3 className='text-lg font-medium text-gray-800 mb-3'>
            모든 생성된 이미지
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {generatedImages.map((imageUrl, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImageIndex === index
                    ? 'ring-2 ring-blue-500 scale-105'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleSelectImage(index)}
              >
                <div className='relative aspect-square'>
                  <Image
                    src={imageUrl}
                    alt={`생성된 배경 ${index + 1}`}
                    fill
                    className='object-cover'
                  />
                </div>
                <div className='p-2 bg-gray-50 border-t text-center'>
                  <span className='text-sm font-medium'>
                    이미지 {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className='mt-4 mb-6'>
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div
              className='bg-blue-600 h-2.5 rounded-full animate-pulse'
              style={{ width: '100%' }}
            ></div>
          </div>
          <p className='text-center mt-2 text-gray-600'>
            이미지 배경 제거 후 새 배경 생성 중...
          </p>
        </div>
      )}
    </div>
  );
};

export default RemoveAndGenerateForm;
