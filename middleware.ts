import { NextResponse } from 'next/server'

export function middleware() {
  return new NextResponse('점검 중입니다.', { status: 503 })
}

export const config = {
  matcher: '/(.*)',
}
