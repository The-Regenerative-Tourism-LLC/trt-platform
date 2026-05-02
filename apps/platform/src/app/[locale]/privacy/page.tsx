import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The Regenerative Tourism collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "14 April 2026";
const CONTROLLER_EMAIL = "admin@theregenerativetourism.com";
const HELLO_EMAIL = "hello@theregenerativetourism.com";
const CONTROLLER_NAME = "THE REGENERATIVE TOURISM LLC";
const CONTROLLER_LOCATION = "Wyoming, United States";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-muted-foreground mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">
          This Privacy Policy explains how {CONTROLLER_NAME} (&quot;The Regenerative Tourism&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, shares, and protects information in relation to our website and platform at{" "}
          <Link href="https://www.theregenerativetourism.com" className="underline">
            theregenerativetourism.com
          </Link>{" "}
          (&quot;the Platform&quot;).
        </p>
        <p className="mt-3 text-muted-foreground">
          We are incorporated in the State of Wyoming, United States. Where we process personal data of individuals located in the European Union or United Kingdom, we apply the standards of the General Data Protection Regulation (GDPR) and UK GDPR as a matter of good practice and to meet our legal obligations.
        </p>
      </div>

      <div className="space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Data controller</h2>
          <p className="text-muted-foreground">
            {CONTROLLER_NAME}<br />
            {CONTROLLER_LOCATION}<br />
            Email: <a href={`mailto:${CONTROLLER_EMAIL}`} className="underline">{CONTROLLER_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data we collect</h2>
          <p className="text-muted-foreground mb-3">We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Account data:</strong> name, email address, hashed password, profile photo, role (operator or traveler).</li>
            <li><strong>Assessment data (operators):</strong> operational metrics (energy, water, waste, employment, procurement, community), evidence files, scoring data, and forward commitment records.</li>
            <li><strong>Usage data:</strong> IP address, browser type, pages visited, actions taken on the Platform, session duration.</li>
            <li><strong>Communication data:</strong> emails sent/received, notification preferences, marketing consent.</li>
            <li><strong>Payment data:</strong> managed by our payment processor; we do not store full card numbers.</li>
            <li><strong>Consent records:</strong> timestamps for terms acceptance, privacy acceptance, marketing opt-in, and cookie preferences.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Legal basis for processing</h2>
          <div className="space-y-3 text-muted-foreground">
            <p><strong>Contract:</strong> Processing your account data, running assessments, and delivering the platform features you request.</p>
            <p><strong>Legal obligation:</strong> Compliance with financial, tax, and regulatory obligations under US federal and state law.</p>
            <p><strong>Legitimate interests:</strong> Platform security, fraud prevention, service improvement, internal analytics, and audit logging.</p>
            <p><strong>Consent:</strong> Marketing emails (Klaviyo), analytics cookies (Google Analytics, Microsoft Clarity), and marketing cookies (Meta Pixel, Google Ads). You may withdraw consent at any time via your account settings or the cookie banner.</p>
            <p className="text-sm italic">For users located in the EU/UK, the above bases correspond respectively to Articles 6(1)(b), 6(1)(c), 6(1)(f), and 6(1)(a) of the GDPR.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Creating and managing your account.</li>
            <li>Running GPS and DPI scoring assessments.</li>
            <li>Generating and publishing operator public profiles.</li>
            <li>Sending transactional emails (verification, password reset, assessment updates).</li>
            <li>Sending marketing communications where you have opted in.</li>
            <li>Improving the Platform through analytics.</li>
            <li>Maintaining an audit trail for certification and compliance purposes.</li>
            <li>Fulfilling legal and regulatory obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Third-party processors</h2>
          <p className="text-muted-foreground mb-3">We share data with the following sub-processors, each bound by appropriate data processing agreements:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-muted-foreground border border-border rounded-lg overflow-hidden">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-foreground">Processor</th>
                  <th className="text-left px-4 py-2 font-medium text-foreground">Purpose</th>
                  <th className="text-left px-4 py-2 font-medium text-foreground">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-2">Railway</td><td className="px-4 py-2">Cloud hosting</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">Neon / PostgreSQL</td><td className="px-4 py-2">Database</td><td className="px-4 py-2">EU</td></tr>
                <tr><td className="px-4 py-2">Resend</td><td className="px-4 py-2">Transactional email</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">Klaviyo</td><td className="px-4 py-2">Marketing email (with consent)</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">Google</td><td className="px-4 py-2">OAuth login, Analytics (with consent)</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">AWS S3</td><td className="px-4 py-2">File storage (evidence)</td><td className="px-4 py-2">EU</td></tr>
                <tr><td className="px-4 py-2">Mapbox</td><td className="px-4 py-2">Maps (operator onboarding)</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">Meta (Facebook)</td><td className="px-4 py-2">Marketing pixel (with consent)</td><td className="px-4 py-2">USA</td></tr>
                <tr><td className="px-4 py-2">Microsoft Clarity</td><td className="px-4 py-2">Session analytics (with consent)</td><td className="px-4 py-2">USA</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground mt-3">
            For EU/UK users: transfers to processors outside the EEA are protected by Standard Contractual Clauses (SCCs) or adequacy decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data retention</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Account data:</strong> Retained for the duration of your account plus 3 years for legal and audit purposes.</li>
            <li><strong>Assessment and scoring data:</strong> Retained indefinitely — immutable audit records required for certification integrity.</li>
            <li><strong>Email logs:</strong> Retained for 3 years.</li>
            <li><strong>Usage/analytics data:</strong> Retained for 13 months (Google Analytics default).</li>
            <li><strong>Consent records:</strong> Retained for 5 years from the date of consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Your rights</h2>
          <p className="text-muted-foreground mb-3">You have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong>Erasure:</strong> Request deletion of your data where there is no compelling reason for continued processing.</li>
            <li><strong>Portability:</strong> Receive your data in a structured, commonly used, machine-readable format.</li>
            <li><strong>Restriction:</strong> Ask us to restrict processing of your data in certain circumstances.</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
            <li><strong>Withdraw consent:</strong> Withdraw any consent you have given at any time, without affecting the lawfulness of prior processing.</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="underline">{CONTROLLER_EMAIL}</a>. We will respond within 30 days. EU/UK users also have the right to lodge a complaint with their local data protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
          <p className="text-muted-foreground">
            We use cookies and similar technologies. For full details, see our{" "}
            <Link href="/cookies" className="underline">Cookie Policy</Link>.
            You can manage your preferences at any time via the cookie banner or your{" "}
            <Link href="/account/privacy" className="underline">account privacy settings</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate technical and organisational measures including encryption in transit (TLS), hashed passwords (bcrypt), role-based access controls, and append-only audit logs. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Children</h2>
          <p className="text-muted-foreground">
            The Platform is not directed at children under 16. We do not knowingly collect data from children. If you believe we have inadvertently collected data from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Changes to this policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by a prominent notice on the Platform. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
          <p className="text-muted-foreground">
            For any privacy-related questions or requests, contact us at:<br />
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="underline">{CONTROLLER_EMAIL}</a><br />
            <a href={`mailto:${HELLO_EMAIL}`} className="underline">{HELLO_EMAIL}</a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-border flex gap-6 text-sm">
        <Link href="/terms" className="text-muted-foreground hover:text-foreground underline">
          Terms &amp; Conditions
        </Link>
        <Link href="/cookies" className="text-muted-foreground hover:text-foreground underline">
          Cookie Policy
        </Link>
      </div>
    </div>
  );
}
