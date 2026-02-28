import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getAuth } from '$lib/server/auth';

export const actions = {
  default: async ({ request }) => {
    await getAuth().api.signOut({ headers: request.headers });
    redirect(303, '/login');
  }
} satisfies Actions;
