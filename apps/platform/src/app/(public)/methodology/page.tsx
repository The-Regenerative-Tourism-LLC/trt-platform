import type { Metadata } from "next";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Green Passport Score, Destination Pressure Index, and Traveler Impact Profile are calculated.",
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}
