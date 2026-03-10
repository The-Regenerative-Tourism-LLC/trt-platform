import type { Metadata } from "next";
import { TravelerDashboardClient } from "./TravelerDashboardClient";

export const metadata: Metadata = {
  title: "Traveler Dashboard",
};

export default function TravelerDashboardPage() {
  return <TravelerDashboardClient />;
}
