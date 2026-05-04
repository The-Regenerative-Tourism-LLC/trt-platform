import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Suspense>
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
