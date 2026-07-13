import type { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from './types';
import { sha256Hex } from './crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // ۷ روز

async function signSession(secret: string): Promise<string> {
  const issuedAt = Date.now().toString();
  const sig = await sha256Hex(`${secret}:${issuedAt}`);
  return `${issuedAt}.${sig}`;
}

async function verifySession(token: string, secret: string): Promise<boolean> {
  const [issuedAt, sig] = token.split('.');
  if (!issuedAt || !sig) return false;

  const expected = await sha256Hex(`${secret}:${issuedAt}`);
  if (expected !== sig) return false;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  return age >= 0 && age < SESSION_TTL_SECONDS;
}

export async function login(c: Context<{ Bindings: Env }>): Promise<Response> {
  const { password } = await c.req.json<{ password: string }>();

  if (!password || password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: 'رمز عبور اشتباه است' }, 401);
  }

  const token = await signSession(c.env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });

  return c.json({ ok: true });
}

export function logout(c: Context<{ Bindings: Env }>): Response {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
}

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token || !(await verifySession(token, c.env.SESSION_SECRET))) {
    return c.json({ error: 'ورود لازم است' }, 401);
  }
  await next();
}
