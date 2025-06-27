// middleware.ts
import { createSupabaseMiddlewareClient } from '@/lib/db/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { createLogger } from "@/lib/logger";

const logger = createLogger({
  prefix: 'middleware',
  context: { app: 'futurama-community' }
});

const tokenStorageKey = process.env.SUPABASE_STORAGE_KEY || 'sb-futurama-auth-token-storage-key';

export async function middleware(request: NextRequest) {
  // Don't process certain paths that don't need auth or to reduce duplicates
  if (
    // Skip Chrome devtools requests
    request.nextUrl.pathname.includes('appspecific/com.chrome.devtools') ||
    // Skip favicon and common browser automatic requests
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }
  
  // Track request to detect duplicates
  const requestPath = request.nextUrl.pathname;
  const now = Date.now();
  
  // Clean up old entries first
  cleanupOldRequests();
  
  // Check if this is a duplicate request (same path within 1 second)
  if (recentRequests.has(requestPath)) {
    const data = recentRequests.get(requestPath)!;
    data.count++;
    
    // If this is a very frequent repeat, log it as a potential issue
    if (data.count > 2 && now - data.timestamp < 1000) {
      logger.warn(`Potential duplicate middleware call [#${data.count}]`, {
        path: requestPath,
        timeSinceFirst: now - data.timestamp + 'ms',
      });
    }
    
    // Update timestamp
    data.timestamp = now;
  } else {
    // First time seeing this path recently
    recentRequests.set(requestPath, { timestamp: now, count: 1 });
    
    // Add a debug log for the first occurrence
    logger.debug(`Middleware handling request`, { 
      path: requestPath,
      method: request.method,
      referrer: request.headers.get('referer') || 'none',
    });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const publicPaths = ['/', '/community', '/about', '/faq'];
  const authRoutes = ['/auth/callback', '/auth/verify-email'];
  const protectedRoutes = ['/profile', '/settings', '/plots/purchase', '/plots/customize', '/admin'];
  
  const isAuthRoute = authRoutes.some(route => requestPath.startsWith(route));
  const isPublicRoute = publicPaths.some(route => requestPath === route);
  const isProtectedRoute = protectedRoutes.some(route => requestPath.startsWith(route));
  
  if (isPublicRoute || isAuthRoute) {
    return response;
  }

  const supabase = await createSupabaseMiddlewareClient(request, response, {
    cookieName: tokenStorageKey,
    debug: process.env.NODE_ENV === 'development',
  });

  // supabase.auth.getSession() will automatically refresh the session cookie if needed.
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed

  if (userError) {
    // Log the error, but avoid deleting the cookie on every type of error.
    // The Supabase client is responsible for managing the cookie's validity.
    // Transient errors shouldn't necessarily lead to an immediate logout by clearing the cookie here.
    logger.warn("Middleware: Error during supabase.auth.getUser()", { 
        error: userError.message, 
        path: request.nextUrl.pathname 
    });
    
    // Check for specific user-related auth errors that indicate the session is irreparably invalid
    const errorMsg = userError.message?.toLowerCase() || '';
    const isUserInvalidError = 
      errorMsg.includes('user from sub claim') || 
      errorMsg.includes('does not exist') ||
      errorMsg.includes('jwt is invalid') ||
      errorMsg.includes('invalid token') ||
      errorMsg.includes('invalid session');
      
    if (isUserInvalidError) {
      logger.warn("Middleware: Detected invalid JWT user token. Clearing auth cookies.", {
        error: userError.message,
        path: request.nextUrl.pathname
      });
      
      // Always clear the auth cookie for these serious authentication errors
      response.cookies.delete({ name: tokenStorageKey, path: '/' });
      
      if (isProtectedRoute) {
        // For protected routes, redirect to login
        return NextResponse.redirect(new URL(
          `/?auth=login&error=auth&errorCode=invalid_session&returnTo=${encodeURIComponent(request.nextUrl.pathname)}`, 
          request.url
        ));
      }
      
      // For non-protected routes with auth errors, just continue with the cleared cookie
      // The client-side AuthErrorBoundary will detect issues with the session and show appropriate UI
    }
  }

  // If not authenticated (no session) and trying to access a protected route
  if (!user && isProtectedRoute) {
    logger.info(`Middleware: No session for protected route '${request.nextUrl.pathname}'. Redirecting to login trigger.`, { userId: null });
    // It's generally better to let the Supabase client manage cookie removal (e.g., on sign-out).
    // Avoid manual deletion here unless you are certain the userError indicates an irrevocably invalid token.
    // response.cookies.delete({ name: tokenStorageKey, path: '/' }); // Consider removing or making this conditional on specific errors.
    return NextResponse.redirect(new URL(`/?auth=login&returnTo=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }

  // Admin route protection
  if (requestPath.startsWith('/admin')) {
    if (!user) { // Double-check session specifically for admin routes if not caught by isProtectedRoute
        logger.info(`Middleware: No session for admin route '${requestPath}'. Redirecting to login trigger.`, { userId: null });
        return NextResponse.redirect(new URL(`/?auth=login&returnTo=${encodeURIComponent(requestPath)}`, request.url));
    }
    // Check if user has admin role
    const isAdmin = user?.app_metadata?.role === 'admin'; // As per your existing logic
    
    if (!isAdmin) {
      logger.warn("Middleware: Unauthorized admin access attempt", { 
        userId: user.id,
        path: requestPath
      });
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }
  }

  return response;
}

// Keep track of recent request paths to detect and log potential duplicate middleware calls
const recentRequests = new Map<string, { timestamp: number, count: number }>();

// Helper to clean up old request entries (older than 2 seconds)
function cleanupOldRequests() {
  const now = Date.now();
  for (const [path, data] of recentRequests.entries()) {
    if (now - data.timestamp > 2000) {
      recentRequests.delete(path);
    }
  }
}

// Update middleware config to exclude more static assets and unnecessary paths
export const config = {
  matcher: [
    // Only match routes that actually need middleware processing:
    // 1. Exclude all static assets and files
    // 2. Exclude API routes that don't need auth checks
    // 3. Include only routes that need auth verification or specific handling
    '/((?!api/public|_next/static|_next/image|_next/webpack|favicon.ico|assets/|robots.txt|sitemap.xml|.\\.(?:svg|png|jpg|jpeg|gif|webp|gltf|glb|obj|mtl)$).*)',
  ],
};