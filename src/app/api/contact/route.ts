/**
 * Contact form endpoint (replaces send.php). Receives JSON and relays it over SMTP.
 *
 * Configure with environment variables (Vercel → Project → Settings → Environment Variables):
 *   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_SECURE ("ssl" for 465, "tls" for 587),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM (defaults to SMTP_USER), SMTP_FROM_NAME, SMTP_TO (defaults to SMTP_FROM)
 * Responds { ok: true } or { ok: false, error: "<message shown to the visitor>" }.
 */
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const SUPPORT_EMAIL = 'support@wifiphonecalls.com';
const json = (status: number, body: object) => Response.json(body, { status, headers: { 'X-Content-Type-Options': 'nosniff' } });

/** Strip CR/LF so a crafted name or subject can't inject extra mail headers. */
const oneLine = (v: unknown) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return json(422, { ok: false, error: 'Please fill in every field so we can help.' });
  }

  // Honeypot: anything in it is a bot. Answer 200 so it doesn't retry, and log the trip —
  // if autofill ever starts filling the trap, this log is the only trace of dropped messages.
  if (String(data.hp_check ?? '').trim() !== '') {
    console.warn('contact: honeypot tripped — message discarded. IP', req.headers.get('x-forwarded-for') ?? 'unknown');
    return json(200, { ok: true });
  }

  const name = oneLine(data.name);
  const email = oneLine(data.email);
  const subject = oneLine(data.subject);
  const message = String(data.message ?? '').trim();

  if (!name || !email || !subject || !message) return json(422, { ok: false, error: 'Please fill in every field so we can help.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(422, { ok: false, error: "That email address doesn't look right." });
  if (name.length > 100 || email.length > 254 || subject.length > 150 || message.length > 5000) {
    return json(422, { ok: false, error: 'That message is too long — please shorten it and try again.' });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME, SMTP_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('contact: SMTP_* environment variables are not set.');
    return json(503, { ok: false, error: `Email sending isn't set up yet. Please write to ${SUPPORT_EMAIL} directly.` });
  }

  const port = Number(SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: (SMTP_SECURE || (port === 465 ? 'ssl' : 'tls')).toLowerCase() === 'ssl',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
  });

  const from = SMTP_FROM || SMTP_USER;
  try {
    // From must be our own mailbox or SPF/DKIM fail; the visitor goes in Reply-To.
    await transport.sendMail({
      from: { name: SMTP_FROM_NAME || 'Website', address: from },
      to: SMTP_TO || from,
      replyTo: { name: name || email, address: email },
      subject: `Website contact: ${subject}`,
      text:
        `Name:    ${name}\nEmail:   ${email}\nSubject: ${subject}\nSent:    ${new Date().toUTCString()}\n` +
        `IP:      ${req.headers.get('x-forwarded-for') ?? 'unknown'}\n${'-'.repeat(48)}\n\n${message}\n`,
    });
    return json(200, { ok: true });
  } catch (err) {
    console.error('contact: SMTP send failed —', err);
    return json(502, { ok: false, error: `Sorry, we couldn't send that. Please email ${SUPPORT_EMAIL} directly.` });
  }
}

export function GET() {
  return json(405, { ok: false, error: 'Method not allowed.' });
}
