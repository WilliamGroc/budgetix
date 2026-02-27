import type { Actions, PageServerLoad } from './$types';
import { getExpensesWithShares, createExpense, updateExpense, deleteExpense, getAccessibleAccounts, getLinkedUsers, toggleExpenseRealized } from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [expenses, accounts, linkedUsers] = await Promise.all([
    getExpensesWithShares(),
    getAccessibleAccounts(userId),
    getLinkedUsers(userId)
  ]);
  return { expenses, accounts, linkedUsers };
};

export const actions = {
  create: async ({ request, locals }) => {
    const fd = await request.formData();
    const isShared = fd.get('isShared') === 'on';
    const isProrata = fd.get('isProrata') === 'on';

    const participantIds = (fd.getAll('participantId') as string[]).filter(Boolean);
    const participantShares = (fd.getAll('participantShare') as string[]).filter(Boolean);
    const participants = participantIds.map((userId, i) => ({
      userId,
      sharePercentage: participantShares[i] ?? '50'
    }));

    await createExpense(locals.user!.id, {
      bankAccountId: Number(fd.get('bankAccountId')),
      label: fd.get('label') as string,
      amount: fd.get('amount') as string,
      category: (fd.get('category') as string) || undefined,
      dayOfMonth: Number(fd.get('dayOfMonth')),
      isShared,
      isProrata,
      participants: isShared ? participants : undefined
    });
    return { success: true };
  },

  delete: async ({ request }) => {
    const fd = await request.formData();
    await deleteExpense(Number(fd.get('id')));
    return { success: true };
  },

  update: async ({ request }) => {
    const fd = await request.formData();
    await updateExpense(Number(fd.get('id')), {
      bankAccountId: Number(fd.get('bankAccountId')),
      label: fd.get('label') as string,
      amount: fd.get('amount') as string,
      category: (fd.get('category') as string) || null,
      dayOfMonth: Number(fd.get('dayOfMonth'))
    });
    return { success: true };
  },

  toggleRealized: async ({ request }) => {
    const fd = await request.formData();
    const id = Number(fd.get('id'));
    const isRealized = fd.get('isRealized') === 'true';
    await toggleExpenseRealized(id, isRealized);
    return { success: true };
  }
} satisfies Actions;
