import type { Metadata } from "next";
import Link from "next/link";
import { CookiePreferencesLink } from "./_CookiePreferencesLink";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Green Passport uses cookies and how to manage your preferences.",
};

const LAST_UPDATED = "12 April 2026";

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-muted-foreground mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-bold text-foreground">Cookie Policy</h1>
        <p className="mt-4 text-muted-foreground">
          This Cookie Policy explains how Green Passport uses cookies and similar tracking technologies on our platform and website.
        </p>
      </div>

      <div className="space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. What are cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work, improve efficiency, and provide analytics information to site owners. We also use similar technologies such as web beacons and pixels.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Categories of cookies we use</h2>

          <div className="space-y-6 mt-4">
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Essential cookies</h3>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Always active</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                These cookies are strictly necessary for the Platform to function and cannot be disabled.
              </p>
              <table className="w-full text-xs text-muted-foreground">
                <thead><tr className="border-b border-border"><th className="text-left pb-2">Name</th><th className="text-left pb-2">Purpose</th><th className="text-left pb-2">Duration</th></tr></thead>
                <tbody>
                  <tr><td className="py-1 pr-4">authjs.session-token</td><td className="py-1 pr-4">Authentication session</td><td className="py-1">Session</td></tr>
                  <tr><td className="py-1 pr-4">authjs.csrf-token</td><td className="py-1 pr-4">CSRF protection</td><td className="py-1">Session</td></tr>
                  <tr><td className="py-1 pr-4">trt_consent</td><td className="py-1 pr-4">Stores your cookie preferences</td><td className="py-1">1 year</td></tr>
                </tbody>
              </table>
            </div>

            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Analytics cookies</h3>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Consent required</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                These cookies help us understand how visitors interact with the Platform so we can improve it.
              </p>
              <table className="w-full text-xs text-muted-foreground">
                <thead><tr className="border-b border-border"><th className="text-left pb-2">Provider</th><th className="text-left pb-2">Purpose</th><th className="text-left pb-2">Duration</th></tr></thead>
                <tbody>
                  <tr><td className="py-1 pr-4">Google Analytics (_ga, _gid)</td><td className="py-1 pr-4">Page views, engagement metrics</td><td className="py-1">Up to 2 years</td></tr>
                  <tr><td className="py-1 pr-4">Microsoft Clarity (_clck, _clsk)</td><td className="py-1 pr-4">Session recordings, heatmaps</td><td className="py-1">1 year</td></tr>
                </tbody>
              </table>
            </div>

            <div className="border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Marketing cookies</h3>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Consent required</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                These cookies are used to deliver relevant advertisements and track campaign performance.
              </p>
              <table className="w-full text-xs text-muted-foreground">
                <thead><tr className="border-b border-border"><th className="text-left pb-2">Provider</th><th className="text-left pb-2">Purpose</th><th className="text-left pb-2">Duration</th></tr></thead>
                <tbody>
                  <tr><td className="py-1 pr-4">Meta Pixel (_fbp, _fbc)</td><td className="py-1 pr-4">Ad targeting and conversion tracking</td><td className="py-1">90 days – 2 years</td></tr>
                  <tr><td className="py-1 pr-4">Google Ads</td><td className="py-1 pr-4">Ad conversion measurement</td><td className="py-1">Up to 2 years</td></tr>
                  <tr><td className="py-1 pr-4">Klaviyo</td><td className="py-1 pr-4">Email marketing personalisation</td><td className="py-1">Session – 2 years</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Managing your preferences</h2>
          <p className="text-muted-foreground mb-4">
            You can manage your cookie preferences at any time:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <CookiePreferencesLink /> — opens the consent banner to update your choices.
            </li>
            <li>
              <Link href="/account/privacy" className="underline hover:text-foreground">Account privacy settings</Link> — manage your preferences when logged in.
            </li>
            <li>
              Through your browser settings — most browsers allow you to refuse or delete cookies. This may affect Platform functionality.
            </li>
          </ul>
          <p className="text-muted-foreground mt-3">
            Withdrawing consent for analytics or marketing cookies does not affect cookies already placed. To remove existing cookies, clear your browser&apos;s cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Third-party cookies</h2>
          <p className="text-muted-foreground">
            Some cookies are set by third-party services we use. These are subject to the respective third parties&apos; privacy policies. We are not responsible for the content of those policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Do Not Track</h2>
          <p className="text-muted-foreground">
            We respect your cookie preferences as set via our consent banner. We do not currently respond to browser Do Not Track (DNT) signals, but our consent system provides equivalent or greater control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Changes to this policy</h2>
          <p className="text-muted-foreground">
            When we make material changes to our cookie usage, we will update this policy and re-show the consent banner where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
          <p className="text-muted-foreground">
            Questions about our use of cookies? Contact us at{" "}
            <a href="mailto:admin@theregenerativetourism.com" className="underline">
              admin@theregenerativetourism.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-border flex gap-6 text-sm">
        <Link href="/privacy" className="text-muted-foreground hover:text-foreground underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-muted-foreground hover:text-foreground underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}
