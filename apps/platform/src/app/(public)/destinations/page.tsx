import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DestinationsClient } from "./DestinationsClient";

export const metadata: Metadata = {

  title: "Destinations & Destination Pressure Index",
  description:
    "Explore the Destination Pressure Index (DPI) for territories worldwide — see overtourism risk, capacity signals, and certified operators by destination.",
  alternates: { canonical: "/destinations" },
  openGraph: {
    title: "Destinations & Destination Pressure Index · The Regenerative Tourism",
    description:
      "Explore the Destination Pressure Index (DPI) for territories worldwide — overtourism risk, capacity signals, and certified operators.",
    url: "/destinations",
  },
  twitter: {
    card: "summary_large_image",
    title: "Destinations & Destination Pressure Index · The Regenerative Tourism",
    description:
      "Explore the Destination Pressure Index (DPI) for territories worldwide.",
  },
};

export const dynamic = "force-dynamic";

async function getTerritories() {
  return prisma.territory.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      country: true,
      compositeDpi: true,
      pressureLevel: true,
      touristIntensity: true,
      ecologicalSensitivity: true,
      economicLeakageRate: true,
    },
  });
}

export default async function DestinationsPage() {
  const territories = await getTerritories();

  const serialized = territories.map((t) => ({
    id: t.id,
    name: t.name,
    country: t.country,
    compositeDpi: t.compositeDpi ? Number(t.compositeDpi) : null,
    pressureLevel: t.pressureLevel,
    touristIntensity: t.touristIntensity ? Number(t.touristIntensity) : null,
    ecologicalSensitivity: t.ecologicalSensitivity
      ? Number(t.ecologicalSensitivity)
      : null,
    economicLeakageRate: t.economicLeakageRate
      ? Number(t.economicLeakageRate)
      : null,
  }));

  return <DestinationsClient territories={serialized} />;
}
