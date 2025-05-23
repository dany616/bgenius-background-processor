/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'd1ei2xrl63k822.cloudfront.net',
      'briadownload.s3.ap-northeast-2.amazonaws.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    console.log('Next.js rewrites 설정 로드됨');
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/api/:path*', // 백엔드 API 서버
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8001/uploads/:path*', // 업로드된 파일 접근
      },
      {
        source: '/sd-api/:path*',
        destination: 'http://localhost:8002/api/:path*', // SD 서버 API 접근
      },
    ];
  },
};

module.exports = nextConfig;
