import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    if (!filename) {
      return new Response('파일을 찾을 수 없습니다.', { status: 404 });
    }
    
    const publicDir = path.join(process.cwd(), 'public', 'temp-images');
    const filepath = path.join(publicDir, filename);
    
    const fileBuffer = await fs.readFile(filepath).catch(() => null);
    if (!fileBuffer) {
      return new Response('파일을 찾을 수 없습니다.', { status: 404 });
    }
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('이미지 접근 오류:', error);
    return new Response('서버 오류가 발생했습니다.', { status: 500 });
  }
} 