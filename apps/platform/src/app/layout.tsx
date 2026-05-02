// Minimal root layout required by Next.js App Router.
// The full layout (html, body, providers, intl) lives in [locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
