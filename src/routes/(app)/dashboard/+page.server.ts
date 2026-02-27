import type { PageServerLoad } from './$types';
import { getDashboard, getCommonAccountSuggestions } from '$lib/server/budget';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [accounts, suggestions] = await Promise.all([
    getDashboard(userId),
    getCommonAccountSuggestions(userId)
  ]);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  return { accounts, totalBalance, suggestions };
};
