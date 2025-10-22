// app/api/session/route.ts
import { NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// 環境変数（Cognito）
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!
const COGNITO_REGION = process.env.COGNITO_REGION!

/*
process.env.COGNITO_USER_POOL_ID の型は string | undefined です。
末尾の ! を付けると 「ここは絶対に undefined じゃない」 とコンパイラに約束します。

*/

const JWKS = createRemoteJWKSet(
  new URL(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`)
)

// 署名付きの軽量クッキーを作る（HMAC）
const SESSION_SECRET = new TextEncoder().encode(process.env.AUTH_SESSION_SECRET!)
async function sign(data: object) {
  // ここでは簡易の base64url(JSON) + HMAC-SHA256 署名を作る例
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const cryptoKey = await crypto.subtle.importKey('raw', SESSION_SECRET, {name:'HMAC', hash:'SHA-256'}, false, ['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(payload))
  const sig = Buffer.from(sigBuf).toString('base64url')
  return `${payload}.${sig}`
}
async function verify(token: string) {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const cryptoKey = await crypto.subtle.importKey('raw', SESSION_SECRET, {name:'HMAC', hash:'SHA-256'}, false, ['verify'])
  const ok = await crypto.subtle.verify('HMAC', cryptoKey, Buffer.from(sig, 'base64url'), new TextEncoder().encode(payload))
  if (!ok) return null
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()) } catch { return null }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json() as { idToken: string }

    // 1) CognitoのIDトークンを**サーバーで検証**
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
    })

    // 2) アプリで使うロールを決定（例：cognito:groups）
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? []
    const role: 'admin' | 'user' = groups.includes('admin') ? 'admin' : 'user'

    // 3) 軽量セッション（必要最低限）をクッキーに
    const session = await sign({
      sub: payload.sub,
      role,
      exp: Math.floor(Date.now()/1000) + 60*60*12, // 12h
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('app_session', session, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/',
      maxAge: 60*60*12,
    })
    return res
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('app_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
