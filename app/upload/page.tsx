'use client';

import dynamic from 'next/dynamic';

// Dynamically import the UploadPage component
const UploadPageComponent = dynamic(() => import('../pages/upload'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  ),
});

export default function UploadPage() {
  return <UploadPageComponent />;
} 