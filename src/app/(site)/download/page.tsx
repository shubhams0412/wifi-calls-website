import type { Metadata } from 'next';
import { CtaBand, Highlights, PageHero, StoreButton } from '@/components/site/blocks';

export const metadata: Metadata = {
  title: 'Download',
  description: 'Get Wi-Fi Calling & Texting on iPhone from the App Store, or use it in your browser with the web app. Your number and chats work on both.',
  alternates: { canonical: '/download' },
};

export default function DownloadPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Download' }]} eyebrow="Download" icon="download"
        title="Get the app" intro="Available on iPhone, and in any modern browser with the web app.">
        <StoreButton light />
      </PageHero>
      <section className="band"><div className="wrap">
        <Highlights items={[
          { icon: 'iphone', title: 'iPhone', text: 'Download from the App Store and sign in with your phone number.' },
          { icon: 'desktop', title: 'Web', text: 'Open the web app on your computer — calls, texts and chats in the browser.' },
          { icon: 'devices', title: 'Your devices', text: 'See and manage every signed-in device in Settings → Account → My Devices.' },
        ]} />
      </div></section>
      <CtaBand />
    </>
  );
}
