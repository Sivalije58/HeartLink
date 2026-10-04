// middleware.ts (In the project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const { pathname } = request.nextUrl;

  // 1. ALLOW LOGIN PAGE: If the user goes to /login, do not redirect them (otherwise a loop occurs)
  if ( pathname.startsWith('/login') || 
  pathname.startsWith('/photo') ||
  pathname.startsWith('/access_granted') ||
  pathname.startsWith('/access_denied') ||
  pathname.startsWith('/create_profile')) {
    return NextResponse.next();
  }

  // 2. CHECK: If there is no cookie and the user tries to access a protected page
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 3. KEY FILTER: Here we tell the middleware exactly what to inspect and what to ignore
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes (_next/static, _next/image)
     * - static files (favicon.ico, images from the public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};