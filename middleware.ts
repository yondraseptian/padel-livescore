import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('admin_token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
