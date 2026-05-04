"use client";

import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  containerClass?: string;
  hideFooter?: boolean;
  hideNavbar?: boolean;
}

export function AppLayout({
  children,
  fullWidth,
  containerClass,
  hideFooter,
  hideNavbar,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!hideNavbar && <Navbar />}
      <div className="flex-1">
        {fullWidth ? (
          children
        ) : (
          <div className={containerClass ?? "container-content py-6 sm:py-8"}>
            {children}
          </div>
        )}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
