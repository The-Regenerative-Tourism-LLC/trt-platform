import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using The Regenerative Tourism platform.",
};

const LAST_UPDATED = "14 April 2026";
const CONTACT_EMAIL = "admin@theregenerativetourism.com";
const HELLO_EMAIL = "hello@theregenerativetourism.com";
const COMPANY_NAME = "THE REGENERATIVE TOURISM LLC";
const COMPANY_LOCATION = "Wyoming, United States";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
      <div className="mb-10">
        <p className="text-sm text-black mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
        <p className="mt-4 text-black">
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of The Regenerative Tourism platform operated by {COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or using the Platform, you agree to these Terms.
        </p>
      </div>

      <div className="space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance</h2>
          <p className="text-black">
            By registering an account, you confirm that you are at least 18 years old, have the legal capacity to enter into these Terms, and agree to be bound by them. If you are registering on behalf of a business entity, you represent that you have authority to bind that entity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of service</h2>
          <p className="text-black">
            The Regenerative Tourism platform provides:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-black">
            <li>Green Passport Score (GPS) assessments for tourism operators.</li>
            <li>Destination Pressure Index (DPI) data for territories.</li>
            <li>Traveler Impact Profiles for registered travelers.</li>
            <li>Public operator profiles and discovery features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Account registration</h2>
          <p className="text-black">
            You must provide accurate and complete information when creating your account. You are responsible for maintaining the security of your credentials and for all activity that occurs under your account. Notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a> if you suspect unauthorised access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Operator obligations</h2>
          <p className="text-black mb-2">If you register as a Tourism Operator, you agree to:</p>
          <ul className="list-disc pl-5 space-y-1 text-black">
            <li>Submit only accurate, verifiable data in your assessments.</li>
            <li>Provide evidence that fairly represents your operational practices.</li>
            <li>Notify us promptly of any material changes that would affect your score.</li>
            <li>Not misrepresent or manipulate your GPS score in external communications.</li>
            <li>Comply with all applicable environmental and labour laws in your jurisdiction.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Prohibited conduct</h2>
          <p className="text-black mb-2">You may not:</p>
          <ul className="list-disc pl-5 space-y-1 text-black">
            <li>Submit false, misleading, or fraudulent assessment data.</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the Platform without permission.</li>
            <li>Interfere with the security or integrity of the Platform.</li>
            <li>Use the Platform for any unlawful purpose.</li>
            <li>Impersonate another person or entity.</li>
            <li>Transfer your account to any third party without our consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Intellectual property</h2>
          <p className="text-black">
            The Platform, including all content, methodology, scoring algorithms, software, and branding, is owned by {COMPANY_NAME} or its licensors and is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission. Your assessment data remains yours; you grant us a licence to process it for the purposes described in our{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Scores and certifications</h2>
          <p className="text-black">
            GPS scores are computed using our published methodology and reflect data submitted at the time of assessment. Scores are not an endorsement or guarantee of any particular environmental outcome. We reserve the right to revise scores if submitted data is found to be inaccurate or if the methodology is updated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Fees and payment</h2>
          <p className="text-black">
            Certain features of the Platform may require payment of fees as set out on our pricing page. Fees are non-refundable unless required by applicable law. We reserve the right to change our pricing with 30 days&apos; notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
          <p className="text-black">
            You may close your account at any time by contacting us. We may suspend or terminate your access if you breach these Terms, submit fraudulent data, or if required by law. Upon termination, your right to use the Platform ceases immediately. Sections 6, 10, 11, and 12 survive termination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Disclaimer of warranties</h2>
          <p className="text-black">
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR UNINTERRUPTED ACCESS. WE DO NOT WARRANT THAT THE PLATFORM WILL BE ERROR-FREE OR SECURE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Limitation of liability</h2>
          <p className="text-black">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Governing law and disputes</h2>
          <p className="text-black">
            These Terms are governed by the laws of the State of Wyoming, United States, without regard to conflict of law principles. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Wyoming, United States.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Company</h2>
          <p className="text-black">
            {COMPANY_NAME} — Wyoming Limited Liability Company, {COMPANY_LOCATION}.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. Changes to these Terms</h2>
          <p className="text-black">
            We may update these Terms from time to time. If we make material changes, we will notify you by email and require your re-acceptance before you can continue using the Platform. The &quot;Last updated&quot; date at the top reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. Contact</h2>
          <p className="text-black">
            For questions about these Terms, contact us at:<br />
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a><br />
            <a href={`mailto:${HELLO_EMAIL}`} className="underline">{HELLO_EMAIL}</a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-border flex gap-6 text-sm">
        <Link href="/privacy" className="text-black hover:text-foreground underline">
          Privacy Policy
        </Link>
        <Link href="/cookies" className="text-black hover:text-foreground underline">
          Cookie Policy
        </Link>
      </div>
    </div>
  );
}
