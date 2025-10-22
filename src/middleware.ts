// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function verifyCookie(raw?: string) {
  if (!raw) return null
  const [payload, sig] = raw.split('.')
  if (!payload || !sig) return null
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.AUTH_SESSION_SECRET!),
    { name:'HMAC', hash:'SHA-256' },
    false,
    ['verify']
  )
  const ok = await crypto.subtle.verify('HMAC', key, Buffer.from(sig, 'base64url'), new TextEncoder().encode(payload))
  if (!ok) return null
  try {
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof obj.exp === 'number' && obj.exp*1000 < Date.now()) return null // 期限切れ
    return obj as { sub: string; role: 'admin'|'user'; exp: number }
  } catch { return null }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const session = await verifyCookie(req.cookies.get('app_session')?.value)
  const isAuthed = Boolean(session)
  const role = session?.role

  // 管理者エリア: /list（ただし /list/qr-reception-screen は除く）
  const isAdminArea = /^\/list(\/(?!qr-reception-screen).*)?$/.test(url.pathname)
  // ユーザーエリア: /list/qr-reception-screen（配下含む）
  const isUserArea  = /^\/list\/qr-reception-screen(\/.*)?$/.test(url.pathname)

  // 未認証 → 正しいログイン入口へ
  if (!isAuthed && (isAdminArea || isUserArea)) {
    const loginPath = isAdminArea ? '/login-admin' : '/login-user'
    const login = new URL(loginPath, req.url)
    login.searchParams.set('next', url.pathname + url.search)
    return NextResponse.redirect(login)
  }

  // 既認証がログインページへ来たら、仕様どおりのホームへ
  if (isAuthed && url.pathname === '/login-admin') {
    return NextResponse.redirect(new URL('/list', req.url))
  }
  if (isAuthed && url.pathname === '/login-user') {
    return NextResponse.redirect(new URL('/list/qr-reception-screen', req.url))
  }

  // 権限ガード（任意）：admin 以外が管理者エリアへ来たらユーザー側へ
  if (isAuthed && isAdminArea && role !== 'admin') {
    return NextResponse.redirect(new URL('/list/qr-reception-screen', req.url))
  }

  const res = NextResponse.next()
  if (isAdminArea || isUserArea) res.headers.set('Cache-Control', 'no-store')
  return res
}

/*
export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml|images|assets).*)'],
}*/

export const config = {
  matcher: [
    '/list/:path*',   // 管理者/ユーザー両方の保護対象
    '/login-admin',   // 既ログインならリダイレクト
    '/login-user',    // 既ログインならリダイレクト
  ],
};