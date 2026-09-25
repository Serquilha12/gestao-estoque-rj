import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  // Use request.url so the redirect remains on the exact active domain (e.g. Vercel production)
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl, { status: 303 });

  response.cookies.delete(SESSION_COOKIE);
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
