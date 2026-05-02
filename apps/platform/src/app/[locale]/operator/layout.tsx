"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/^\/(en|pt|es)(?=\/|$)/, "") ?? pathname;

  if (cleanPath?.startsWith("/operator/onboarding")) {
    return <>{children}</>;
  }
  // Dashboard manages its own layout to allow a full-width cover image
  if (cleanPath === "/operator/dashboard") {
    return <AppLayout fullWidth>{children}</AppLayout>;
  }
  return <AppLayout maxWidth="max-w-6xl">{children}</AppLayout>;
}
