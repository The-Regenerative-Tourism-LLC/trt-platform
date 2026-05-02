"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function TravelerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/^\/(en|pt|es)(?=\/|$)/, "") ?? pathname;

  if (cleanPath === "/traveler/waitlist") {
    return <>{children}</>;
  }

  return <AppLayout maxWidth="max-w-6xl">{children}</AppLayout>;
}
