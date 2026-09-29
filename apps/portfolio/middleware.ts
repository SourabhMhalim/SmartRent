import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // next.config redirect patterns are case-insensitive, so use a literal
  // pathname comparison to avoid redirecting the canonical route to itself.
  const path = request.nextUrl.pathname;
  if (path === '/app/Smartrent' || path.startsWith('/app/Smartrent/')) {
    const target = request.nextUrl.clone();
    target.pathname = path.replace('/app/Smartrent', '/app/smartrent');
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = { matcher: '/app/:path*' };
