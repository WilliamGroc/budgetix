import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  sendLinkRequest,
  getPendingRequests,
  getSentRequests,
  getLinkedUsers,
  acceptLinkRequest,
  declineLinkRequest
} from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [pending, sent, linked] = await Promise.all([
    getPendingRequests(userId),
    getSentRequests(userId),
    getLinkedUsers(userId)
  ]);
  return { pending, sent, linked };
};

export const actions = {
  send: async ({ request, locals }) => {
    const fd = await request.formData();
    try {
      await sendLinkRequest(locals.user!.id, fd.get('email') as string);
    } catch (e) {
      return fail(400, { message: (e as Error).message });
    }
    return { success: true };
  },

  accept: async ({ request, locals }) => {
    const fd = await request.formData();
    await acceptLinkRequest(locals.user!.id, Number(fd.get('id')));
    return { success: true };
  },

  decline: async ({ request, locals }) => {
    const fd = await request.formData();
    await declineLinkRequest(locals.user!.id, Number(fd.get('id')));
    return { success: true };
  }
} satisfies Actions;
