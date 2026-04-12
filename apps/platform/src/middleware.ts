import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Returns the primary dashboard URL for a given set of roles.
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
  const emailVerified: boolean = session?.user?.isEmailVerified ?? true;
  const needsTermsAcceptance: boolean =
    session?.user?.needsTermsAcceptance ?? false;

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
  const isTravelerRoute =
    pathname.startsWith("/traveler") && pathname !== "/traveler/waitlist";
  const isAccountRoute = pathname.startsWith("/account");
  const isSelectRoleRoute = pathname === "/select-role";
  const isAcceptTermsRoute = pathname === "/accept-terms";
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isRootRoute = pathname === "/";

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
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Role not yet assigned → /select-role (terms captured there) ──────────
  if (needsRoleSelection && !isSelectRoleRoute) {
    return NextResponse.redirect(new URL("/select-role", req.url));
  }

  if (isSelectRoleRoute && !needsRoleSelection) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Terms not yet accepted (established users) → /accept-terms ───────────
  // Only enforced once the user has a role. New users handle terms in /select-role.
  if (
    hasRole &&
    needsTermsAcceptance &&
    !isAcceptTermsRoute &&
    (isAdminRoute || isOperatorRoute || isTravelerRoute || isAccountRoute)
  ) {
    return NextResponse.redirect(new URL("/accept-terms", req.url));
  }

  if (isAcceptTermsRoute && !needsTermsAcceptance) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Email verification gate ──────────────────────────────────────────────
  if (
    !emailVerified &&
    (isAdminRoute || isOperatorRoute || isTravelerRoute || isAccountRoute)
  ) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }

  // ── Redirect away from auth/root pages once logged in ────────────────────
  if (isAuthRoute || isRootRoute) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Role enforcement ─────────────────────────────────────────────────────
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
    "/accept-terms",
    "/operator/:path*",
    "/traveler/:path*",
    "/admin/:path*",
    "/account/:path*",
  ],
};
