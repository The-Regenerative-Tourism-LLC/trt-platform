import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Strip locale prefix — English is the default with no prefix.
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|pt|es)(?=\/|$)/, "") || "/";
}

// Detect locale from pathname.
function detectLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|pt|es)(?=\/|$)/);
  return match?.[1] ?? "en";
}

// Wrapper around next-intl's middleware that handles English routing correctly
// in Railway's proxy environment.
//
// Root cause (confirmed by logs): in Railway, NextResponse.rewrite() does NOT
// stay internal — it triggers an actual external HTTP request back through the
// load balancer. This means the middleware runs a SECOND time for the rewrite
// destination. With next-intl's default behaviour this creates an infinite loop:
//
//   1. Request "/"     → middleware rewrites to "/en"  (external HTTP GET)
//   2. Request "/en"   → next-intl redirects /en → "/" (unnecessary prefix)
//   3. Browser follows redirect to "/"  →  back to step 1  →  loop
//
// Fix — two-part:
//   A. English paths WITHOUT a locale prefix (/, /signup, /login, …):
//      rewrite to /en/… so the [locale] App Router segment gets a value.
//      Use req.nextUrl.clone() (NextURL) rather than new URL(…, req.url) so
//      that Next.js always resolves it as an internal route.
//
//   B. /en/… paths that arrive here as the SECOND request caused by the rewrite
//      above: serve them directly with NextResponse.next() instead of letting
//      next-intl redirect back to "/" — that redirect is what causes the loop.
//
// /pt/… and /es/… paths are unaffected — next-intl already returns
// NextResponse.next() for them (no rewrite needed, locale is in the URL).
function handleI18nRoutingFixed(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // Part B: /en or /en/… — serve English content directly, do NOT redirect to /
  if (/^\/(en)(\/|$)/.test(pathname)) {
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", "en");
    return NextResponse.next({ request: { headers } });
  }

  // Part A: no locale prefix → English default → rewrite to /en/…
  if (!/^\/(pt|es)(\/|$)/.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", "en");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // /pt/… and /es/… — next-intl handles these (NextResponse.next() with header)
  return handleI18nRouting(req) as NextResponse;
}

// Prefix a path with locale (English has no prefix).
function withLocale(path: string, locale: string): string {
  if (locale === "en") return path;
  return `/${locale}${path}`;
}

function getDashboardUrl(roles: string[], locale: string): string {
  if (roles.includes("admin")) return withLocale("/admin/dashboard", locale);
  if (roles.includes("operator"))
    return withLocale("/operator/dashboard", locale);
  if (roles.includes("traveler"))
    return withLocale("/traveler/dashboard", locale);
  return withLocale("/select-role", locale);
}

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const locale = detectLocale(pathname);
  const cleanPath = stripLocale(pathname);

  const isLoggedIn = !!session?.user?.id;
  const userRoles: string[] = session?.user?.roles ?? [];
  const hasRole = userRoles.length > 0;
  const needsRoleSelection = !hasRole;
  const emailVerified: boolean = session?.user?.isEmailVerified ?? true;
  const needsTermsAcceptance: boolean =
    session?.user?.needsTermsAcceptance ?? false;

  console.log("[middleware]", pathname, {
    locale,
    cleanPath,
    isLoggedIn,
    hasRole,
    roles: userRoles,
    isEmailVerified: emailVerified,
    needsRoleSelection_session: session?.user?.needsRoleSelection,
    needsRoleSelection_derived: needsRoleSelection,
  });

  const isAdminRoute = cleanPath.startsWith("/admin");
  const isOperatorRoute = cleanPath.startsWith("/operator");
  const isTravelerRoute =
    cleanPath.startsWith("/traveler") && cleanPath !== "/traveler/waitlist";
  const isAccountRoute = cleanPath.startsWith("/account");
  const isSelectRoleRoute = cleanPath === "/select-role";
  const isAcceptTermsRoute = cleanPath === "/accept-terms";
  const isAuthRoute = cleanPath === "/login" || cleanPath === "/signup";

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!isLoggedIn) {
    if (
      isAdminRoute ||
      isOperatorRoute ||
      isTravelerRoute ||
      isSelectRoleRoute ||
      isAcceptTermsRoute ||
      isAccountRoute
    ) {
      const loginUrl = new URL(withLocale("/login", locale), req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return handleI18nRoutingFixed(req);
  }

  // ── Role not yet assigned → /select-role ────────────────────────────────
  if (needsRoleSelection && !isSelectRoleRoute) {
    return NextResponse.redirect(
      new URL(withLocale("/select-role", locale), req.url)
    );
  }

  if (isSelectRoleRoute && !needsRoleSelection) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  // ── Terms not yet accepted → /accept-terms ───────────────────────────────
  if (
    hasRole &&
    needsTermsAcceptance &&
    !isAcceptTermsRoute &&
    (isAdminRoute || isOperatorRoute || isTravelerRoute || isAccountRoute)
  ) {
    return NextResponse.redirect(
      new URL(withLocale("/accept-terms", locale), req.url)
    );
  }

  if (isAcceptTermsRoute && !needsTermsAcceptance) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  // ── Email verification gate ──────────────────────────────────────────────
  const isVerifyEmailRoute = cleanPath === "/verify-email";
  if (!emailVerified && !isVerifyEmailRoute) {
    return NextResponse.redirect(
      new URL(withLocale("/verify-email", locale), req.url)
    );
  }

  // ── Redirect away from auth pages once logged in ─────────────────────────
  if (isAuthRoute) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  // ── Role enforcement ─────────────────────────────────────────────────────
  const isAdmin = userRoles.includes("admin");

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  if (isOperatorRoute && !userRoles.includes("operator") && !isAdmin) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  if (isTravelerRoute && !userRoles.includes("traveler") && !isAdmin) {
    return NextResponse.redirect(
      new URL(getDashboardUrl(userRoles, locale), req.url)
    );
  }

  return handleI18nRoutingFixed(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|sentry-tunnel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
