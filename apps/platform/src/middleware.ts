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

// Wrapper around next-intl's middleware that fixes English-locale paths.
//
// For /pt/... and /es/..., handleI18nRouting returns NextResponse.next() —
// just a pass-through with the locale header. Works fine everywhere.
//
// For English paths (no locale prefix: /, /signup, /login, /operator/...,
// etc.), handleI18nRouting builds NextResponse.rewrite(new URL("/en/...",
// req.url)).  req.url in Railway's proxy environment carries the *external*
// hostname (e.g. trt-platform-staging.up.railway.app). Next.js compares the
// rewrite destination against the server's *internal* address (localhost:PORT)
// and, finding a different host, may treat it as an external HTTP fetch —
// causing a deadlock where the server waits on itself indefinitely.
//
// Fix: intercept all English (no-prefix) paths and perform the rewrite using
// req.nextUrl.clone(), which is a NextURL object that Next.js always resolves
// as an internal route regardless of hostname.
function handleI18nRoutingFixed(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const hasLocalePrefix = /^\/(en|pt|es)(\/|$)/.test(pathname);

  if (!hasLocalePrefix) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    const headers = new Headers(req.headers);
    headers.set("X-NEXT-INTL-LOCALE", "en");
    return NextResponse.rewrite(url, { request: { headers } });
  }

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
