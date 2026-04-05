"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

interface WaitlistFormProps {
  compact?: boolean;
}

export function WaitlistForm({ compact }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: Wire to Klaviyo API or waitlist endpoint
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className={`text-sm font-medium ${compact ? "text-foreground" : "text-white"}`}>
        You&apos;re on the list. We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className={`h-11 rounded-lg border px-4 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-ring ${
          compact
            ? "bg-background text-foreground border-border max-w-xs"
            : "bg-white/10 text-white placeholder:text-white/50 border-white/20 backdrop-blur-sm"
        }`}
      />
      <button
        type="submit"
        className={`h-11 px-5 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors ${
          compact
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-white text-foreground hover:bg-white/90"
        }`}
      >
        {compact ? "Join" : "Join waitlist"} <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
