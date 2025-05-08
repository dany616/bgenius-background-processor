import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { FiUpload } from 'react-icons/fi';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setError(null);
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg text-gray-600">
          {isDragActive ? '여기에 이미지를 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드하세요'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          지원 형식: JPG, JPEG, PNG, WebP
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {preview && !isLoading && (
        <div className="mt-6">
          <p className="text-lg font-semibold mb-2">미리보기</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={preview}
              alt="업로드된 이미지 미리보기"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;