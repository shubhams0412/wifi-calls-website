# Contact form — SMTP setup

The contact form POSTs JSON to `send.php`, which relays the message over SMTP
using PHPMailer (vendored in `lib/PHPMailer/`, no Composer needed).

## Current state — temporary test config

`smtp-config.php` exists and holds a **throwaway Gmail account**, not the real
mailbox. The whole path is verified working end to end (browser → `send.php` →
Gmail → inbox, not spam). `'debug' => true` is on.

Two things to do when the real mailbox arrives: replace the six values, and
revoke the Gmail app password at <https://myaccount.google.com/apppasswords>.

`smtp-config.php` is gitignored, so it will never show up in `git status` to
remind you it's still pointing at a test account.

## Before support@wifiphonecalls.com can work — read this first

**The domain cannot send mail today, and buying "the mailbox" may not be what you
think you're buying.** Checked 17 Jul 2026:

- MX → `eforward1–5.registrar-servers.com`
- SPF → `v=spf1 include:spf.efwd.registrar-servers.com ~all`

That's Namecheap's free **Email Forwarding**: receive-and-relay only. It has no
mailbox, no login, and **no outgoing SMTP** — so there is no username/password
to put in `smtp-config.php`, no matter how the forwarding is configured.

Worse, forwarding isn't even set up yet. All four MX hosts answer `554 5.7.1
Relay access denied` for `support@` *and* for a made-up address — the same
rejection for both, meaning "this domain isn't handled here" rather than "no such
user". **Mail to support@wifiphonecalls.com currently bounces.** Which matters:
the 503 error text tells visitors to write to that address directly.

What's actually needed is a **real mailbox** on the domain — Namecheap Private
Email (`mail.privateemail.com`, 465/ssl) is the least friction since the domain
is already there; Zoho or Google Workspace work too. Any of them issues the five
values `smtp-config.php` wants.

Then update DNS, or mail lands in spam:

- **SPF** currently authorises only the forwarding service. Add the new provider.
- **DMARC** doesn't exist at all (`_dmarc.wifiphonecalls.com` is empty). Add one.

## Filling in the config

1. On the server: `cp smtp-config.example.php smtp-config.php`
2. Fill in host, port, `secure`, username (the full address), password.
3. Done — `send.php` picks it up on the next request. No code changes, ever.

**Never commit the password.**

### Port / encryption pairs
Must match:

| Port | `secure` |
|------|----------|
| 465  | `'ssl'`  |
| 587  | `'tls'`  |

### from_email
Must be a mailbox you authenticate as. Gmail rejects or rewrites anything else;
on the real domain it must be the domain's own address, or SPF/DKIM fail. The
visitor goes in **Reply-To** — hitting Reply still answers them directly.
Sending *from* the visitor's address would be the obvious approach and is wrong.

## Testing

`file://` will not work — PHP must execute. Locally:

```
cd ~/Documents/wificalls-website
php -S localhost:8000
```

If sending fails, `'debug' => true` writes the whole SMTP conversation to the PHP
error log (the `php -S` terminal locally). Turn it off in production.

Response codes worth knowing when reading the log:

| Code | Meaning |
|------|---------|
| 200  | Sent — *or* honeypot tripped (see below) |
| 422  | Validation: empty field, bad email, too long |
| 503  | `smtp-config.php` missing or has no password |
| 502  | PHPMailer ran, SMTP refused it — real reason is in the error log |

## What's protected

- **Credentials** — gitignored, `chmod 600`, blocked from HTTP by `.htaccess`.
- **Header injection** — CR/LF stripped from name/email/subject.
- **Oversized posts** — length caps on every field, rejected with `422`.
- **Spam** — hidden honeypot field `hp_check`; bots that fill it get a fake `200`
  success and the message is silently dropped.

### The honeypot bites back — don't undo this

It was originally named `website` with a `<label>Leave this field empty</label>`.
Chrome autofill matched on exactly that name and label text, filled the hidden
trap, and `send.php` binned a **real** submission while telling the browser
"thanks, it's on its way". Silent, invisible, no bounce — lost support mail.

So: it is now named `hp_check` (no autofill heuristic matches), has no label, and
is `readonly` — browsers and password managers won't write to a readonly field,
while a bot POSTing straight to `send.php` never sees the attribute.

Every honeypot trip is logged (`send.php: honeypot tripped`). That branch destroys
a message, so the log is the only evidence if autofill ever defeats it again. If
users report "I sent a message and got no reply", grep for that line first.
