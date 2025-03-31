import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Reserved paths that should not be used as dynamic route parameters
const RESERVED_PATHS = [
  'api',
  'client',
  'provider',
  'admin',
  '_next',
  'next',
  'static',
  'auth',
  'socket',
  'public',
  'images',
  'assets',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dynamic route pattern is /:location/:service
  const segments = pathname.split('/').filter(Boolean);
  
  // Only check paths with exactly 2 segments that might be dynamic routes
  if (segments.length === 2) {
    const [location, service] = segments;

    // Check if any segment is a reserved path
    if (RESERVED_PATHS.includes(location) || RESERVED_PATHS.includes(service)) {
      console.log(`Blocked access to reserved path: ${pathname}`);
      
      // Redirect to 404 page
      return NextResponse.redirect(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to only run on specific paths
export const config = {
  matcher: [
    // Match all paths except those starting with these prefixes
    '/((?!_next/|api/|client/|provider/|admin/|auth/|static/|public/|images/|assets/).*)',
  ],
}; 