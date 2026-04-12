/**
 * Utility for reading and writing the trt_consent cookie.
 *
 * Cookie value: JSON { a: 0|1, m: 0|1, v: string }
 *   a = analytics consent
 *   m = marketing consent
 *   v = policy version (increment when policy changes to re-prompt)
 *
 * If the cookie does not exist the user has not yet expressed a preference
 * (banner should be shown). If the cookie exists but the version differs
 * from CURRENT_VERSION the banner is shown again.
 */

export const CONSENT_COOKIE_NAME = "trt_consent";
export const CONSENT_VERSION = "1";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  version: string;
};

export type ConsentState = ConsentPreferences & {
  /** true when the cookie is absent or version-mismatched — banner should show */
  needsConsent: boolean;
};

function parseCookie(raw: string): ConsentPreferences | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (typeof obj !== "object" || obj === null) return null;
    return {
      analytics: obj.a === 1,
      marketing: obj.m === 1,
      version: typeof obj.v === "string" ? obj.v : CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

function serializeCookie(prefs: ConsentPreferences): string {
  return JSON.stringify({ a: prefs.analytics ? 1 : 0, m: prefs.marketing ? 1 : 0, v: prefs.version });
}

/** Read consent from document.cookie (client only). */
export function readConsent(): ConsentState {
  if (typeof document === "undefined") {
    return { analytics: false, marketing: false, version: CONSENT_VERSION, needsConsent: true };
  }

  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!match) {
    return { analytics: false, marketing: false, version: CONSENT_VERSION, needsConsent: true };
  }

  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  const prefs = parseCookie(raw);

  if (!prefs) {
    return { analytics: false, marketing: false, version: CONSENT_VERSION, needsConsent: true };
  }

  const needsConsent = prefs.version !== CONSENT_VERSION;
  return { ...prefs, needsConsent };
}

/** Write consent to document.cookie (client only). */
export function writeConsent(prefs: Omit<ConsentPreferences, "version">): ConsentPreferences {
  const full: ConsentPreferences = { ...prefs, version: CONSENT_VERSION };
  const value = encodeURIComponent(serializeCookie(full));
  const domain = typeof window !== "undefined" ? window.location.hostname : "";
  const domainAttr = domain && domain !== "localhost" ? `; domain=.${domain}` : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/${domainAttr}; SameSite=Lax`;
  return full;
}
