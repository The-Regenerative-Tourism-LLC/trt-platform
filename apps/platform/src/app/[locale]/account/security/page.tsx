import type { Metadata } from "next";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Security — TRT Platform",
};

export default function SecurityPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-1">Security</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Manage your password and account security.
      </p>

      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Change password
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          You will receive an email confirmation after your password is updated.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
