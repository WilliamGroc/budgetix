import type { Actions, PageServerLoad } from './$types';
import { getIncomes, createIncome, updateIncome, deleteIncome, getAccessibleAccounts } from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const [incomes, accounts] = await Promise.all([
    getIncomes(locals.user!.id),
    getAccessibleAccounts(locals.user!.id)
  ]);
  return { incomes, accounts };
};

export const actions = {
  create: async ({ request, locals }) => {
    const fd = await request.formData();
    await createIncome(locals.user!.id, {
      bankAccountId: Number(fd.get('bankAccountId')),
      label: fd.get('label') as string,
      amount: fd.get('amount') as string,
      dayOfMonth: Number(fd.get('dayOfMonth'))
    });
    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const fd = await request.formData();
    await deleteIncome(locals.user!.id, Number(fd.get('id')));
    return { success: true };
  },

  update: async ({ request, locals }) => {
    const fd = await request.formData();
    await updateIncome(locals.user!.id, Number(fd.get('id')), {
      bankAccountId: Number(fd.get('bankAccountId')),
      label: fd.get('label') as string,
      amount: fd.get('amount') as string,
      dayOfMonth: Number(fd.get('dayOfMonth'))
    });
    return { success: true };
  }
} satisfies Actions;
