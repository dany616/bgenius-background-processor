'use client';

import React from 'react';

type LoadingDotsProps = {
  color?: string;
  size?: number;
};

const LoadingDots: React.FC<LoadingDotsProps> = ({
  color = '#2563eb', // 기본값은 블루 600
  size = 4,
}) => {
  return (
    <div className='flex space-x-2 justify-center items-center'>
      <div
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
        }}
        className='animate-pulse'
      />
      <div
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          animationDelay: '0.2s',
        }}
        className='animate-pulse'
      />
      <div
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          animationDelay: '0.4s',
        }}
        className='animate-pulse'
      />
    </div>
  );
};

export default LoadingDots;
