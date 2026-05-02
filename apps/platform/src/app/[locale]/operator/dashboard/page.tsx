import type { Metadata } from "next";
import { OperatorDashboardClient } from "./OperatorDashboardClient";

export const metadata: Metadata = {
  title: "Operator Dashboard",
};

export default function OperatorDashboardPage() {
  return <OperatorDashboardClient />;
}
