import 'server-only';
import { randomUUID } from 'crypto';
import { cookies, headers } from 'next/headers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Device } from './api';

/*
 * The web app's session: the backend `auth_key` lives in an httpOnly cookie, so page scripts
 * can't read it, and the device id in a long-lived cookie, so each browser is one "device" on
 * the account (the Devices screen and logout work per device, as on iOS).
 */

const AUTH = 'wc_ak';
const DEVICE = 'wc_dev';
const YEAR = 60 * 60 * 24 * 365;
const secure = process.env.NODE_ENV === 'production';

export async function authKey(): Promise<string | null> {
  return (await cookies()).get(AUTH)?.value ?? null;
}

export async function setAuthKey(value: string) {
  (await cookies()).set(AUTH, value, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: YEAR });
}

export async function clearAuthKey() {
  (await cookies()).delete(AUTH);
}

/** This browser as a backend device: a stable id, and a readable name from the user agent. */
export async function device(): Promise<Device> {
  const jar = await cookies();
  let id = jar.get(DEVICE)?.value;
  if (!id) {
    id = 'web-' + randomUUID();
    jar.set(DEVICE, id, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: YEAR });
  }
  const ua = (await headers()).get('user-agent') ?? '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) && !/Mobile/.test(ua) ? 'macOS' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'Web';
  return { id, name: `${browser} on ${os} (web)`, os };
}

const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

/**
 * Checks a Firebase ID token from the browser and returns the verified phone number (E.164).
 * The backend's signInWithFirebase trusts whatever number it's sent, so this check is what
 * stops someone from signing in as another person's number through our proxy.
 */
export async function verifiedPhone(idToken: string): Promise<string | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, {
      audience: project,
      issuer: `https://securetoken.google.com/${project}`,
      maxTokenAge: '1h',
    });
    const phone = payload.phone_number;
    return typeof phone === 'string' && /^\+\d{6,15}$/.test(phone) ? phone : null;
  } catch {
    return null;
  }
}
