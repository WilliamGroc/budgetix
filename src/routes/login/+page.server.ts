import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/dashboard');
  return {};
};

export const actions: Actions = {
  signIn: async ({ request }) => {
    const fd = await request.formData();
    try {
      await auth.api.signInEmail({
        body: {
          email: fd.get('email') as string,
          password: fd.get('password') as string
        }
      });
    } catch (e) {
      const msg = e instanceof APIError ? e.message : 'Erreur inattendue';
      return fail(400, { message: msg });
    }
    redirect(303, '/dashboard');
  },

  signUp: async ({ request }) => {
    const fd = await request.formData();
    try {
      await auth.api.signUpEmail({
        body: {
          email: fd.get('email') as string,
          password: fd.get('password') as string,
          name: fd.get('name') as string
        }
      });
    } catch (e) {
      const msg = e instanceof APIError ? e.message : 'Erreur inattendue';
      return fail(400, { message: msg });
    }
    redirect(303, '/dashboard');
  }
};
