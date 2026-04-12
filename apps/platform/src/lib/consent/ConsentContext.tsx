"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  readConsent,
  writeConsent,
  type ConsentState,
  CONSENT_VERSION,
} from "@/lib/consent/cookie-preferences";

const DEFAULT_STATE: ConsentState = {
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  needsConsent: true,
};

type ConsentContextValue = {
  consent: ConsentState;
  mounted: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function syncToServer(prefs: { analytics: boolean; marketing: boolean }) {
  fetch("/api/consent/cookie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...prefs, version: CONSENT_VERSION }),
  }).catch(() => {
    // Ignore — anonymous users will get 401, which is expected
  });
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(readConsent());
  }, []);

  const acceptAll = useCallback(() => {
    const prefs = { analytics: true, marketing: true };
    const full = writeConsent(prefs);
    setConsent({ ...full, needsConsent: false });
    syncToServer(prefs);
  }, []);

  const rejectAll = useCallback(() => {
    const prefs = { analytics: false, marketing: false };
    const full = writeConsent(prefs);
    setConsent({ ...full, needsConsent: false });
    syncToServer(prefs);
  }, []);

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      const full = writeConsent(prefs);
      setConsent({ ...full, needsConsent: false });
      syncToServer(prefs);
    },
    []
  );

  return (
    <ConsentContext.Provider
      value={{ consent, mounted, acceptAll, rejectAll, savePreferences }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsentContext(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsentContext must be used inside <ConsentProvider>");
  }
  return ctx;
}
