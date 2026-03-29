import { AppLayout } from "@/components/layout/AppLayout";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout maxWidth="max-w-6xl">{children}</AppLayout>;
}
