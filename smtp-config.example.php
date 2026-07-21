<?php
/**
 * SMTP settings for the contact form — TEMPLATE.
 *
 * SETUP: copy this file to `smtp-config.php` and replace the values below with
 * real ones. `smtp-config.php` is gitignored; this template is committed, which
 * is why it must never contain a real password.
 *
 *   cp smtp-config.example.php smtp-config.php
 *
 * Until `smtp-config.php` exists and has a password, send.php returns a 503 and
 * the form tells visitors to email support@wifiphonecalls.com directly.
 *
 * ---------------------------------------------------------------------------
 * READ FIRST — the domain cannot send mail yet (checked 17 Jul 2026).
 *
 * wifiphonecalls.com's MX points at eforward1-5.registrar-servers.com: Namecheap
 * free Email Forwarding. That is receive-only — no mailbox, no login, and no
 * outgoing SMTP. It will never issue the username/password this file wants, so
 * configuring forwarding does NOT unblock the contact form.
 *
 * A real mailbox is required. The values below are Namecheap Private Email —
 * a placeholder, chosen only because the domain is already at Namecheap. Zoho or
 * Google Workspace work equally well; use whatever your provider's mail config
 * page lists, and update SPF (it currently authorises only the forwarder) or the
 * mail will land in spam. See SMTP-SETUP.md.
 * ---------------------------------------------------------------------------
 */

return [
    // --- SMTP server (from your provider's mail config page) ---
    'host'     => 'mail.privateemail.com', // Namecheap Private Email; Zoho = smtp.zoho.com, Workspace = smtp.gmail.com
    'port'     => 465,                     // 465 with 'ssl', or 587 with 'tls' — they must match
    'secure'   => 'ssl',                   // 'ssl' | 'tls'
    'username' => 'support@wifiphonecalls.com', // usually the full mailbox address
    'password' => '',                      // mailbox password — fill this in, never commit it

    // --- Envelope ---
    // from_email MUST be a mailbox you authenticate as, on your own domain.
    // Sending as the visitor is the obvious approach and is wrong: it fails
    // SPF/DKIM and lands in spam. send.php puts the visitor in Reply-To instead,
    // so hitting Reply in the inbox still answers them directly.
    'from_email' => 'support@wifiphonecalls.com',
    'from_name'  => 'Wi-Fi Calling Website',
    'to_email'   => 'support@wifiphonecalls.com', // where enquiries are delivered

    // --- Optional ---
    'debug' => false, // true = write the SMTP conversation to the PHP error log; off in production
];
