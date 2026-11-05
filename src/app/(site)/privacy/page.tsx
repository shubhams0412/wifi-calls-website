import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How Wi-Fi Calling & Texting collects, uses, and protects your personal information.' };

export default function PrivacyPage() {
  return (
    <>
{/* ===================== PAGE HEADER ===================== */}
<section className="page-hero">
  <div className="wrap">
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span className="sep">/</span>Privacy Policy
    </nav>
    <span className="label">Privacy Policy</span>
    <h1>Your privacy, in plain terms.</h1>
    <p>What we collect, why we collect it, how we use it, and the choices you have over your data.</p>
  </div>
</section>

<div>
<section className="doc-page">
  <div className="wrap">
    <div className="prose">
      <p className="lead-note">
        At Wi-Fi Calling &amp; Texting, we believe your privacy is important. We are committed to
        protecting your personal information and collecting only the data necessary to provide our
        services. This Privacy Policy explains what information we collect, why we collect it, how we
        use it, and the choices you have regarding your data. It applies to all products and services
        provided through Wi-Fi Calling &amp; Texting.
      </p>

      <h3>Information Collection</h3>
      <p>We are committed to collecting only the information required to provide reliable calling and messaging services.</p>

      <h4>Account Information</h4>
      <p>When you create an account, we may collect your primary mobile number, your name, and your email address (optional).</p>
      <ul>
        <li>Your mobile number is used for account verification, security, OTP verification, important account notifications, and optional call-forwarding features.</li>
        <li>Your name helps personalize your account and communications.</li>
        <li>Your email address is optional and may be used for service updates, account information, promotional offers (where permitted), and customer support.</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h4>Billing Information</h4>
      <p>All payments are securely processed through trusted third-party payment providers. Depending on the processor, additional information such as your mobile number or email may be requested to process payments, calculate taxes, generate invoices, and prevent fraudulent transactions. Your payment card information is processed directly by the payment provider and is never stored on our servers. We retain transaction records only for accounting, customer support, fraud prevention, and legal compliance.</p>

      <h4>Device Information</h4>
      <p>To improve app performance and security, we may collect your device model, operating system version, app version, device identifiers, language settings, network information, crash reports, and diagnostic information. This helps us troubleshoot issues, improve compatibility, and enhance performance.</p>

      <h4>Log Information</h4>
      <p>We automatically collect certain information whenever you use the app, including IP address, login timestamps, authentication logs, device activity, and error reports. These logs help protect accounts, detect suspicious activity, investigate fraud, and improve reliability.</p>

      <h4>Location Information</h4>
      <p>We may collect approximate location derived from your IP address to improve service quality, detect fraudulent activity, comply with legal requirements, and enhance network performance. We do not continuously track your precise GPS location unless you explicitly grant permission for a feature requiring it.</p>

      <h4>Contacts</h4>
      <p>With your explicit permission, the app may access your device contacts to help identify friends or other registered users. To do this, the app sends your contacts’ names and phone numbers to our servers, where they are matched against registered users. This information is used only to find and show your friends on the app, is never sold, and is never shared for advertising. You can revoke this permission at any time through your device settings.</p>

      <h4>Phone, SMS, Microphone &amp; Camera Permissions</h4>
      <ul>
        <li><strong>Phone &amp; calling:</strong> phone access, microphone access, call management, and audio routing — used solely to enable voice calling and improve call quality.</li>
        <li><strong>SMS:</strong> where supported, requested for OTP verification and automatic verification of authentication codes. SMS access is never used to read unrelated personal messages.</li>
        <li><strong>Microphone:</strong> required for voice calls and voice messaging. Audio is transmitted only during active communications and handled securely.</li>
        <li><strong>Camera:</strong> optional — requested only if you use features such as profile photos, video calling, or media sharing.</li>
      </ul>

      <h4>Photos and Media</h4>
      <p>With your permission, the app may access your photo library to share images, update profile pictures, or send media within conversations. Your media is accessed only when you initiate these actions.</p>

      <h4>Notifications</h4>
      <p>We may send push notifications for incoming calls, messages, account verification, security alerts, subscription reminders, and service announcements. You may manage notification preferences in your device settings.</p>

      <h4>Website &amp; App Usage, Cookies</h4>
      <p>When you use our website or apps, we may automatically collect browser type, device type, operating system, pages visited, session duration, feature usage, and performance analytics. Our sites and apps may use cookies and similar technologies to remember preferences, maintain secure sessions, analyze usage, and improve performance. You can manage cookie preferences through your browser settings where applicable.</p>

      <h4>Customer Support</h4>
      <p>If you contact support, we may retain your support requests, email correspondence, chat messages, phone number, and any attachments you voluntarily provide, to resolve issues efficiently and improve service.</p>

      <h4>Information We Do Not Collect</h4>
      <p>We do not intentionally collect sensitive personal information unless required for a specific service or by applicable law. <strong>We do not sell your personal data.</strong></p>

      <h3>How We Use Your Information</h3>
      <p>We use your information to create and manage your account; provide calling and messaging services; process payments; authenticate users; improve service quality; detect fraud and abuse; provide customer support; send service-related notifications; and comply with legal obligations.</p>

      <h3>Information Sharing</h3>
      <p>We do not sell or rent your personal information. We may share limited information only in these situations:</p>
      <ul>
        <li><strong>Service providers</strong> — trusted third parties who help us deliver cloud hosting, payment processing, analytics, customer support, security monitoring, and push notifications, processing information only as necessary on our behalf.</li>
        <li><strong>Legal requirements</strong> — where required by law, court order, government request, or legal process. Where legally permitted, we will notify users before disclosure.</li>
        <li><strong>Preventing abuse</strong> — to investigate fraud, spam, abuse, illegal activity, or violations of our Terms of Service.</li>
        <li><strong>Business transfers</strong> — in a merger, acquisition, financing, or sale of assets, user information may be transferred; users will be notified of material changes.</li>
      </ul>

      <h3>Data Security</h3>
      <p>We implement industry-standard security measures including SSL/TLS encryption, secure authentication, encrypted communications, access controls, infrastructure monitoring, and security auditing. While we strive to protect your information, no system can guarantee absolute security.</p>

      <h3>Data Retention &amp; Account Deletion</h3>
      <p>We retain personal information only as long as necessary to provide services, meet legal obligations, resolve disputes, prevent fraud, and enforce agreements. After account deletion, personal information is removed or anonymized according to our retention policies unless longer retention is required by law; database backups may remain securely stored for a limited period before permanent deletion.</p>
      <p>You may request deletion of your account at any time through the app or by contacting customer support. Following verification, your account and associated personal information will be deleted according to applicable legal and operational requirements.</p>

      <h3>Your Privacy Rights</h3>
      <p>Depending on your location, you may have the right to access, correct, or delete your personal information; restrict processing; withdraw consent; object to certain processing; and request a copy of your information where applicable. To exercise these rights, contact us using the details on our <a href="/#contact">Contact</a> page.</p>

      <h3>Children's Privacy</h3>
      <p>Wi-Fi Calling &amp; Texting is not intended for children under the age required by applicable law. We do not knowingly collect personal information from children; if we become aware such information has been collected, we will promptly delete it.</p>

      <h3>Third-Party Services</h3>
      <p>Our app may integrate third-party services such as payment providers, analytics providers, cloud hosting, crash reporting, and communication infrastructure providers. These services operate under their own privacy policies.</p>

      <h3>Changes to This Privacy Policy</h3>
      <p>We may update this Privacy Policy periodically to reflect changes in our services, legal requirements, or privacy practices. Material changes will be communicated through the app or other appropriate channels.</p>

      <div className="callout">
        <span className="ic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H5.2L4 17.2V4z"/></svg></span>
        <div>Questions or complaints about this Privacy Policy? <a href="/#contact">Contact us</a> and we'll be glad to help.</div>
      </div>

      <div className="doc-foot-links">
        <a href="/">← Back to home</a>
        <a href="/terms">Read our Terms of Use →</a>
      </div>
    </div>
  </div>
</section>
</div>
    </>
  );
}
