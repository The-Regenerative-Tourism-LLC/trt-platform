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

  console.log("[middleware]", pathname, {
    isLoggedIn,
    hasRole,
    roles: userRoles,
    needsRoleSelection_session: session?.user?.needsRoleSelection,
    needsRoleSelection_derived: needsRoleSelection,
  });

  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isTravelerRoute = pathname.startsWith("/traveler");
  const isSelectRoleRoute = pathname === "/select-role";
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isRootRoute = pathname === "/";

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  // Protected routes require a session. Redirect to login and preserve the
  // intended destination so the user lands there after signing in.
  if (!isLoggedIn) {
    if (isAdminRoute || isOperatorRoute || isTravelerRoute || isSelectRoleRoute) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Authenticated — role not yet assigned ────────────────────────────────────
  // New users that completed sign-up but haven't selected a role yet must finish
  // role selection before accessing any other matched route. This includes the
  // root and auth pages — the needsRoleSelection check must not fall through to
  // the isRootRoute/isAuthRoute block below (which would route to /select-role
  // via getDashboardUrl anyway, but only for role-scoped routes — not for / or
  // /login/signup which return NextResponse.next() in the old logic).
  if (needsRoleSelection && !isSelectRoleRoute) {
    return NextResponse.redirect(new URL("/select-role", req.url));
  }

  // ── Authenticated — role already assigned, visiting /select-role ─────────────
  // A user who completed role selection should not be able to reach /select-role
  // again. Without this guard they would land on /select-role with
  // needsRoleSelection: false, see "Role already assigned" on retry, and have
  // no way to navigate out. Send them directly to their dashboard.
  if (isSelectRoleRoute && !needsRoleSelection) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Authenticated — redirect away from auth/marketing pages ─────────────────
  // Once logged in, /login, /signup, and / are no longer meaningful destinations.
  // Send the user directly to their role dashboard.
  if (isAuthRoute || isRootRoute) {
    return NextResponse.redirect(new URL(getDashboardUrl(userRoles), req.url));
  }

  // ── Role enforcement ─────────────────────────────────────────────────────────
  // Admins are granted read access to all role-scoped routes (oversight / support).
  // Any other user trying to access a route outside their role is redirected to
  // their own dashboard.
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
  ],
};
