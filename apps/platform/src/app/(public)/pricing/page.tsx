import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  title: "Pricing",
  description:
    "Assessment pricing for operators — from free self-assessment to verified publication.",
};

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 px-5">
        <div className="container mx-auto max-w-3xl text-center space-y-4">
          <Badge variant="outline" className="mb-2 text-xs tracking-widest uppercase">
            Pricing
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            One assessment.
            <br className="hidden sm:block" /> Two ways to use it.
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Every operator can complete the Green Passport assessment for free.
            Publication on the regenerative map and verified scoring require a
            subscription.
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
                  Self-Assessment
                </span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                Free
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Complete the full assessment at no cost
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Full assessment across all three pillars
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Internal score visible only to you
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  AI-generated improvement recommendations
                </li>
                <li className="flex gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  Score not published on the map
                </li>
                <li className="flex gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  No public Green Passport page
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/signup?role=operator">
                  Start free assessment
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
                  Founding Operator
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  €29
                </CardTitle>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm">
                First 30 operators — Madeira cohort
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-lg px-3 py-2 text-xs text-accent font-medium flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Limited to 30 spots — 3 months free to start
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Everything in Free, plus:
                  </li>
                  <li className="flex gap-2">
                    <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Published score on the regenerative map
                  </li>
                  <li className="flex gap-2">
                    <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Public Green Passport page
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Pillar 3 contribution guidance
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Field documentation (photo & video)
                  </li>
                  <li className="flex gap-2">
                    <Star className="h-4 w-4 text-[hsl(var(--trt-amber))] shrink-0 mt-0.5" />
                    Permanent &ldquo;Founder&rdquo; badge
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Locked price — €29/mo forever
                  </li>
                </ul>
              </div>
              <Button className="w-full" asChild>
                <Link href="/signup?role=operator&plan=founder">
                  Join founding cohort
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
                  Standard
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  €60
                </CardTitle>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm">
                For operators joining after the founding cohort
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-6">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Everything in Free, plus:
                </li>
                <li className="flex gap-2">
                  <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Published score on the regenerative map
                </li>
                <li className="flex gap-2">
                  <Unlock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Public Green Passport page
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  AI improvement recommendations
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Embeddable verification widget
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  Analytics dashboard
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/signup?role=operator">Get started</Link>
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
              Madeira first, then everywhere
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            We&apos;re launching in Madeira — and going global.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The founding cohort of 30 operators in Madeira will establish the
            first verified regenerative dataset. After this initial phase, the
            assessment and verification layer will open to operators worldwide.
          </p>
          <Button variant="outline" size="lg" className="mt-2" asChild>
            <Link href="/methodology" className="gap-2">
              Read the full methodology
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-5">
        <div className="container mx-auto max-w-2xl space-y-8">
          <h2 className="text-xl font-bold text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I really do the assessment for free?",
                a: "Yes. The full assessment across all three pillars is completely free. You'll see your internal score and receive AI recommendations to improve.",
              },
              {
                q: 'What does "published" mean?',
                a: "Published operators appear on the regenerative map, get a public Green Passport page shareable with guests, and can embed a verification widget on their own website.",
              },
              {
                q: "What happens after the 3-month free period for founders?",
                a: "Founding operators transition to €29/month — a rate locked permanently. This includes ongoing verification, field documentation, and Pillar 3 guidance.",
              },
              {
                q: "I'm not in Madeira — can I still join?",
                a: "Absolutely. Any operator worldwide can complete the assessment today. Once we expand beyond the founding cohort, you can subscribe at the standard €60/month rate to publish your score.",
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
