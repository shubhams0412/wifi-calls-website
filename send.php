<?php
/**
 * Contact form endpoint — receives JSON from script.js and relays it over SMTP.
 *
 * Credentials live in smtp-config.php (gitignored, see smtp-config.example.php).
 * Responds with JSON: {ok: true} or {ok: false, error: "<message shown to user>"}.
 */

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

// Never render PHP warnings into the JSON body — they'd corrupt it and leak paths.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const SUPPORT_EMAIL = 'support@wifiphonecalls.com';

/** Send a JSON response and stop. */
function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Strip CR/LF so a crafted name or subject can't inject extra mail headers. */
function oneLine(string $value): string
{
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

/* ---------- input ----------
   Screened before the config is even loaded, so bots and junk are turned away
   without learning anything about how the server is set up. */

$data = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($data)) {
    $data = $_POST; // tolerate a normal form post too
}

// Honeypot: a hidden field real people never see, so anything in it is a bot.
// Answer 200 so the bot believes it succeeded and doesn't retry.
// This branch throws the message away, so log every trip: if browser autofill ever
// starts filling the trap again, these lines are the only trace that real people's
// messages are being dropped behind a "thanks, it's on its way".
if (trim((string) ($data['hp_check'] ?? '')) !== '') {
    error_log('send.php: honeypot tripped — message discarded. IP ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    respond(200, ['ok' => true]);
}

$name    = oneLine((string) ($data['name'] ?? ''));
$email   = oneLine((string) ($data['email'] ?? ''));
$subject = oneLine((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? '')); // newlines are wanted here

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    respond(422, ['ok' => false, 'error' => 'Please fill in every field so we can help.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'That email address doesn\'t look right.']);
}
// Bound the sizes so a bot can't post megabytes through the mail server.
if (mb_strlen($name) > 100 || mb_strlen($email) > 254 || mb_strlen($subject) > 150 || mb_strlen($message) > 5000) {
    respond(422, ['ok' => false, 'error' => 'That message is too long — please shorten it and try again.']);
}

/* ---------- config ---------- */

$configPath = __DIR__ . '/smtp-config.php';
if (!is_file($configPath)) {
    error_log('send.php: smtp-config.php is missing — copy smtp-config.example.php and fill it in.');
    respond(503, ['ok' => false, 'error' => 'Email sending isn\'t set up yet. Please write to ' . SUPPORT_EMAIL . ' directly.']);
}

$cfg = require $configPath;
if (!is_array($cfg) || empty($cfg['host']) || empty($cfg['username']) || empty($cfg['password'])) {
    error_log('send.php: smtp-config.php is incomplete — host, username and password are all required.');
    respond(503, ['ok' => false, 'error' => 'Email sending isn\'t set up yet. Please write to ' . SUPPORT_EMAIL . ' directly.']);
}

/* ---------- send ---------- */

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = (string) $cfg['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = (string) $cfg['username'];
    $mail->Password   = (string) $cfg['password'];
    $mail->Port       = (int) ($cfg['port'] ?? 465);
    $mail->CharSet    = PHPMailer::CHARSET_UTF8;
    $mail->Timeout    = 15;

    $secure = strtolower((string) ($cfg['secure'] ?? 'ssl'));
    $mail->SMTPSecure = $secure === 'tls'
        ? PHPMailer::ENCRYPTION_STARTTLS
        : PHPMailer::ENCRYPTION_SMTPS;

    if (!empty($cfg['debug'])) {
        $mail->SMTPDebug   = SMTP::DEBUG_CONNECTION;
        $mail->Debugoutput = 'error_log';
    }

    // From must be our own mailbox or SPF/DKIM fail and this lands in spam.
    // The visitor's address goes in Reply-To, so hitting Reply answers them.
    $mail->setFrom((string) $cfg['from_email'], (string) ($cfg['from_name'] ?? 'Website'));
    $mail->addAddress((string) ($cfg['to_email'] ?? $cfg['from_email']));
    $mail->addReplyTo($email, $name !== '' ? $name : $email);

    $mail->Subject = 'Website contact: ' . $subject;

    $body = "Name:    {$name}\n"
          . "Email:   {$email}\n"
          . "Subject: {$subject}\n"
          . "Sent:    " . date('D, d M Y H:i:s T') . "\n"
          . "IP:      " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n"
          . str_repeat('-', 48) . "\n\n"
          . $message . "\n";

    $mail->isHTML(false);
    $mail->Body = $body;

    $mail->send();
    respond(200, ['ok' => true]);
} catch (Exception $e) {
    // Log the real reason; show the visitor something useful but not internal.
    error_log('send.php: SMTP send failed — ' . $mail->ErrorInfo);
    respond(502, ['ok' => false, 'error' => 'Sorry, we couldn\'t send that. Please email ' . SUPPORT_EMAIL . ' directly.']);
}
