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
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header for account pages */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={dashboardUrl}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
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
          <span className="text-sm font-medium text-gray-700">
            {session.email}
          </span>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-8">
          {/* Side nav */}
          <nav className="w-48 shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Account
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/account/security"
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Security
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
