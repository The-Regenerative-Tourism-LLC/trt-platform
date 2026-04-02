import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Returns the primary dashboard URL for a given set of roles.
 * Used to redirect users away from wrong-role routes and public/auth pages.
 * Admin takes precedence; institution_partner has no dashboard yet so falls
 * back to /select-role as a safe default.
 */
function getDashboardUrl(roles: string[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("operator")) return "/operator/dashboard";
  if (roles.includes("traveler")) return "/traveler/dashboard";
  return "/select-role";
}

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!session?.user?.id;
  const userRoles: string[] = session?.user?.roles ?? [];
  const hasRole = userRoles.length > 0;
  const needsRoleSelection = !hasRole;

  // isEmailVerified defaults true: existing sessions (pre-field) must not be locked out.
  const emailVerified: boolean = session?.user?.isEmailVerified ?? true;

  console.log("[middleware]", pathname, {
    isLoggedIn,
    hasRole,
    roles: userRoles,
    isEmailVerified: emailVerified,
    needsRoleSelection_session: session?.user?.needsRoleSelection,
    needsRoleSelection_derived: needsRoleSelection,
  });

  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isTravelerRoute = pathname.startsWith("/traveler");
  const isAccountRoute = pathname.startsWith("/account");
  const isSelectRoleRoute = pathname === "/select-role";
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isRootRoute = pathname === "/";

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  // Protected routes require a session. Redirect to login and preserve the
  // intended destination so the user lands there after signing in.
  if (!isLoggedIn) {
    if (
      isAdminRoute ||
      isOperatorRoute ||
      isTravelerRoute ||
      isSelectRoleRoute ||
      isAccountRoute
    ) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Authenticated — role not yet assigned ────────────────────────────────────
  // New users that completed sign-up but haven't selected a role yet must finish
  // role selection before accessing any other matched route.
  if (needsRoleSelection && !isSelectRoleRoute) {
    return NextResponse.redirect(new URL("/select-role", req.url));
  }

  // ── Authenticated — role already assigned, visiting /select-role ─────────────
  if (isSelectRoleRoute && !needsRoleSelection) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Email verification gate ──────────────────────────────────────────────────
  // Credentials users who have not verified their email may not access any
  // dashboard or account route. They are redirected to /verify-email.
  // Google OAuth users arrive with emailVerified already set by NextAuth — they
  // always pass this check.
  // /account/security is blocked too — prevents a workaround via settings.
  if (
    !emailVerified &&
    (isAdminRoute || isOperatorRoute || isTravelerRoute || isAccountRoute)
  ) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }

  // ── Authenticated — redirect away from auth/marketing pages ─────────────────
  // Once logged in, /login, /signup, and / are no longer meaningful destinations.
  if (isAuthRoute || isRootRoute) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Role enforcement ─────────────────────────────────────────────────────────
  // Admins can access all role-scoped routes (oversight / support).
  // Account routes (/account/*) are accessible to any authenticated user.
  const isAdmin = userRoles.includes("admin");

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  if (isOperatorRoute && !userRoles.includes("operator") && !isAdmin) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  if (isTravelerRoute && !userRoles.includes("traveler") && !isAdmin) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/select-role",
    "/operator/:path*",
    "/traveler/:path*",
    "/admin/:path*",
    "/account/:path*",
  ],
};
