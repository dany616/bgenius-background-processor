'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import LoadingDots from './components/loading-dots';
import React from 'react';
import { ThemeContext } from './layout';
import { FiUpload, FiImage, FiZap, FiMoon, FiSun } from 'react-icons/fi';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const loadingRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // 로딩 이펙트
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    window.addEventListener('load', handleLoad);
    // 페이지가 이미 로드된 경우
    if (document.readyState === 'complete') {
      handleLoad();
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // 로딩 완료 후 애니메이션
  useEffect(() => {
    if (!isLoading && loadingRef.current) {
      loadingRef.current.classList.add('fade-out');
      setTimeout(() => {
        if (loadingRef.current) {
          loadingRef.current.style.display = 'none';
        }
      }, 500);
    }
  }, [isLoading]);

  return (
    <>
      {isLoading && (
        <div
          ref={loadingRef}
          className='fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50'
        >
          <LoadingDots />
        </div>
      )}

      <div
        className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-gray-50 to-white'}`}
      >
        {/* Hero Section */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16'>
          <div className='text-center'>
            <h1
              className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} sm:text-5xl md:text-6xl`}
            >
              Bgenius.AI
            </h1>
            <p
              className={`mt-3 max-w-md mx-auto text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} sm:text-lg md:mt-5 md:text-xl md:max-w-3xl`}
            >
              Ai Background Image Optimizer
            </p>
            <div className='mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8'>
              <Link
                href='/upload'
                className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors'
              >
                <FiUpload className='mr-2' />
                지금 시작하기
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div
          className={`py-16 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {/* Feature 1 */}
              <div
                className={`relative p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-100'}`}
              >
                <div className='w-12 h-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600'>
                  <FiUpload className='w-6 h-6' />
                </div>
                <h3
                  className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  간편한 업로드
                </h3>
                <p
                  className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
                >
                  URL 및 드래그 앤 드롭으로 손쉽게 이미지를 업로드하고 사진을
                  편집하세요
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className={`relative p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-100'}`}
              >
                <div className='w-12 h-12 flex items-center justify-center rounded-lg bg-green-100 text-green-600'>
                  <FiImage className='w-6 h-6' />
                </div>
                <h3
                  className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  AI 배경 변경
                </h3>
                <p
                  className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
                >
                  최신 AI 기술로 자연스러운 배경을 생성하고 적용합니다
                </p>
              </div>

              {/* Feature 3 */}
              <div
                className={`relative p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-100'}`}
              >
                <div className='w-12 h-12 flex items-center justify-center rounded-lg bg-purple-100 text-purple-600'>
                  <FiZap className='w-6 h-6' />
                </div>
                <h3
                  className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  빠른 속도
                </h3>
                <p
                  className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}
                >
                  간편하게 업로드한 사진을 30초내로 누끼를 따주고 배경을
                  변경해줍니다
                </p>
              </div>
            </div>
          </div>
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
    </>
  );
}
