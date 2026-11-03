import type { Metadata } from 'next';
import WebApp from '@/webapp/components/WebApp';
import '@/styles/wa-app.css';
import '@/styles/wa-flows.css';
import '@/styles/wa-screens.css';
import '@/styles/wa-next.css';
import '@/styles/wa-x-flows.css';
import '@/styles/wa-x-calls.css';
import '@/styles/wa-x-messages.css';
import '@/styles/wa-x-settings.css';
import '@/styles/wa-scale.css';

export const metadata: Metadata = {
  title: 'Wi-Fi Calling & Texting — Web',
  description: 'Your private number, free app-to-app calls and chat, SMS and voicemail in the browser.',
};

/** The web app (/app/*). All its styles are scoped under .wa-root. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WebApp>{children}</WebApp>;
}
