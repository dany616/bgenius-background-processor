import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import formidable from 'formidable';
import { Writable } from 'stream';

// FormData를 파싱하기 위한 헬퍼 함수
async function parseFormData(req: NextRequest) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const chunks: Buffer[] = [];
      const readable = req.body as ReadableStream;
      const reader = readable.getReader();

      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
      });

      reader.read().then(function process({ done, value }) {
        if (done) {
          writable.end();
          return;
        }

        writable.write(value);
        return reader.read().then(process);
      });

      const form = new formidable.IncomingForm({
        keepExtensions: true,
        multiples: false,
      });

      writable.on('finish', () => {
        const buffer = Buffer.concat(chunks);
        form.parse(buffer, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });
    }
  );
}

// 임시 디렉토리 확인 및 생성
async function ensureTempDir() {
  const publicDir = path.join(process.cwd(), 'public');
  const tempDir = path.join(publicDir, 'temp-images');

  try {
    await fs.access(tempDir);
  } catch (error) {
    await fs.mkdir(tempDir, { recursive: true });
  }

  return tempDir;
}

// BRIA API 요청 함수
async function callBriaAPI(imagePath: string, prompt: string, style: string) {
  const briaApiKey = process.env.BRIA_API_KEY;

  if (!briaApiKey) {
    console.warn(
      'BRIA_API_KEY가 설정되지 않았습니다. 테스트 모드로 실행합니다.'
    );

    // API 키가 없는 경우 원본 이미지를 그대로 반환 (테스트 목적)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 실제 API 호출을 시뮬레이션하기 위한 지연
    return {
      success: true,
      imageUrl: imagePath.replace(process.cwd(), ''),
    };
  }

  try {
    // 이미지 파일을 base64로 인코딩
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // BRIA API에 요청
    const response = await axios.post(
      'https://api.bria.ai/v1/generate/background',
      {
        image: base64Image,
        prompt: prompt,
        style: style || 'natural', // 기본 스타일
      },
      {
        headers: {
          Authorization: `Bearer ${briaApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      // 성공적으로 이미지 생성
      return {
        success: true,
        imageUrl: response.data.imageUrl,
      };
    } else {
      throw new Error(response.data.message || '이미지 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('BRIA API 호출 오류:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // multipart/form-data 파싱
    const { fields, files } = await parseFormData(req);

    // 이미지와 프롬프트 확인
    const imageFile = files.image;
    const prompt = fields.prompt?.[0] || '';
    const style = fields.style?.[0] || 'natural';

    if (!imageFile || !prompt) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지와 프롬프트가 모두 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 임시 디렉토리 확인
    const tempDir = await ensureTempDir();

    // 임시 파일 이름 생성
    const fileId = uuidv4();
    const fileExt = path.extname(imageFile.originalFilename || '.png');
    const fileName = `${fileId}${fileExt}`;
    const filePath = path.join(tempDir, fileName);

    // 이미지 저장
    const imageBuffer = await fs.readFile(imageFile.filepath);
    await fs.writeFile(filePath, imageBuffer);

    // 원본 임시 파일 삭제
    await fs.unlink(imageFile.filepath);

    // BRIA API 호출
    const result = await callBriaAPI(filePath, prompt, style);

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      prompt,
      style,
    });
  } catch (error) {
    console.error('배경 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '배경 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 개발 중 임시 이미지 접근용 (실제 프로덕션에서는 사용하지 않음)
export async function GET() {
  return NextResponse.json(
    {
      message: '이 엔드포인트는 POST 요청만 지원합니다.',
    },
    { status: 405 }
  );
}
