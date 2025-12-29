import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const sitePassword = process.env.SITE_PASSWORD

    if (!sitePassword) {
      // No password protection enabled
      return NextResponse.json({ success: true })
    }

    if (password === sitePassword) {
      // Password correct - set cookie
      const response = NextResponse.json({ success: true })

      // Set cookie for 7 days
      response.cookies.set('site-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
