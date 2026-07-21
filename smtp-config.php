<?php
/**
 * SMTP settings for the contact form. Gitignored — never commit this file.
 *
 * TEMPORARY TEST CONFIG — a throwaway Gmail account, not the real mailbox.
 * When support@wifiphonecalls.com exists, replace the six values below with the
 * real mailbox settings (see smtp-config.example.php for the intended shape) and
 * revoke this app password at myaccount.google.com/apppasswords.
 */

return [
    // --- SMTP server ---
    'host'     => 'smtp.gmail.com',
    'port'     => 587,
    'secure'   => 'tls',                        // 587 = tls (STARTTLS); 465 = ssl
    'username' => 'support@wifiphonecalls.com',
//    'password' => 'bgxcuezjdirekopb',           // Gmail app password, not the login password

    // --- Envelope ---
    // Gmail only sends as an address verified on the authenticated account, so
    // from_email must match username here. With the real domain mailbox this
    // becomes support@wifiphonecalls.com — sending as the visitor would fail
    // SPF/DKIM and land in spam. send.php puts the visitor in Reply-To either way.
    'from_email' => 'support@wifiphonecalls.com',
    'from_name'  => 'Wi-Fi Calling Website',
    'to_email'   => 'support@wifiphonecalls.com', // test inbox — enquiries land here

    // --- Optional ---
    'debug' => false, // writes the SMTP conversation to the PHP error log
];
