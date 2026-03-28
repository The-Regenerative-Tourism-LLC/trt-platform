import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

// Admin data is always request-scoped: live DB queries, auth-gated, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [operatorCount, totalScores, publishedScores, pendingEvidence, territoryCount] =
    await Promise.all([
      prisma.operator.count(),
      prisma.scoreSnapshot.count(),
      prisma.scoreSnapshot.count({ where: { isPublished: true } }),
      prisma.evidenceRef.count({ where: { verificationState: "pending" } }),
      prisma.territory.count(),
    ]);

  const recentScores = await prisma.scoreSnapshot.findMany({
    orderBy: { computedAt: "desc" },
    take: 10,
    include: {
      operator: { select: { legalName: true, tradingName: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Operators", value: operatorCount },
          { label: "Total Scores", value: totalScores },
          { label: "Published", value: publishedScores },
          { label: "Pending Evidence", value: pendingEvidence, alert: pendingEvidence > 0 },
          { label: "Territories", value: territoryCount },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 text-center ${
              s.alert ? "border-amber-300 bg-amber-50" : "bg-card"
            }`}
          >
            <div className="text-3xl font-black tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/admin/operators"
          className="px-4 py-2 border rounded-full text-sm hover:bg-muted transition-colors"
        >
          Manage Operators
        </Link>
        <Link
          href="/admin/evidence"
          className="px-4 py-2 border rounded-full text-sm hover:bg-muted transition-colors"
        >
          Evidence Queue{pendingEvidence > 0 ? ` (${pendingEvidence})` : ""}
        </Link>
        <Link
          href="/admin/territories"
          className="px-4 py-2 border rounded-full text-sm hover:bg-muted transition-colors"
        >
          Territories & DPI
        </Link>
        <Link
          href="/admin/scores"
          className="px-4 py-2 border rounded-full text-sm hover:bg-muted transition-colors"
        >
          Score Snapshots
        </Link>
      </div>

      {/* Recent scores */}
      <div className="rounded-2xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Score Computations</h2>
        </div>
        <div className="divide-y">
          {recentScores.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-sm">
                  {s.operator.tradingName ?? s.operator.legalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.computedAt).toLocaleString()} ·{" "}
                  <span className="font-mono">{s.id.slice(0, 8)}…</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black tabular-nums">
                  {Number(s.gpsTotal)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {s.gpsBand.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          ))}
          {recentScores.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No score computations yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
