import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getTransfers, createTransfer, updateTransfer, deleteTransfer, getAccessibleAccounts } from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [transfers, accounts] = await Promise.all([
    getTransfers(userId),
    getAccessibleAccounts(userId)
  ]);

  return { transfers, accounts, currentUserId: userId };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const userId = locals.user!.id;
    const fd = await request.formData();
    const fromAccountId = parseInt(fd.get('fromAccountId') as string);
    const toAccountId = parseInt(fd.get('toAccountId') as string);
    const label = (fd.get('label') as string)?.trim();
    const amount = fd.get('amount') as string;
    const dayOfMonth = parseInt(fd.get('dayOfMonth') as string) || 1;

    if (!label || !amount || isNaN(fromAccountId) || isNaN(toAccountId)) {
      return fail(400, { error: 'Tous les champs sont requis.' });
    }

    try {
      await createTransfer(userId, {
        fromAccountId,
        toAccountId,
        label,
        amount,
        dayOfMonth
      });
    } catch (e: unknown) {
      return fail(400, { error: (e as Error).message });
    }

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const userId = locals.user!.id;
    const fd = await request.formData();
    const id = parseInt(fd.get('id') as string);
    if (isNaN(id)) return fail(400, { error: 'ID invalide.' });

    await deleteTransfer(userId, id);
    return { success: true };
  },

  update: async ({ request, locals }) => {
    const userId = locals.user!.id;
    const fd = await request.formData();
    const id = parseInt(fd.get('id') as string);
    const fromAccountId = parseInt(fd.get('fromAccountId') as string);
    const toAccountId = parseInt(fd.get('toAccountId') as string);
    const label = (fd.get('label') as string)?.trim();
    const amount = fd.get('amount') as string;
    const dayOfMonth = parseInt(fd.get('dayOfMonth') as string) || 1;

    if (!label || !amount || isNaN(fromAccountId) || isNaN(toAccountId) || fromAccountId === toAccountId) {
      return fail(400, { error: 'Données invalides.' });
    }

    await updateTransfer(userId, id, { fromAccountId, toAccountId, label, amount, dayOfMonth });
    return { success: true };
  }
};
