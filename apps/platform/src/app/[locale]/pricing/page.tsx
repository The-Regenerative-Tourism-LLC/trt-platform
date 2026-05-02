import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { withLocalePath } from "@/i18n/pathname";
import {
  Check,
  Star,
  Globe,
  Lock,
  Unlock,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing & Assessment Tiers",
  description:
    "Assessment pricing for regenerative tourism operators — from free self-assessment to independently verified publication on The Regenerative Tourism platform.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing & Assessment Tiers · The Regenerative Tourism",
    description:
      "Assessment pricing for regenerative tourism operators — from free self-assessment to independently verified publication.",
    url: "/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Assessment Tiers · The Regenerative Tourism",
    description:
      "Assessment pricing for operators — from free self-assessment to verified publication.",
  },
};

export default async function PricingPage() {
  const t = await getTranslations("public.pricing");
  const locale = await getLocale();
  const signupHref = withLocalePath("/signup?role=operator", locale);
  const founderHref = withLocalePath("/signup?role=operator&plan=founder", locale);
  const methodologyHref = withLocalePath("/methodology", locale);

  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 px-5">
        <div className="container mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="outline" className="mb-2 text-xs tracking-widest uppercase">
            {t("badge")}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t("titleLine1")}
            <br className="hidden sm:block" /> {t("titleLine2")}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-24 px-5">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <Card className="flex flex-col">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  {t("free.badge")}
                </span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                Free
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("free.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("free.features.one")}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("free.features.two")}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("free.features.three")}
                </li>
                <li className="flex gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  {t("free.features.four")}
                </li>
                <li className="flex gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  {t("free.features.five")}
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href={signupHref}>
                  {t("free.cta")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Founder — highlighted */}
          <Card className="border-accent/40 bg-accent/[0.03] ring-1 ring-accent/20 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-accent" />
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-xs uppercase tracking-widest font-medium text-accent">
                  {t("founder.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  €29
                </CardTitle>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("founder.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-lg px-3 py-2 text-xs text-accent font-medium flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {t("founder.notice")}
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.one")}
                  </li>
                  <li className="flex gap-2">
                    <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.two")}
                  </li>
                  <li className="flex gap-2">
                    <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.three")}
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.four")}
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.five")}
                  </li>
                  <li className="flex gap-2">
                    <Star className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.six")}
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {t("founder.features.seven")}
                  </li>
                </ul>
              </div>
              <Button className="w-full" asChild>
                <Link href={founderHref}>
                  {t("founder.cta")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Standard */}
          <Card className="flex flex-col">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  {t("standard.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  €60
                </CardTitle>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("standard.subtitle")}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.one")}
                </li>
                <li className="flex gap-2">
                  <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.two")}
                </li>
                <li className="flex gap-2">
                  <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.three")}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.four")}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.five")}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {t("standard.features.six")}
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href={signupHref}>{t("standard.cta")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Going Global */}
      <section className="border-t border-border/50 py-16 md:py-20 px-5 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-accent">
            <Globe className="h-5 w-5" />
            <span className="text-xs uppercase tracking-widest font-semibold">
              {t("global.eyebrow")}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("global.title")}
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t("global.body")}
          </p>
          <Button variant="outline" size="lg" className="mt-2" asChild>
            <Link href={methodologyHref} className="gap-2">
              {t("global.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-5">
        <div className="container mx-auto max-w-2xl space-y-8">
          <h2 className="text-xl font-bold text-center">{t("faq.title")}</h2>
          <div className="space-y-6">
            {[
              {
                q: t("faq.items.one.q"),
                a: t("faq.items.one.a"),
              },
              {
                q: t("faq.items.two.q"),
                a: t("faq.items.two.a"),
              },
              {
                q: t("faq.items.three.q"),
                a: t("faq.items.three.a"),
              },
              {
                q: t("faq.items.four.q"),
                a: t("faq.items.four.a"),
              },
            ].map((item) => (
              <div key={item.q} className="space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
