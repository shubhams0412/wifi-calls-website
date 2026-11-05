import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Use', description: 'The terms that govern your access to and use of Wi-Fi Calling & Texting.' };

export default function TermsPage() {
  return (
    <>
{/* ===================== PAGE HEADER ===================== */}
<section className="page-hero">
  <div className="wrap">
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span className="sep">/</span>Terms of Use
    </nav>
    <span className="label">Terms of Use</span>
    <h1>The agreement for using the service.</h1>
    <p>The terms that govern your access to and use of Wi-Fi Calling &amp; Texting.</p>
    <p><small>Last updated: November 5, 2026</small></p>
  </div>
</section>

<div>
<section className="doc-page">
  <div className="wrap">
    <div className="prose">
      <p className="lead-note">
        These Terms of Use govern your access to and use of Wi-Fi Calling &amp; Texting (the “Service”),
        provided by Wi-Fi Calling &amp; Texting. By creating an account or using the Service, you agree to these Terms.
      </p>

      <h3>1. Eligibility</h3>
      <p>You must be at least 18 years old, or the age of majority in your jurisdiction, to use the Service.</p>

      <h3>2. Account Registration</h3>
      <p>You must keep your login credentials confidential and accept responsibility for all activity on your account. Notify us of any unauthorized access. We reserve the right to suspend accounts registered with false information.</p>

      <h3>3. Description of Services</h3>
      <p>The platform enables Wi-Fi/data calling, text messaging, virtual phone-number acquisition, and in-app purchases. Service availability may vary by country, region, carrier, or device compatibility.</p>

      <h3>4. Virtual Numbers &amp; Communication Services</h3>
      <p>Virtual phone numbers provided through the Service:</p>
      <ul>
        <li>Do not grant ownership rights to the user;</li>
        <li>May be reassigned, reclaimed, suspended, or terminated at our discretion;</li>
        <li>Must not be used for illegal, fraudulent, or abusive purposes.</li>
      </ul>

      <h3>5. Fair Use Policy</h3>
      <p>Prohibited activities include excessive or abnormal usage; automated calling or messaging; bulk or mass communication; robocalling; spam or unsolicited communications; and activities violating telecommunications regulations.</p>

      <h3>6. Prohibited Uses</h3>
      <p>You may not violate laws, harass others, transmit malware, impersonate individuals, or infringe intellectual property rights.</p>

      <h3>7. Payments &amp; Subscriptions</h3>
      <p>Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period. Payments are processed through the applicable app store and are generally non-refundable except where legally required.</p>

      <h3>8. Privacy</h3>
      <p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>.</p>

      <h3>9. Intellectual Property</h3>
      <p>You may not copy, modify, distribute, sell, or reverse engineer our content without written consent.</p>

      <h3>10. Third-Party Services</h3>
      <p>We disclaim responsibility for third-party content, products, or transactions.</p>

      <h3>11. No Warranty</h3>
      <p>The Service is provided on an “AS IS” and “AS AVAILABLE” basis. All warranties are disclaimed to the fullest extent permitted by law.</p>

      <h3>12. Limitation of Liability</h3>
      <p>Our liability is limited to the amounts you paid during the preceding twelve (12) months.</p>

      <h3>13. Indemnification</h3>
      <p>You agree to indemnify us for claims arising from your misuse of the Service or violations of law.</p>

      <h3>14. Suspension &amp; Termination</h3>
      <p>We may suspend or terminate access without notice for violations of these Terms.</p>

      <h3>15. Modifications to the Service</h3>
      <p>We may modify, suspend, discontinue, or update any part of the Service at any time without liability.</p>

      <h3>16. Changes to These Terms</h3>
      <p>Updates are posted within the app or on this website with a revised date. Continued use after changes constitutes acceptance.</p>

      <div className="callout">
        <span className="ic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H5.2L4 17.2V4z"/></svg></span>
        <div>Questions about these Terms? <a href="/#contact">Contact us</a> and we'll be glad to help.</div>
      </div>

      <div className="doc-foot-links">
        <a href="/">← Back to home</a>
        <a href="/privacy">Read our Privacy Policy →</a>
      </div>
    </div>
  </div>
</section>
</div>
    </>
  );
}
