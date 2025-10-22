import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  // 認証チェック（例：Cookie、ヘッダ、セッションなど）
  const authorized = checkAuth(req); // 自作関数

  if (!authorized) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 画像読み込み
  const imagePath = path.join(process.cwd(), 'img', 'sample.png');
  const imageBuffer = fs.readFileSync(imagePath);

  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline',
    },
  });
}

function checkAuth(req: NextRequest): boolean {
  // ここでCookieやヘッダーの認証ロジックを実装
  const token = req.cookies.get('auth_token')?.value;
  return token === 'your-valid-token'; // 例
}
