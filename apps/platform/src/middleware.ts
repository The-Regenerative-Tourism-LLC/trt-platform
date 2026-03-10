import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!session?.user?.id;
  const needsRoleSelection = session?.user?.needsRoleSelection ?? false;
  const userRoles = session?.user?.roles ?? [];

  const isOperatorRoute = pathname.startsWith("/operator");
  const isTravelerRoute = pathname.startsWith("/traveler");
  const isAdminRoute = pathname.startsWith("/admin");
  const isSelectRoleRoute = pathname === "/select-role";
  const isLoginRoute = pathname === "/login";
  const isSignupRoute = pathname === "/signup";
  const isRootRoute = pathname === "/";

  // Redirect authenticated users away from auth pages → their dashboard
  if (isLoggedIn && (isLoginRoute || isSignupRoute || isRootRoute)) {
    if (needsRoleSelection) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }
    const primaryRole = userRoles[0];
    if (primaryRole === "operator") {
      return NextResponse.redirect(new URL("/operator/dashboard", req.url));
    }
    if (primaryRole === "traveler") {
      return NextResponse.redirect(new URL("/traveler/dashboard", req.url));
    }
  }

  // Unauthenticated users cannot access protected routes
  if (!isLoggedIn) {
    if (
      isOperatorRoute ||
      isTravelerRoute ||
      isAdminRoute ||
      isSelectRoleRoute
    ) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated but role not yet selected → force role selection
  if (needsRoleSelection && !isSelectRoleRoute) {
    if (isOperatorRoute || isTravelerRoute || isAdminRoute) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }
    return NextResponse.next();
  }

  // Wrong-role access → redirect to the user's correct dashboard
  if (
    isOperatorRoute &&
    !userRoles.includes("operator") &&
    !userRoles.includes("admin")
  ) {
    return NextResponse.redirect(new URL("/traveler/dashboard", req.url));
  }

  if (
    isTravelerRoute &&
    !userRoles.includes("traveler") &&
    !userRoles.includes("admin")
  ) {
    return NextResponse.redirect(new URL("/operator/dashboard", req.url));
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
