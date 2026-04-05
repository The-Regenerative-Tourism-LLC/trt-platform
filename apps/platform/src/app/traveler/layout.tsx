"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function TravelerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/traveler/waitlist") {
    return <>{children}</>;
  }

  return <AppLayout maxWidth="max-w-6xl">{children}</AppLayout>;
}
