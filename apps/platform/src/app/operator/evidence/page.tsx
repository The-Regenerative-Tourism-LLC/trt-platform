import type { Metadata } from "next";
import { EvidenceClient } from "./EvidenceClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evidence Management",
};

export default function OperatorEvidencePage() {
  return <EvidenceClient />;
}
