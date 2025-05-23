'use client';

import { useState, useEffect } from 'react';
import {
  FiKey,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiRefreshCw,
} from 'react-icons/fi';

interface ApiKey {
  key: string;
  value: string;
  masked?: string;
  isSet?: boolean;
}

const API_KEY_LABELS: Record<string, string> = {
  AWS_ACCESS_KEY_ID: 'AWS 액세스 키 ID',
  AWS_SECRET_ACCESS_KEY: 'AWS 시크릿 액세스 키',
  REMOVE_BG_API_KEY: 'Remove.bg API 키',
  BRIA_API_TOKEN: 'BRIA API 토큰',
};

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { key: 'AWS_ACCESS_KEY_ID', value: '', masked: '' },
    { key: 'AWS_SECRET_ACCESS_KEY', value: '', masked: '' },
    { key: 'REMOVE_BG_API_KEY', value: '', masked: '' },
    { key: 'BRIA_API_TOKEN', value: '', masked: '' },
  ]);

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isSaving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 초기 API 키 상태 로드
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/keys');

        if (response.ok) {
          const data = await response.json();

          setApiKeys(prevKeys =>
            prevKeys.map(key => ({
              ...key,
              masked: data.keys[key.key] || '',
              isSet: Boolean(data.keys[key.key]),
            }))
          );

          setStatusMessage('API 키가 로드되었습니다.');
        } else {
          console.error('API 키 로드 실패:', response.statusText);
          setStatusMessage(
            'API 키 로드에 실패했습니다. 서버 연결을 확인하세요.'
          );
        }
      } catch (error) {
        console.error('API 키 로드 중 오류:', error);
        setStatusMessage('서버 연결 오류. 백엔드가 실행 중인지 확인하세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  // API 키 값 변경 처리
  const handleKeyChange = (index: number, value: string) => {
    const updatedKeys = [...apiKeys];
    updatedKeys[index].value = value;
    setApiKeys(updatedKeys);
  };

  // 저장 버튼 처리
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      setStatusMessage('API 키 저장 중...');

      // 입력된 값이 있는 키만 전송
      const keysToSave: Record<string, string> = {};
      apiKeys.forEach(apiKey => {
        if (apiKey.value) {
          keysToSave[apiKey.key] = apiKey.value;
        }
      });

      // 저장할 키가 없으면 종료
      if (Object.keys(keysToSave).length === 0) {
        setStatusMessage('저장할 API 키가 없습니다.');
        setSaveStatus('error');
        return;
      }

      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keysToSave),
      });

      if (response.ok) {
        // 저장 성공 - 다시 마스킹된 키를 로드
        const getResponse = await fetch('/api/keys');
        if (getResponse.ok) {
          const data = await getResponse.json();

          setApiKeys(prevKeys =>
            prevKeys.map(key => ({
              ...key,
              value: '', // 입력 필드 초기화
              masked: data.keys[key.key] || '',
              isSet: Boolean(data.keys[key.key]),
            }))
          );
        }

        setSaveStatus('success');
        setStatusMessage('API 키가 성공적으로 저장되었습니다.');
      } else {
        const errorText = await response.text();
        console.error('API 키 저장 실패:', errorText);
        setSaveStatus('error');
        setStatusMessage(`API 키 저장 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('API 키 저장 중 오류:', error);
      setSaveStatus('error');
      setStatusMessage('서버 연결 오류. 백엔드가 실행 중인지 확인하세요.');
    } finally {
      setSaving(false);
    }
  };

  // 비밀번호 표시/숨기기 토글
  const togglePasswordVisibility = (key: string) => {
    setShowPassword(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 새로고침 버튼 처리
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('API 키 새로고침 중...');

      const response = await fetch('/api/keys');

      if (response.ok) {
        const data = await response.json();

        setApiKeys(prevKeys =>
          prevKeys.map(key => ({
            ...key,
            value: '', // 입력 필드 초기화
            masked: data.keys[key.key] || '',
            isSet: Boolean(data.keys[key.key]),
          }))
        );

        setStatusMessage('API 키가 새로고침되었습니다.');
      } else {
        console.error('API 키 새로고침 실패:', response.statusText);
        setStatusMessage('API 키 새로고침에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 키 새로고침 중 오류:', error);
      setStatusMessage('서버 연결 오류. 백엔드가 실행 중인지 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold text-gray-800 dark:text-white flex items-center'>
          <FiKey className='mr-2' /> API 키 설정
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className='text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center'
        >
          <FiRefreshCw className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      <div className='space-y-4'>
        {apiKeys.map((apiKey, index) => (
          <div
            key={apiKey.key}
            className='border rounded-md p-4 dark:border-gray-700'
          >
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                {API_KEY_LABELS[apiKey.key]}
              </label>
              <div className='flex items-center'>
                {apiKey.isSet && (
                  <span className='inline-flex items-center mr-2 text-sm text-green-600 dark:text-green-400'>
                    <FiCheckCircle className='mr-1' /> 설정됨
                  </span>
                )}
                {!apiKey.isSet && apiKey.masked === '' && (
                  <span className='inline-flex items-center mr-2 text-sm text-red-600 dark:text-red-400'>
                    <FiXCircle className='mr-1' /> 미설정
                  </span>
                )}
              </div>
            </div>

            <div className='relative mt-1'>
              <input
                type={showPassword[apiKey.key] ? 'text' : 'password'}
                value={apiKey.value}
                onChange={e => handleKeyChange(index, e.target.value)}
                placeholder={
                  apiKey.masked || `${API_KEY_LABELS[apiKey.key]} 입력`
                }
                className='block w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 px-3 py-1.5 text-gray-500 dark:text-gray-400'
                onClick={() => togglePasswordVisibility(apiKey.key)}
              >
                {showPassword[apiKey.key] ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              {apiKey.key === 'AWS_ACCESS_KEY_ID' &&
                'AWS S3에 파일을 업로드하는 데 사용됩니다.'}
              {apiKey.key === 'AWS_SECRET_ACCESS_KEY' &&
                'AWS S3 인증에 필요한 보안 키입니다.'}
              {apiKey.key === 'REMOVE_BG_API_KEY' &&
                '이미지 배경 제거 API 사용에 필요합니다. (remove.bg)'}
              {apiKey.key === 'BRIA_API_TOKEN' &&
                '배경 생성 API 사용에 필요합니다. (BRIA)'}
            </p>
          </div>
        ))}
      </div>

      <div className='mt-6'>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {isSaving ? (
            <>
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
              저장 중...
            </>
          ) : (
            <>
              <FiSave className='mr-2' />
              API 키 저장
            </>
          )}
        </button>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-md ${
              saveStatus === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100'
                : saveStatus === 'error'
                  ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            }`}
          >
            {saveStatus === 'success' && (
              <FiCheckCircle className='inline-block mr-1' />
            )}
            {saveStatus === 'error' && (
              <FiXCircle className='inline-block mr-1' />
            )}
            {statusMessage}
          </div>
        )}
      </div>

      <div className='mt-6 border-t pt-4 text-sm text-gray-500 dark:text-gray-400'>
        <p>
          <strong>참고:</strong> 입력한 API 키는 서버에 임시로 저장되며, 서버
          재시작 시 .env 파일의 값으로 초기화됩니다. 영구적으로 저장하려면
          서버의 .env 파일에 직접 설정하세요.
        </p>
      </div>
    </div>
  );
}
