"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function getNavLinks() {
    if (!user) {
      return [
        { href: "/discover", label: "Discover" },
        { href: "/destinations", label: "Destinations" },
        { href: "/methodology", label: "Methodology" },
        { href: "/leaderboard", label: "Impact Record" },
        { href: "/pricing", label: "Pricing" },
      ];
    }

    if (isAdminRoute && isAdmin) {
      return [
        { href: "/admin/dashboard", label: "Overview" },
        { href: "/admin/evidence", label: "Evidence" },
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
      { href: "/leaderboard", label: "Impact Record" },
      { href: "/methodology", label: "Methodology" },
    ];
  }

  const navLinks = getNavLinks();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const initials = getInitials(user?.name ?? user?.email);

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-cream/95 backdrop-blur-xl shadow-sm border-b border-border/40"
            : "bg-cream/80 backdrop-blur-xl",
          mobileOpen && "z-[60]"
        )}
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-14 px-5 md:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 relative z-[60]"
          >
            <Image
              src="/assets/logo-regenerative-tourism-black.svg"
              alt="Green Passport"
              width={120}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!loading && !user && (
              <Button
                className="rounded-lg font-semibold bg-black text-cream hover:bg-black/90 h-10 px-5"
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
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
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
                        <Link
                          href="/traveler/discover"
                          className="cursor-pointer"
                        >
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

            <button
              className="p-2 rounded-full hover:bg-secondary relative z-[60]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Full-screen overlay menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[55] flex mobile-overlay-enter">
          {/* Left panel with nav links */}
          <div className="w-[65%] max-w-[420px] bg-cream flex flex-col justify-between h-full pt-20 pb-8 px-6 md:px-10 mobile-panel-enter">
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block text-[2rem] leading-[1.15] font-bold tracking-tight py-1 transition-opacity",
                    isActive(l.href)
                      ? "text-black"
                      : "text-black/60 hover:text-black active:text-black"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3">
              {user ? (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-black/30">
                    Signed in
                  </p>
                  <p className="text-xs text-black/60 truncate">{user.email}</p>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                    className="text-xs text-black/40 hover:text-black transition-colors mt-1"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Button
                  className="w-full rounded-lg bg-black text-cream hover:bg-black/90 font-semibold h-11"
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

          {/* Right side — blurred backdrop */}
          <div
            className="flex-1 bg-background/60 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
