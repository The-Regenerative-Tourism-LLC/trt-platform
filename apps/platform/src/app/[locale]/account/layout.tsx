/**
 * /account layout
 *
 * Accessible to any authenticated user regardless of role.
 * Authentication is enforced in middleware — by the time this renders,
 * the user is guaranteed to be logged in.
 */

import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login");
  }

  // Map primary role to its dashboard URL for the back-link
  const dashboardUrl =
    session.role === "admin"
      ? "/admin/dashboard"
      : session.role === "operator"
        ? "/operator/dashboard"
        : "/traveler/dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header for account pages */}
      <header className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={dashboardUrl}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to dashboard
          </Link>
          <span className="text-sm font-medium text-foreground">
            {session.email}
          </span>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-8">
          {/* Side nav */}
          <nav className="w-48 shrink-0">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60 mb-3">
              Account
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/account/security"
                  className="block px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="/account/privacy"
                  className="block px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Privacy &amp; Consent
                </Link>
              </li>
            </ul>
          </nav>

          {/* Page content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
