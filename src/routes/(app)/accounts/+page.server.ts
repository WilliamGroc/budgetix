import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAccounts, createAccount, updateAccount, deleteAccount, shareAccount, unshareAccount, getLinkedUsers } from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [{ owned, shared }, linkedUsers] = await Promise.all([
    getAccounts(userId),
    getLinkedUsers(userId)
  ]);
  return { owned, shared, linkedUsers };
};

export const actions = {
  create: async ({ request, locals }) => {
    const fd = await request.formData();
    await createAccount(locals.user!.id, {
      name: fd.get('name') as string,
      type: fd.get('type') as 'personal' | 'savings' | 'common',
      initialBalance: fd.get('initialBalance') as string,
      color: (fd.get('color') as string) || undefined
    });
    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const fd = await request.formData();
    await deleteAccount(locals.user!.id, Number(fd.get('id')));
    return { success: true };
  },

  update: async ({ request, locals }) => {
    const fd = await request.formData();
    const rawCurrentBalance = fd.get('currentBalance') as string | null;
    await updateAccount(locals.user!.id, Number(fd.get('id')), {
      name: fd.get('name') as string,
      type: fd.get('type') as 'personal' | 'savings' | 'common',
      initialBalance: fd.get('initialBalance') as string,
      color: (fd.get('color') as string) || undefined,
      currentBalance: rawCurrentBalance !== '' && rawCurrentBalance !== null ? rawCurrentBalance : null
    });
    return { success: true };
  },

  share: async ({ request, locals }) => {
    const fd = await request.formData();
    try {
      await shareAccount(
        locals.user!.id,
        Number(fd.get('accountId')),
        fd.get('targetUserId') as string
      );
    } catch (e) {
      return fail(400, { message: (e as Error).message });
    }
    return { success: true };
  },

  unshare: async ({ request, locals }) => {
    const fd = await request.formData();
    await unshareAccount(
      locals.user!.id,
      Number(fd.get('accountId')),
      fd.get('targetUserId') as string
    );
    return { success: true };
  }
} satisfies Actions;
