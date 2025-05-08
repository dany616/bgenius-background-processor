'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 테마 컨텍스트 생성
import { createContext } from 'react';
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// 클라이언트 사이드에서만 로드되도록 dynamic import 사용
const TensorFlowInitializer = dynamic(() => import('./index'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되었을 때 상태 업데이트
    setMounted(true);
    
    // 로컬 스토리지에서 테마 설정 불러오기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      // HTML 태그에 클래스 추가
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // 시스템 테마 감지
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
      localStorage.setItem('theme', defaultTheme);
      
      if (defaultTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }

    // 브라우저 환경에서만 실행되도록 함
    if (typeof window !== 'undefined') {
      // 메모리 누수 방지를 위한 처리
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          console.log('페이지 숨김 상태: 메모리 정리 실행');
          try {
            // WebGL 컨텍스트 정리 시도
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
              if (gl) {
                gl.getExtension('WEBGL_lose_context')?.loseContext();
              }
            }
          } catch (e) {
            console.warn('WebGL 정리 오류:', e);
          }
        }
      };
      
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // data-theme 속성 설정
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // dark 클래스 토글
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('theme', newTheme);
  };

  // 마운트되기 전에는 기본 테마로 표시 (hydration 불일치 방지)
  if (!mounted) {
    return (
      <html lang="ko">
        <body className={inter.className}>
          <div className="w-full h-screen flex items-center justify-center">
            <div className="animate-pulse">로딩 중...</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko" data-theme={theme} className={theme === 'dark' ? 'dark' : ''}>
      <body className={inter.className}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <TensorFlowInitializer />
          {children}
        </ThemeContext.Provider>
      </body>
    </html>
  );
}