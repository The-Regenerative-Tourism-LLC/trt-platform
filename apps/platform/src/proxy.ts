import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|pt|es)(?=\/|$)/, "") || "/";
}

function detectLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|pt|es)(?=\/|$)/);
  return match?.[1] ?? "en";
}

// English paths have no URL prefix with localePrefix: "as-needed".
// The [locale] App Router segment is populated by rewriting /… → /en/….
//
// Railway externalizes NextResponse.rewrite() as a real HTTP request through
// its load balancer, so the proxy runs twice:
//   1. /login  → Part A: rewrite to /en/login  (sets x-en-rewrite: 1)
//   2. /en/login arrives with x-en-rewrite: 1 → Part B: serve directly
//
// The marker header distinguishes Railway's internal re-request (serve)
// from a user navigating directly to /en/… (redirect to clean URL).
const REWRITE_MARKER = "x-en-rewrite";

function handleLocaleRouting(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // Part B — /en/… arrived
  if (/^\/(en)(\/|$)/.test(pathname)) {
    if (req.headers.get(REWRITE_MARKER) === "1") {
      // Came from our own Part A rewrite — serve directly
      const headers = new Headers(req.headers);
      headers.set("X-NEXT-INTL-LOCALE", "en");
      return NextResponse.next({ request: { headers } });
    }
    // Direct browser navigation to /en/… — redirect to the clean URL
    const clean = pathname.replace(/^\/en/, "") || "/";
    return NextResponse.redirect(new URL(clean, req.url));
  }

  // /pt/… and /es/… — next-intl handles locale header + NextResponse.next()
  if (/^\/(pt|es)(\/|$)/.test(pathname)) {
    return handleI18nRouting(req) as NextResponse;
  }

  // Part A — no prefix → English → rewrite to /en/… with marker header
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  const headers = new Headers(req.headers);
  headers.set("X-NEXT-INTL-LOCALE", "en");
  headers.set(REWRITE_MARKER, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

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

  console.log("[proxy]", pathname, {
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
    return handleLocaleRouting(req);
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

  return handleLocaleRouting(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|sentry-tunnel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
