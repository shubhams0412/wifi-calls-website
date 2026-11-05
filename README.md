# Wi-Fi Calling & Texting — Website

Next.js (App Router, TypeScript) marketing website: home, features, use cases, numbers,
international calling, plans, FAQ, blog, download, contact, Privacy and Terms.

The **web app** (calls, texts and chat in the browser) is a separate project on branch `webapp`.
This site doesn't link to it.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run typecheck`.

## Deploy (Vercel)

1. Import the repository in Vercel and pick branch `website` (framework: Next.js).
2. Set the environment variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | This site's public address, for canonical links, the sitemap and RSS |
| `SMTP_*` | Contact form (see `.env.example`) |
| `CMS_*` | Blog (see "Blog" below) |

3. Deploy.

## Project layout

```
src/
  app/
    (site)/            website pages
    api/contact/       contact form → SMTP (replaces the old send.php)
    api/revalidate/    on-demand blog refresh from the CMS
  components/site/     website components (nav, footer, hero animation, contact form, blog)
  components/icons.tsx shared icon set
  site/                config, blog client, menu, page content
  styles/              globals.css, site.css (scoped under .site-root)
content/blog/          fallback Markdown articles
public/                static assets
```

## Blog

Articles come from the blog admin panel (repo `1140_2nd_phone_number_admin_panel`), through its
Laravel public API: `GET v1/posts`, `GET v1/posts/{slug}`, `GET v1/sitemap`. Responses are
encrypted (`X-Blog-Encryption: rncryptor-v3` or `aes-256-cbc`); `src/site/blog.ts` decrypts both.
Our own backend: `https://staging-server.worksqr.com/002099-wificalls-Backend/public/api` (aes-256-cbc).

| Variable | Purpose |
| --- | --- |
| `CMS_API_URL` | API base, e.g. `https://secondphonenumber.worksqr.com/api` (testing) |
| `CMS_ENCRYPTION_KEY` | Blog API key. Server-only. Without it, `/blog` uses `content/blog/*.md` |
| `CMS_ENCRYPTION_IV` | Only for backends that answer `X-Blog-Encryption: aes-256-cbc` (WiFi Calls Symfony API): the IV seed |

Pages refresh at most once a minute (ISR), so a newly published article appears without a redeploy.
`/blog` supports `?category=<slug>` and `?page=<n>`; moved slugs redirect; FAQ, CTA, author and
related articles come from the CMS. Set both variables in Vercel → Settings → Environment Variables.
