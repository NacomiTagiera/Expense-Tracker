import { compare, hash } from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production',
);

const SESSION_COOKIE_NAME = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_EXPIRED_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

interface SessionCookieOptions {
  resHeaders?: Headers;
}

const isProduction = process.env.NODE_ENV === 'production';

const appendCookieHeader = (headers: Headers | undefined, value: string) => {
  if (!headers) return;
  headers.append('Set-Cookie', value);
};

const buildSessionCookie = (token: string) => {
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    `Expires=${expires.toUTCString()}`,
    isProduction ? 'Secure' : undefined,
  ]
    .filter(Boolean)
    .join('; ');
};

const buildExpiredSessionCookie = () =>
  [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    `Expires=${COOKIE_EXPIRED_DATE}`,
    isProduction ? 'Secure' : undefined,
  ]
    .filter(Boolean)
    .join('; ');

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createSession(
  payload: SessionPayload,
  options?: SessionCookieOptions,
): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  appendCookieHeader(options?.resHeaders, buildSessionCookie(token));

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
  } catch {
    // `cookies()` is unavailable outside of a request context; ignore in that case.
  }

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(
  options?: SessionCookieOptions,
): Promise<void> {
  appendCookieHeader(options?.resHeaders, buildExpiredSessionCookie());

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Ignore when `cookies()` cannot be accessed (e.g. outside request context).
  }
}
