"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck,
  BarChart3,
  Shield,
  MapPin,
  Search,
  LogOut,
  ChevronDown,
  Building2,
  Compass,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = user?.roles?.includes("admin");
  const isOperator = user?.roles?.includes("operator");
  const isTraveler = user?.roles?.includes("traveler");

  const isAdminRoute = pathname?.startsWith("/admin");
  const isOperatorRoute = pathname?.startsWith("/operator");

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const linkCls = (path: string) =>
    cn(
      "px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
      isActive(path)
        ? "bg-foreground/5 text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    );

  function getNavLinks() {
    if (!user) {
      return [
        { href: "/discover", label: "Discover" },
        { href: "/destinations", label: "Destinations" },
        { href: "/methodology", label: "Methodology" },
        { href: "/leaderboard", label: "Leaderboard" },
        { href: "/pricing", label: "Pricing" },
      ];
    }

    if (isAdminRoute && isAdmin) {
      return [
        { href: "/admin/dashboard", label: "Overview" },
        { href: "/admin/operators", label: "Operators" },
        { href: "/admin/evidence", label: "Evidence" },
        { href: "/admin/territories", label: "Territories" },
      ];
    }

    if (isOperatorRoute && isOperator) {
      return [
        { href: "/discover", label: "Discover" },
        { href: "/destinations", label: "Destinations" },
        { href: "/methodology", label: "Methodology" },
        { href: "/operator/dashboard", label: "Dashboard" },
      ];
    }

    return [
      { href: "/discover", label: "Discover" },
      { href: "/destinations", label: "Destinations" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/methodology", label: "Methodology" },
    ];
  }

  const navLinks = getNavLinks();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const initials = getInitials(user?.name ?? user?.email);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto max-w-7xl flex items-center justify-between h-14 px-5 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
            GP
          </div>
          <span className="hidden sm:inline font-semibold text-sm tracking-tight">
            Green Passport
          </span>
        </Link>

        {/* Desktop nav links — centered */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {!loading && !user && (
            <Button
              size="sm"
              className="rounded-full font-semibold"
              asChild
            >
              <Link href="/login">Join</Link>
            </Button>
          )}

          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold hover:opacity-90 transition-opacity">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.role && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {isOperator ? (
                        <Building2 className="w-3 h-3" />
                      ) : isAdmin ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <Compass className="w-3 h-3" />
                      )}
                      {user.role}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isOperator && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/operator/dashboard"
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Operator Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/operator/evidence"
                        className="cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Evidence
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {isTraveler && !isOperator && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/traveler/dashboard"
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/traveler/discover" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Impact
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/dashboard"
                        className="cursor-pointer"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/discover" className="cursor-pointer">
                    <Search className="w-4 h-4 mr-2" />
                    Discover
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/destinations" className="cursor-pointer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Destinations
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background">
          <div className="container mx-auto px-5 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-xl text-sm transition-colors",
                  isActive(l.href)
                    ? "bg-foreground/[0.06] text-foreground font-medium"
                    : "text-muted-foreground active:bg-foreground/[0.04]"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <div className="mt-2 pt-3 border-t border-border/50">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-semibold">
                      {initials}
                    </div>
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </span>
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Button
                  className="w-full rounded-full font-semibold h-10"
                  asChild
                >
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                  >
                    Join
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
