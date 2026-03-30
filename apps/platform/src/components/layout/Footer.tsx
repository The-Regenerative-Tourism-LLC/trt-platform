import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container mx-auto max-w-7xl py-12 md:py-20 px-5 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                GP
              </div>
              <span className="font-semibold text-white text-sm">
                Green Passport
              </span>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              A verification layer for tourism — making impact visible at the
              moment it matters most.
            </p>
          </div>

          {/* Platform */}
          <div className="md:col-span-3 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/30">
              Platform
            </p>
            <div className="space-y-2.5">
              <Link
                href="/discover"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/destinations"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Destinations
              </Link>
              <Link
                href="/signup?role=operator"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Operator Signup
              </Link>
              <Link
                href="/signup?role=traveler"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Traveler Signup
              </Link>
              <Link
                href="/pricing"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Methodology */}
          <div className="md:col-span-4 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/30">
              Methodology
            </p>
            <div className="space-y-2.5">
              <Link
                href="/methodology"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Full Methodology
              </Link>
              <Link
                href="/methodology?tab=gps"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Green Passport Score
              </Link>
              <Link
                href="/methodology?tab=dpi"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Destination Pressure Index
              </Link>
              <Link
                href="/methodology?tab=tip"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Traveler Impact Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 md:mt-16 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} The Regenerative Tourism. All
            rights reserved.
          </p>
          <a
            href="https://theregenerativetourism.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            theregenerativetourism.com
          </a>
        </div>
      </div>
    </footer>
  );
}
