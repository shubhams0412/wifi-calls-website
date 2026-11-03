import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Wi-Fi Calling and Texting — Free Calls, Texts & a Private Number',
  description:
    'Wi-Fi Calling and Texting gives you a private phone number and free app-to-app calling and messaging over any Wi-Fi or data connection — no extra SIM, no carrier plan.',
  icons: { icon: '/app-icon.png' },
};

export const viewport: Viewport = { themeColor: '#5B2C9F', width: 'device-width', initialScale: 1 };

// Applies the saved light/dark choice before first paint (shared by the site and the web app).
const themeScript = `try{var t=localStorage.getItem('wificalls-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
