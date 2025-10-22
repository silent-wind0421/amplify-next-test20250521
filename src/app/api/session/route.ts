// app/api/session/route.ts
import { NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!
const COGNITO_REGION = process.env.COGNITO_REGION!
const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json() as { idToken?: string }
    if (!idToken) {
      console.error('[session] no idToken in body')
      return NextResponse.json({ ok: false, reason: 'no id token' }, { status: 400 })
    }

    const { payload, protectedHeader } = await jwtVerify(idToken, JWKS, { issuer })
    // 追加チェック（必要ならaudなど）
    // if (payload.aud !== process.env.EXPECTED_AUDIENCE) { ... }

    // ロール判定
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? []
    const role: 'admin'|'user' = groups.includes('admin') ? 'admin' : 'user'

    // 署名付きクッキー作成（簡易版）
    const session = await sign({ sub: payload.sub, role, exp: Math.floor(Date.now()/1000) + 60*60*12 })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('app_session', session, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60*60*12,
    })
    return res
  } catch (e: any) {
    console.error('[session] verify failed:', e?.message ?? e)
    return NextResponse.json({ ok: false, reason: 'verify failed' }, { status: 401 })
  }
}

// 署名関数（前回提案のまま）。省略していたら追加してください。
async function sign(data: object) {
  const secret = new TextEncoder().encode(process.env.AUTH_SESSION_SECRET!)
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  const key = await crypto.subtle.importKey('raw', secret, { name:'HMAC', hash:'SHA-256' }, false, ['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const sig = Buffer.from(sigBuf).toString('base64url')
  return `${payload}.${sig}`
}

export async function DELETE() {
  // 作成時と同じ属性でクッキーを無効化することが重要
  const res = NextResponse.json({ ok: true })
  const isProd = process.env.NODE_ENV === 'production'

  for (const p of ['/', '/list', '/list/qr-reception-screen']) {
        res.cookies.set('app_session', '', {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          path: p,   // ← POST 時と同じ path
          maxAge: 0,   // 即時失効
        })
      }      
  
  
  return res
}
