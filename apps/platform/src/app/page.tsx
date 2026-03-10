import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { GPS_BAND_CONFIG } from "@/lib/constants";
import type { GreenPassportBand } from "@/lib/engine/trt-scoring-engine/types";

export const metadata: Metadata = {
  title: "Green Passport · The Regenerative Tourism",
};

export const revalidate = 300; // revalidate every 5 minutes

async function getPublishedOperators() {
  return prisma.operator.findMany({
    where: {
      scoreSnapshots: { some: { isPublished: true } },
    },
    include: {
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
      },
      territory: {
        select: { id: true, name: true, pressureLevel: true, compositeDpi: true },
      },
    },
    take: 12,
    orderBy: { updatedAt: "desc" },
  });
}

export default async function HomePage() {
  const operators = await getPublishedOperators().catch(() => []);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-950 to-emerald-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-800/60 text-emerald-200 text-sm px-4 py-1.5 rounded-full">
            🌿 The verified signal for regenerative tourism
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Green Passport
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            The world&apos;s first scientifically-grounded regenerative tourism
            scoring platform. GPS scores, DPI context, and auditable computation.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/signup?role=operator"
              className="bg-white text-emerald-900 font-semibold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
            >
              Get Your Green Passport
            </Link>
            <Link
              href="/methodology"
              className="border border-emerald-400 text-emerald-200 font-semibold px-8 py-3 rounded-full hover:bg-emerald-800/40 transition-colors"
            >
              Learn the Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How the Green Passport Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Operators Complete Assessment",
                desc: "Structured self-assessment across 3 pillars: Operational Footprint, Local Integration, and Regenerative Contribution.",
              },
              {
                step: "02",
                title: "TRT Scoring Engine Computes",
                desc: "Deterministic, auditable computation produces an immutable ScoreSnapshot. No front-end computation. Full trace included.",
              },
              {
                step: "03",
                title: "Green Passport Published",
                desc: "GPS score, band, DPS trajectory, and DPI context displayed to travelers at the moment of booking.",
              },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <div className="text-4xl font-black text-emerald-600/30">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Published operators */}
      {operators.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">
              Verified Regenerative Operators
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operators.map((op) => {
                const score = op.scoreSnapshots[0];
                if (!score) return null;
                const gpsTotal = Number(score.gpsTotal);
                const gpsBand = score.gpsBand as GreenPassportBand;
                const config = GPS_BAND_CONFIG[gpsBand];

                return (
                  <Link
                    key={op.id}
                    href={`/operators/${op.id}`}
                    className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {op.tradingName ?? op.legalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {op.destinationRegion}
                          {op.country ? `, ${op.country}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black tabular-nums">
                          {gpsTotal}
                        </div>
                        <div className="text-xs text-muted-foreground">GPS</div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-xs text-white font-semibold px-2.5 py-1 rounded-full ${
                          gpsBand === "regenerative_leader"
                            ? "bg-emerald-600"
                            : gpsBand === "regenerative_practice"
                            ? "bg-green-600"
                            : gpsBand === "advancing"
                            ? "bg-teal-600"
                            : "bg-amber-600"
                        }`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {op.territory && (
                      <p className="text-xs text-muted-foreground">
                        📍 {op.territory.name}
                        {op.territory.pressureLevel && (
                          <span className={`ml-2 ${op.territory.pressureLevel === "high" ? "text-red-600" : op.territory.pressureLevel === "moderate" ? "text-amber-600" : "text-emerald-600"}`}>
                            · {op.territory.pressureLevel} DPI
                          </span>
                        )}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="bg-emerald-950 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to get your Green Passport?
          </h2>
          <p className="text-emerald-100">
            Join the verified regenerative tourism network. Assessment takes
            approximately 2 hours with all documentation ready.
          </p>
          <Link
            href="/auth/signup?role=operator"
            className="inline-flex bg-white text-emerald-900 font-semibold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Start Your Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
