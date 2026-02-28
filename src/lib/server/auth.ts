import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (_auth) return _auth;
  _auth = betterAuth({
    baseURL: env.ORIGIN,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: 'pg' }),
    emailAndPassword: { enabled: true },
    plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
  });
  return _auth;
}
