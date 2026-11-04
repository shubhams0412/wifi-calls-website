import type { Metadata } from 'next';
import ContactForm from '@/components/site/ContactForm';
import { PageHero } from '@/components/site/blocks';
import { SUPPORT_EMAIL } from '@/site/config';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Questions, feedback or something not working? Send the Wi-Fi Calling & Texting support team a message and we’ll reply by email.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Contact' }]} eyebrow="Contact us" icon="mail"
        title="We’re here to help" intro={`Send us a message and we’ll get back to you by email — usually within a day. You can also write to ${SUPPORT_EMAIL}.`} />
      <section className="band"><div className="wrap">
        <div className="contact-grid"><div className="ccard">
          <h3>Send us a message</h3>
          <p>Fill in the form and it goes straight to our support team.</p>
          <ContactForm />
        </div></div>
      </div></section>
    </>
  );
}
