"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck,
  Shield,
  MapPin,
  Search,
  LogOut,
  Building2,
  Compass,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export function Navbar() {
  const tNav = useTranslations("nav");
  const tPublic = useTranslations("public.shared");
  const locale = useLocale();
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
  const withLocale = (path: string) => withLocalePath(path, locale);

  const cleanPathname = pathname?.replace(/^\/(pt|es)(?=\/|$)/, "") || "/";
  const isAdminRoute = cleanPathname.startsWith("/admin");
  const isOperatorRoute = cleanPathname.startsWith("/operator");

  const isActive = (path: string) =>
    cleanPathname === path || cleanPathname?.startsWith(path + "/");

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
          "sticky top-0 z-50 bg-background transition-all duration-300",
          scrolled ? "border-b border-border" : "",
          mobileOpen && "z-[60]"
        )}
      >
        <div className="container mx-auto max-w-page flex items-center justify-between h-14 px-5 md:px-6">
          <Link
            href={withLocale("/")}
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

          <div className="flex items-center gap-2">
            {!loading && !user && (
              <Button variant="dark" size="sm" asChild>
                <Link href={withLocale("/signup")}>{tPublic("join")}</Link>
              </Button>
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
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.role && (
                      <span className="inline-flex items-center gap-1 mt-1 type-label text-muted-foreground">
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
              className="p-2 rounded-full transition-colors hover:bg-muted hover:text-muted-foreground relative z-[60]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? tPublic("closeMenu") : tPublic("openMenu")}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
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
                    "block type-h3 py-1 transition-colors",
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
                  <p className="type-label text-muted-foreground">{tPublic("signedIn")}</p>
                  <p className="type-s text-foreground truncate">{user.email}</p>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="type-s text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    {tPublic("signOut")}
                  </button>
                </div>
              ) : (
                <Button variant="dark" className="w-full" asChild>
                  <Link href={withLocale("/signup")} onClick={() => setMobileOpen(false)}>
                    {tPublic("join")}
                  </Link>
                </Button>
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
