# Wi-Fi Calling & Texting — Website + Web App

Next.js (App Router, TypeScript) project containing:

- **Website** — home, Privacy, Terms and a contact form (`/`, `/privacy`, `/terms`).
- **Web app** — the iOS app's screens rebuilt for the browser (`/app`): onboarding, paywall,
  login, Dial, Calls, Messages, Contacts and Settings.

> The web app currently runs on **demo data** stored in the browser (`localStorage`).
> Connecting it to the real backend is the next phase (see "Real API" below).

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:3000  (web app: http://localhost:3000/app)
```

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run typecheck`.

## Deploy (Vercel)

1. Import the repository in Vercel (framework: Next.js, no extra settings needed).
2. Add the environment variables from `.env.example` (only needed for the contact form).
3. Deploy.

## Project layout

```
src/
  app/
    (site)/            website pages: /, /privacy, /terms
    api/contact/       contact form → SMTP (replaces the old send.php)
    app/               web app routes: /app/dial, /app/calls/…, /app/messages/…, /app/contacts/…, /app/settings/…
  components/site/     website components (nav, footer, hero animation, contact form)
  webapp/
    data.ts            types + demo data
    store.ts           app data store (zustand, persisted to localStorage)
    ui.ts              sheets, dialogs, toasts, call/paywall/buy-number state, action gates
    components/        shell (sidebar / tab bar), overlays, shared UI, pickers
    flows/             splash, onboarding, rating, paywall, login, permissions
    calls/             dial pad, recents, voicemail, in-call screens, recordings
    messages/          SMS + chat threads, broadcasts, groups, buy number
    contacts/          friends, phonebook, contact details
    settings/          settings and all sub-screens, support bot
  styles/              site.css and wa-*.css (scoped under .site-root / .wa-root)
public/                static assets (app icon)
```

Website styles are scoped under `.site-root` and web-app styles under `.wa-root`, so both
can live in one app without class-name clashes.

## Demo tips

- Any phone number and any 6-digit code log you in.
- **Settings → Reset demo data** starts again from onboarding.

## Real API (next phase)

The iOS app talks to `…/api/v1/wsqr_*` endpoints with AES-256-CBC encrypted bodies and an
encrypted HS256 JWT in the `authToken` header. Those secrets must **never** reach the browser:
the plan is Next.js route handlers (`src/app/api/…`) that hold the secrets in environment
variables, encrypt/sign requests, keep the user's `authKey` in an httpOnly session cookie,
and forward to the backend. Still needed: the Firebase **web** app config for SMS login.
