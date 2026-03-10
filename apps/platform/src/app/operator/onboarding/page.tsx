import type { Metadata } from "next";
import { OperatorOnboardingClient } from "./OperatorOnboardingClient";

export const metadata: Metadata = {
  title: "Operator Assessment",
  description: "Complete your Green Passport Assessment",
};

export default function OperatorOnboardingPage() {
  return <OperatorOnboardingClient />;
}
