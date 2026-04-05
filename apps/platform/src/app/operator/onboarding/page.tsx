import type { Metadata } from "next";
import { OperatorOnboardingClientLoader } from "./OperatorOnboardingClientLoader";

export const metadata: Metadata = {
  title: "Operator Assessment",
  description: "Complete your Green Passport Assessment",
};

export default function OperatorOnboardingPage() {
  return <OperatorOnboardingClientLoader />;
}
