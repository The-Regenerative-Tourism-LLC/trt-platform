"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  FileCheck,
  Shield,
  MapPin,
  Search,
  LogOut,
  Building2,
  Compass,
  User,
  KeyRound,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { withLocalePath } from "@/i18n/pathname";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
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

function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {active && (
        <span className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "type-m whitespace-nowrap no-underline",
          "transition-colors duration-[var(--duration-fast)]",
          active ? "text-primary" : "text-foreground hover:text-primary"
        )}
      >
        {children}
      </Link>
    </div>
  );
}

export function Navbar() {
  const tNav = useTranslations("nav");
  const tPublic = useTranslations("public.shared");
  const locale = useLocale();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const openSolutions = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSolutionsOpen(true);
  };
  const closeSolutions = () => {
    closeTimer.current = setTimeout(() => setSolutionsOpen(false), 120);
  };

  const withLocale = (path: string) => withLocalePath(path, locale);

  const cleanPathname = pathname?.replace(/^\/(pt|es)(?=\/|$)/, "") || "/";
  const isAdminRoute = cleanPathname.startsWith("/admin");
  const isOperatorRoute = cleanPathname.startsWith("/operator");

  const isActive = (path: string) =>
    cleanPathname === path || cleanPathname?.startsWith(path + "/");

  const isAdmin = user?.roles?.includes("admin");
  const isOperator = user?.roles?.includes("operator");
  const isTraveler = user?.roles?.includes("traveler");

  const isSolutionsActive = ["/destinations", "/leaderboard", "/journal", "/pricing"].some(
    (p) => isActive(p)
  );

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function getNavLinks() {
    if (!user) {
      return [
        { href: withLocale("/discover"), label: tPublic("discover") },
        { href: withLocale("/destinations"), label: tNav("destinations") },
        { href: withLocale("/methodology"), label: tNav("methodology") },
        { href: withLocale("/leaderboard"), label: tPublic("impactRecord") },
        { href: withLocale("/journal"), label: tPublic("journal") },
        { href: withLocale("/pricing"), label: tNav("pricing") },
      ];
    }
    if (isAdminRoute && isAdmin) {
      return [
        { href: withLocale("/admin/dashboard"), label: tPublic("overview") },
        { href: withLocale("/admin/evidence"), label: tPublic("evidence") },
      ];
    }
    if (isOperatorRoute && isOperator) {
      return [
        { href: withLocale("/discover"), label: tPublic("discover") },
        { href: withLocale("/destinations"), label: tNav("destinations") },
        { href: withLocale("/methodology"), label: tNav("methodology") },
        { href: withLocale("/leaderboard"), label: tPublic("impactRecord") },
        { href: withLocale("/pricing"), label: tNav("pricing") },
        { href: withLocale("/operator/dashboard"), label: tPublic("dashboard") },
      ];
    }
    return [
      { href: withLocale("/discover"), label: tPublic("discover") },
      { href: withLocale("/destinations"), label: tNav("destinations") },
      { href: withLocale("/leaderboard"), label: tPublic("impactRecord") },
      { href: withLocale("/methodology"), label: tNav("methodology") },
      { href: withLocale("/journal"), label: tPublic("journal") },
      { href: withLocale("/pricing"), label: tNav("pricing") },
    ];
  }

  const navLinks = getNavLinks();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const initials = getInitials(user?.name ?? user?.email);


  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 bg-background relative",
          mobileOpen && "z-[60]"
        )}
      >
        {/* Top primary accent line */}
        <div className="h-1 bg-primary" />

        {/* Main navbar row: logo | center links | actions */}
        <div className="wrapper-header ">
          <div className="container-section flex items-center justify-between md:gap-6">

          {/* Logo */}
          <Link
            href={withLocale("/")}
            className="flex items-center gap-2 shrink-0 relative z-[60]"
          >
            <Image
              src="/assets/logo-regenerative-tourism-black.svg"
              alt="The Regenerative Tourism"
              width={120}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          {/* Desktop center nav */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {!user ? (
              <>
                {/* Solutions — hover megamenu trigger */}
                <div
                  className="relative flex flex-col items-center"
                  onMouseEnter={openSolutions}
                  onMouseLeave={closeSolutions}
                >
                  {isSolutionsActive && (
                    <span className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  <button
                    className={cn(
                      "flex items-center gap-1 type-m whitespace-nowrap no-underline",
                      "transition-colors duration-[var(--duration-fast)]",
                      isSolutionsActive || solutionsOpen ? "text-primary" : "text-foreground hover:text-primary"
                    )}
                  >
                    {tNav("solutions")}
                    <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-[var(--duration-fast)]", solutionsOpen && "rotate-180")} />
                  </button>
                </div>

                <NavLink href={withLocale("/discover")} active={isActive("/discover")}>
                  {tPublic("discover")}
                </NavLink>

                <NavLink href={withLocale("/methodology")} active={isActive("/methodology")}>
                  {tNav("methodology")}
                </NavLink>
              </>
            ) : (
              navLinks.slice(0, 3).map((link) => (
                <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                  {link.label}
                </NavLink>
              ))
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end gap-4">
            {!loading && !user && (
              <>
                <Link
                  href={withLocale("/signup")}
                  className="btn btn-primary hidden md:inline-flex"
                >
                  {tNav("beGenerant")}
                </Link>
                <Link
                  href={withLocale("/login")}
                  className={cn(
                    "hidden md:block type-m no-underline",
                    "transition-colors duration-[var(--duration-fast)]",
                    "text-foreground hover:text-primary"
                  )}
                >
                  {tNav("login")}
                </Link>
              </>
            )}

            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold transition-colors hover:bg-dark hover:text-dark-foreground">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-black">{user.email}</p>
                    {user.role && (
                      <span className="inline-flex items-center gap-1 mt-1 type-label text-black">
                        {isOperator ? <Building2 className="w-3 h-3" /> : isAdmin ? <Shield className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                        {user.role}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {isOperator && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={withLocale("/operator/dashboard")} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />{tPublic("operatorDashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={withLocale("/operator/evidence")} className="cursor-pointer">
                          <FileCheck className="w-4 h-4 mr-2" />{tPublic("evidence")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isTraveler && !isOperator && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={withLocale("/traveler/dashboard")} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />{tPublic("dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={withLocale("/traveler/discover")} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />{tPublic("myImpact")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={withLocale("/admin/dashboard")} className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />{tPublic("adminDashboard")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href={withLocale("/discover")} className="cursor-pointer">
                      <Search className="w-4 h-4 mr-2" />{tPublic("discover")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={withLocale("/destinations")} className="cursor-pointer">
                      <MapPin className="w-4 h-4 mr-2" />{tNav("destinations")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />{tPublic("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <LocaleSwitcher className="hidden md:flex" />

            <button
              className="p-2 md:hidden transition-colors hover:bg-muted hover:text-black relative z-[60]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? tPublic("closeMenu") : tPublic("openMenu")}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          </div>

        </div>

        {/* Bottom dashed separator */}
        <hr className="divider-dashed" />

        {/* Solutions megamenu panel */}
        {solutionsOpen && !user && (
          <div
            className="absolute left-0 right-0 top-full bg-background border-b border-border shadow-sm z-10 hidden md:block"
            onMouseEnter={openSolutions}
            onMouseLeave={closeSolutions}
          >
            <div className="container-page py-5">
              <p className="type-label text-primary mb-4">WHO IS THIS FOR</p>
              <div className="grid grid-cols-3 gap-3 pb-2">
                {/* For Operators */}
                <Link
                  href={withLocale("/signup")}
                  className="relative overflow-hidden rounded-lg border border-border p-5 flex flex-col gap-4 no-underline hover:border-accent transition-colors"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="type-m font-semibold text-foreground">For Operators</p>
                    <p className="type-s text-black mt-2">Verify your footprint, local integration, and regenerative contribution.</p>
                  </div>
                </Link>

                {/* For Travelers */}
                <Link
                  href={withLocale("/traveler/waitlist")}
                  className="relative overflow-hidden rounded-lg border border-border p-5 flex flex-col gap-4 no-underline hover:border-primary transition-colors"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="type-m font-semibold text-foreground">For Travelers</p>
                    <p className="type-s text-black mt-2">Know what your trip supports — and build a record of the impact you&apos;ve made over time.</p>
                  </div>
                </Link>

                {/* For Destinations */}
                <div className="relative overflow-hidden rounded-lg border border-border p-5 flex flex-col gap-4 cursor-default">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-surface" />
                  <span className="badge badge-surface absolute top-3 right-3">Soon</span>
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-surface-foreground" />
                  </div>
                  <div>
                    <p className="type-m font-semibold text-foreground">For Destinations</p>
                    <p className="type-s text-black mt-2">Live data from the operators and travelers inside your territory.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[55] flex mobile-overlay-enter">
          <div className="w-[65%] max-w-[420px] bg-background flex flex-col justify-between h-full pt-20 pb-8 px-6 md:px-10 mobile-panel-enter border-r border-border">
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block type-xl font-medium py-1 transition-colors",
                    isActive(l.href) ? "text-primary" : "text-foreground hover:text-primary"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3">
              <LocaleSwitcher className="md:hidden" />

              {user ? (
                <div className="space-y-1">
                  <p className="type-label text-black">{tPublic("signedIn")}</p>
                  <p className="type-s text-foreground truncate">{user.email}</p>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="type-s text-black hover:text-foreground transition-colors mt-1"
                  >
                    {tPublic("signOut")}
                  </button>
                </div>
              ) : (
                <Link
                  href={withLocale("/signup")}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-dark w-full"
                >
                  {tPublic("join")}
                </Link>
              )}
            </div>
          </div>

          <div
            className="flex-1 bg-dark"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
