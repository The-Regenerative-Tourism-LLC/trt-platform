"use client";

import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  maxWidth?: string;
  hideFooter?: boolean;
  hideNavbar?: boolean;
}

export function AppLayout({
  children,
  fullWidth,
  maxWidth,
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
          <div
            className={`container mx-auto ${maxWidth || "max-w-5xl"} py-6 sm:py-8 px-5 sm:px-6`}
          >
            {children}
          </div>
        )}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
