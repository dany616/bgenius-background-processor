import { NextRequest, NextResponse } from 'next/server';

// POST 요청 처리 - 백엔드 API로 요청 전달
export async function POST(req: NextRequest) {
  try {
    // 백엔드 서버 URL
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

    // 요청 내용 로깅
    console.log(`백엔드 API 호출: ${BACKEND_URL}/api/replace-bg`);

    // 원본 요청을 그대로 전달
    const response = await fetch(`${BACKEND_URL}/api/replace-bg`, {
      method: 'POST',
      body: req.body,
      headers: {
        'Content-Type':
          req.headers.get('content-type') || 'multipart/form-data',
      },
    });

    // 응답 확인
    if (!response.ok) {
      const errorText = await response.text();
      console.error('백엔드 API 오류:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: `백엔드 서버에서 오류가 발생했습니다: ${response.status}`,
          error: errorText,
        },
        { status: response.status }
      );
    }

    // 백엔드 응답 데이터 가져오기
    const data = await response.json();
    console.log('백엔드 API 응답:', data);

    // 성공 응답 반환
    return NextResponse.json(data);
  } catch (error) {
    console.error('replace-bg API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '배경 교체 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// GET 요청은 허용하지 않음
export async function GET() {
  return NextResponse.json(
    {
      message: '이 엔드포인트는 POST 요청만 지원합니다.',
    },
    { status: 405 }
  );
}
