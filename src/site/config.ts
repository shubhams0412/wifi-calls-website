/* Site-wide constants for the marketing website. */

/** Public base URL used for canonical links, the sitemap and RSS. Set NEXT_PUBLIC_SITE_URL on Vercel
    when the site moves to its own domain (e.g. https://wifiphonecalls.com). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://wifi-calls-web.vercel.app').replace(/\/$/, '');
export const BRAND = 'Wi-Fi Calling & Texting';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6781677176';
export const SUPPORT_EMAIL = 'support@wifiphonecalls.com';

/** Absolute URL for a site path. */
export const abs = (path: string) => SITE_URL + (path.startsWith('/') ? path : '/' + path);
