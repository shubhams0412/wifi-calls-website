/* Site-wide constants for the marketing website. */

/** Public base URL used for canonical links, the sitemap and RSS. Set NEXT_PUBLIC_SITE_URL on Vercel
    when the site moves to its own domain (e.g. https://wifiphonecalls.com). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://wifi-calls-web.vercel.app').replace(/\/$/, '');
export const BRAND = 'Wi-Fi Calling & Texting';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6781677176';
export const SUPPORT_EMAIL = 'support@wifiphonecalls.com';

/** The web app (calls, texts and chat in the browser) is a separate project and deployment (branch `webapp`).
    Set NEXT_PUBLIC_WEBAPP_URL on Vercel to its address, e.g. https://app.wifiphonecalls.com. */
export const WEB_APP_ORIGIN = (process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://wifi-calls-web.vercel.app').replace(/\/$/, '');
/** Absolute URL of a web app screen, e.g. webApp('/dial'). The web app lives under /app on its own domain. */
export const webApp = (path = '') => `${WEB_APP_ORIGIN}/app${path}`;

/** Absolute URL for a site path. */
export const abs = (path: string) => SITE_URL + (path.startsWith('/') ? path : '/' + path);
