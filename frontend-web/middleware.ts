/**
 * Next.js Middleware — protection des routes privées.
 *
 * Architecture :
 *   L'access token est en mémoire (Zustand) → inaccessible côté serveur/middleware.
 *   Le middleware vérifie la présence du cookie httpOnly "refresh_token".
 *   Si absent → redirect vers /login.
 *
 *   Limitation : la présence du cookie ne garantit pas sa validité
 *   (peut être expiré). La vérification complète se fait au premier
 *   appel API (intercepteur Axios → 401 → refresh ou redirect).
 *
 *   Alternative plus sécurisée : vérifier la signature JWT du refresh token
 *   dans le middleware avec le JWT_REFRESH_SECRET en env var.
 *   Non implémenté ici pour garder le middleware léger (Edge Runtime).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessibles sans authentification
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/auth/magic',
  '/auth/github-callback',
  '/auth/2fa',
  '/auth/create-password',
  '/auth/pin',
  '/auth/setup-pin',
  '/auth/locked',
  '/',
  '/pricing',
  '/formation',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Autoriser les assets Next.js, API routes et fichiers statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Autoriser les routes publiques
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '?'),
  );
  if (isPublic) return NextResponse.next();

  // Vérifier la présence du cookie de refresh
  const hasRefreshCookie = request.cookies.has('refresh_token');

  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher : toutes les routes sauf les assets statiques
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
