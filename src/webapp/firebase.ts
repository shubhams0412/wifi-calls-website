'use client';

/* Phone sign-in with Firebase, as in the iOS app: Firebase texts the code and confirms it in
   the browser; our server then checks Firebase's ID token before signing in to the backend.
   Loaded on demand so the Firebase SDK isn't in the app's first download. */

import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

let pending: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

async function auth() {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  // Must be a Firebase *Web* app's config: an iOS app's API key fails phone sign-in with auth/invalid-app-credential.
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return getAuth(app);
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-phone-number': 'That phone number doesn’t look right. Check it and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/quota-exceeded': 'We can’t send codes right now. Please try again later.',
  'auth/invalid-verification-code': 'That code isn’t right. Check the text and try again.',
  'auth/code-expired': 'That code has expired. Send a new one.',
  'auth/captcha-check-failed': 'The security check failed. Reload the page and try again.',
  'auth/unauthorized-domain': 'Sign-in isn’t enabled for this website yet.',
  'auth/network-request-failed': 'You’re offline. Check your connection and try again.',
};
/** A readable message; unknown errors keep Firebase's code so support can tell what happened. */
export function firebaseMessage(error: unknown) {
  const code = (error as { code?: string })?.code ?? '';
  console.warn('[firebase]', code || error);
  return MESSAGES[code] ?? `We couldn’t send the code. Please try again.${code ? ` (${code.replace('auth/', '')})` : ''}`;
}

/** Texts a code to `phone` (E.164). `buttonId` hosts the invisible reCAPTCHA. Throws with a readable message. */
export async function sendCode(phone: string, buttonId: string): Promise<void> {
  const a = await auth();
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
  verifier?.clear();
  verifier = new RecaptchaVerifier(a, buttonId, { size: 'invisible' });
  try {
    pending = await signInWithPhoneNumber(a, phone, verifier);
  } catch (error) {
    verifier?.clear(); verifier = null;
    throw new Error(firebaseMessage(error));
  }
}

/** Confirms the code and returns the Firebase ID token to send to our server. */
export async function confirmCode(code: string): Promise<string> {
  if (!pending) throw new Error('Send a new code and try again.');
  try {
    const cred = await pending.confirm(code);
    return await cred.user.getIdToken();
  } catch (error) {
    throw new Error(firebaseMessage(error));
  }
}

/** Signs out of Firebase too (the backend session is ended by DELETE /api/wc/session). */
export async function firebaseSignOut() {
  try { const a = await auth(); const { signOut } = await import('firebase/auth'); await signOut(a); } catch { /* not signed in */ }
  pending = null;
}
