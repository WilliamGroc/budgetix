import { getDb } from './db';
import {
  bankAccount,
  bankAccountShare,
  income,
  expense,
  expenseParticipant,
  userLink,
  scheduledTransfer,
  user
} from './db/schema';
import { eq, and, or } from 'drizzle-orm';

// ─── Comptes ──────────────────────────────────────────────────────────────────

/** Comptes possédés + comptes partagés avec cet utilisateur */
export async function getAccounts(userId: string) {
  const [owned, sharedRows] = await Promise.all([
    getDb().query.bankAccount.findMany({
      where: eq(bankAccount.userId, userId),
      with: { shares: { with: { sharedWithUser: true } } },
      orderBy: bankAccount.createdAt
    }),
    getDb().query.bankAccountShare.findMany({
      where: eq(bankAccountShare.sharedWithUserId, userId),
      with: { bankAccount: { with: { user: true } } }
    })
  ]);

  const shared = sharedRows.map((s) => ({
    ...s.bankAccount,
    shares: [] as typeof owned[0]['shares'],
    _sharedBy: s.bankAccount.user
  }));

  return { owned, shared };
}

export async function createAccount(
  userId: string,
  data: { name: string; type: 'personal' | 'savings' | 'common'; initialBalance: string; color?: string }
) {
  return getDb().insert(bankAccount).values({ userId, ...data }).returning();
}

export function updateAccount(
  userId: string,
  id: number,
  data: { name: string; type: 'personal' | 'savings' | 'common'; initialBalance: string; color?: string; currentBalance?: string | null }
) {
  return getDb().update(bankAccount).set(data).where(and(eq(bankAccount.id, id), eq(bankAccount.userId, userId)));
}

export function deleteAccount(userId: string, id: number) {
  return getDb().delete(bankAccount).where(and(eq(bankAccount.id, id), eq(bankAccount.userId, userId)));
}

/** Partage un compte avec un utilisateur lié (validation du lien côté service) */
export async function shareAccount(ownerId: string, accountId: number, targetUserId: string) {
  // Vérifier que les deux sont bien liés
  const link = await getDb().query.userLink.findFirst({
    where: and(
      eq(userLink.status, 'accepted'),
      or(
        and(eq(userLink.requesterId, ownerId), eq(userLink.receiverId, targetUserId)),
        and(eq(userLink.requesterId, targetUserId), eq(userLink.receiverId, ownerId))
      )
    )
  });
  if (!link) throw new Error('Vous devez être lié à cet utilisateur pour partager un compte.');

  // Vérifier que le compte appartient bien à l'émetteur
  const acc = await getDb().query.bankAccount.findFirst({
    where: and(eq(bankAccount.id, accountId), eq(bankAccount.userId, ownerId))
  });
  if (!acc) throw new Error('Compte introuvable.');

  // Éviter les doublons
  const existing = await getDb().query.bankAccountShare.findFirst({
    where: and(
      eq(bankAccountShare.bankAccountId, accountId),
      eq(bankAccountShare.sharedWithUserId, targetUserId)
    )
  });
  if (existing) return existing;

  const [row] = await getDb()
    .insert(bankAccountShare)
    .values({ bankAccountId: accountId, sharedWithUserId: targetUserId })
    .returning();
  return row;
}

/** Supprime un partage (seul le propriétaire peut le faire) */
export async function unshareAccount(ownerId: string, accountId: number, targetUserId: string) {
  const acc = await getDb().query.bankAccount.findFirst({
    where: and(eq(bankAccount.id, accountId), eq(bankAccount.userId, ownerId))
  });
  if (!acc) throw new Error('Compte introuvable ou non autorisé.');

  return getDb()
    .delete(bankAccountShare)
    .where(
      and(
        eq(bankAccountShare.bankAccountId, accountId),
        eq(bankAccountShare.sharedWithUserId, targetUserId)
      )
    );
}

// ─── Revenus ─────────────────────────────────────────────────────────────────

export function getIncomes(userId: string) {
  return getDb().query.income.findMany({
    where: eq(income.userId, userId),
    with: { bankAccount: true },
    orderBy: income.createdAt
  });
}

export function createIncome(
  userId: string,
  data: { bankAccountId: number; label: string; amount: string; dayOfMonth: number }
) {
  return getDb().insert(income).values({ userId, ...data }).returning();
}

export function updateIncome(
  userId: string,
  id: number,
  data: { bankAccountId: number; label: string; amount: string; dayOfMonth: number }
) {
  return getDb().update(income).set(data).where(and(eq(income.id, id), eq(income.userId, userId)));
}

export function deleteIncome(userId: string, id: number) {
  return getDb().delete(income).where(and(eq(income.id, id), eq(income.userId, userId)));
}

// ─── Dépenses ────────────────────────────────────────────────────────────────

/**
 * Calcule la part (%) de chaque userId en fonction de la somme de leurs
 * revenus sur leurs comptes personnels.
 * Retourne un Map<userId, sharePercent (0-100)>.
 * Si aucun revenu n'est trouvé, répartition égale.
 */
export async function computeProrataShares(userIds: string[]): Promise<Map<string, number>> {
  const personalAccounts = await getDb().query.bankAccount.findMany({
    where: eq(bankAccount.type, 'personal'),
    with: { incomes: true }
  });

  const sumByUser = new Map<string, number>(userIds.map((id) => [id, 0]));

  for (const acc of personalAccounts) {
    if (!userIds.includes(acc.userId)) continue;
    const total = acc.incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
    sumByUser.set(acc.userId, (sumByUser.get(acc.userId) ?? 0) + total);
  }

  const grand = [...sumByUser.values()].reduce((s, v) => s + v, 0);
  const result = new Map<string, number>();

  if (grand === 0) {
    // Répartition égale si personne n'a de revenu renseigné
    const equal = 100 / userIds.length;
    userIds.forEach((id) => result.set(id, equal));
  } else {
    sumByUser.forEach((val, id) => result.set(id, (val / grand) * 100));
  }

  return result;
}

export function getExpenses() {
  return getDb().query.expense.findMany({
    with: {
      bankAccount: true,
      participants: { with: { user: true } }
    },
    orderBy: expense.createdAt
  });
}

/**
 * Retourne les dépenses enrichies :
 * - Pour les dépenses prorata, `computedShares` contient les parts dynamiques
 * - Pour les autres, `computedShares` reprend les parts stockées
 */
export async function getExpensesWithShares() {
  const expenses = await getExpenses();

  return Promise.all(
    expenses.map(async (exp) => {
      if (!exp.isProrata || exp.participants.length === 0) {
        return {
          ...exp,
          computedShares: exp.participants.map((p) => ({
            user: p.user,
            sharePercentage: parseFloat(p.sharePercentage)
          }))
        };
      }

      const userIds = exp.participants.map((p) => p.userId);
      const prorataMap = await computeProrataShares(userIds);

      return {
        ...exp,
        computedShares: exp.participants.map((p) => ({
          user: p.user,
          sharePercentage: prorataMap.get(p.userId) ?? 0
        }))
      };
    })
  );
}

export async function createExpense(
  userId: string,
  data: {
    bankAccountId: number;
    label: string;
    amount: string;
    category?: string;
    dayOfMonth: number;
    isShared: boolean;
    isProrata: boolean;
    participants?: { userId: string; sharePercentage: string }[];
  }
) {
  const { participants, ...expenseData } = data;
  const [created] = await getDb().insert(expense).values(expenseData).returning();

  if (data.isShared) {
    // Toujours inclure l'auteur + les autres participants
    const allParticipants = [
      { userId, sharePercentage: '0' }, // prorata = calculé dynamiquement
      ...(participants ?? []).map((p) => ({
        userId: p.userId,
        sharePercentage: data.isProrata ? '0' : p.sharePercentage
      }))
    ];

    // Dédupliquer si l'auteur est déjà dans la liste
    const seen = new Set<string>();
    const unique = allParticipants.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    // Si pas prorata, recalculer parts égales pour l'auteur
    if (!data.isProrata && unique.length > 0) {
      const equal = (100 / unique.length).toFixed(2);
      // N'écraser que si l'auteur n'a pas de part explicite
      unique[0].sharePercentage = equal;
    }

    await getDb().insert(expenseParticipant).values(
      unique.map((p) => ({ expenseId: created.id, userId: p.userId, sharePercentage: p.sharePercentage }))
    );
  }
  return created;
}

export function deleteExpense(id: number) {
  return getDb().delete(expense).where(eq(expense.id, id));
}

export function updateExpense(
  id: number,
  data: { bankAccountId: number; label: string; amount: string; category?: string | null; dayOfMonth: number; isRealized?: boolean }
) {
  return getDb().update(expense).set(data).where(eq(expense.id, id));
}

export function toggleExpenseRealized(id: number, isRealized: boolean) {
  return getDb().update(expense).set({ isRealized }).where(eq(expense.id, id));
}

// ─── Virements planifiés ──────────────────────────────────────────────────────────

/**
 * Retourne tous les virements planifiés accessibles par l'utilisateur
 * (depuis ou vers un compte qu'il possède ou partagé avec lui).
 */
export async function getTransfers(userId: string) {
  const accounts = await getAccessibleAccounts(userId);
  const accountIds = accounts.map((a) => a.id);

  const all = await getDb().query.scheduledTransfer.findMany({
    with: { fromAccount: true, toAccount: true, user: true },
    orderBy: scheduledTransfer.dayOfMonth
  });

  // Ne retourner que les virements impactant au moins un compte accessible
  return all.filter(
    (t) => accountIds.includes(t.fromAccountId) || accountIds.includes(t.toAccountId)
  );
}

export async function createTransfer(
  userId: string,
  data: {
    fromAccountId: number;
    toAccountId: number;
    label: string;
    amount: string;
    dayOfMonth: number;
  }
) {
  if (data.fromAccountId === data.toAccountId) {
    throw new Error('Les comptes source et destination doivent être différents.');
  }
  // Vérifier que l'utilisateur a accès au compte source
  const accessible = await getAccessibleAccounts(userId);
  const hasAccess = accessible.some((a) => a.id === data.fromAccountId);
  if (!hasAccess) throw new Error('Compte source inaccessible.');

  const [created] = await getDb()
    .insert(scheduledTransfer)
    .values({ userId, ...data })
    .returning();
  return created;
}

export function deleteTransfer(userId: string, id: number) {
  return getDb()
    .delete(scheduledTransfer)
    .where(and(eq(scheduledTransfer.id, id), eq(scheduledTransfer.userId, userId)));
}

export function updateTransfer(
  userId: string,
  id: number,
  data: { fromAccountId: number; toAccountId: number; label: string; amount: string; dayOfMonth: number }
) {
  return getDb()
    .update(scheduledTransfer)
    .set(data)
    .where(and(eq(scheduledTransfer.id, id), eq(scheduledTransfer.userId, userId)));
}

// ─── Liaisons entre utilisateurs ─────────────────────────────────────────────

/** Envoie une demande de liaison vers l'email donné (erreur si inexistant ou déjà lié) */
export async function sendLinkRequest(requesterId: string, receiverEmail: string) {
  const receiver = await getDb().query.user.findFirst({ where: eq(user.email, receiverEmail) });
  if (!receiver) throw new Error('Aucun utilisateur trouvé avec cet email.');
  if (receiver.id === requesterId) throw new Error('Vous ne pouvez pas vous lier à vous-même.');

  const existing = await getDb().query.userLink.findFirst({
    where: or(
      and(eq(userLink.requesterId, requesterId), eq(userLink.receiverId, receiver.id)),
      and(eq(userLink.requesterId, receiver.id), eq(userLink.receiverId, requesterId))
    )
  });
  if (existing) throw new Error('Une demande existe déjà avec cet utilisateur.');

  return getDb().insert(userLink).values({ requesterId, receiverId: receiver.id }).returning();
}

/** Demandes reçues en attente */
export function getPendingRequests(userId: string) {
  return getDb().query.userLink.findMany({
    where: and(eq(userLink.receiverId, userId), eq(userLink.status, 'pending')),
    with: { requester: true }
  });
}

/** Demandes envoyées */
export function getSentRequests(userId: string) {
  return getDb().query.userLink.findMany({
    where: eq(userLink.requesterId, userId),
    with: { receiver: true }
  });
}

/** Accepte une demande */
export function acceptLinkRequest(userId: string, linkId: number) {
  return getDb()
    .update(userLink)
    .set({ status: 'accepted' })
    .where(and(eq(userLink.id, linkId), eq(userLink.receiverId, userId)));
}

/** Refuse ou supprime une demande / liaison */
export function declineLinkRequest(userId: string, linkId: number) {
  return getDb()
    .delete(userLink)
    .where(
      and(
        eq(userLink.id, linkId),
        or(eq(userLink.receiverId, userId), eq(userLink.requesterId, userId))
      )
    );
}

/** Retourne tous les utilisateurs liés (liaison acceptée) */
export async function getLinkedUsers(userId: string) {
  const links = await getDb().query.userLink.findMany({
    where: and(
      eq(userLink.status, 'accepted'),
      or(eq(userLink.requesterId, userId), eq(userLink.receiverId, userId))
    ),
    with: { requester: true, receiver: true }
  });

  return links.map((l) => (l.requesterId === userId ? l.receiver : l.requester));
}

// ─── Équilibrage des comptes communs ─────────────────────────────────────────

/**
 * Pour chaque compte commun accessible à l'utilisateur, calcule :
 * - le total mensuel des dépenses portées par ce compte
 * - la part (prorata des revenus personnels) que chaque participant doit virer
 * - en particulier la part de l'utilisateur courant
 *
 * Un "participant" d'un compte commun = son propriétaire + tous les utilisateurs
 * avec qui il est partagé via bank_account_share.
 */
export async function getCommonAccountSuggestions(userId: string) {
  // Tous les comptes communs accessibles (possédés ou partagés)
  const accessible = await getAccessibleAccounts(userId);
  const commonAccounts = accessible.filter((a) => a.type === 'common');

  const suggestions = await Promise.all(
    commonAccounts.map(async (acc) => {
      // Toutes les dépenses, virements sortants et revenus du compte (pas filtrés par utilisateur)
      const [expenses, transfersOut, incomes] = await Promise.all([
        getDb().query.expense.findMany({ where: eq(expense.bankAccountId, acc.id) }),
        getDb().query.scheduledTransfer.findMany({ where: eq(scheduledTransfer.fromAccountId, acc.id) }),
        getDb().query.income.findMany({ where: eq(income.bankAccountId, acc.id) })
      ]);
      const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const totalTransfersOut = transfersOut.reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalIncomes = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
      const totalToCover = Math.max(0, totalExpenses + totalTransfersOut - totalIncomes);

      // Participants = propriétaire + utilisateurs avec accès partagé
      const owner = await getDb().query.user.findFirst({
        where: eq(user.id, acc.userId)
      });
      const shares = await getDb().query.bankAccountShare.findMany({
        where: eq(bankAccountShare.bankAccountId, acc.id),
        with: { sharedWithUser: true }
      });

      const participants = [
        ...(owner ? [owner] : []),
        ...shares.map((s) => s.sharedWithUser)
      ];
      const participantIds = participants.map((p) => p.id);

      // Calcul prorata selon les revenus personnels des participants
      const prorataMap = await computeProrataShares(participantIds);

      const breakdown = participants.map((p) => ({
        userId: p.id,
        userName: p.name,
        sharePercent: prorataMap.get(p.id) ?? 0,
        amount: totalToCover * ((prorataMap.get(p.id) ?? 0) / 100)
      }));

      const mine = breakdown.find((b) => b.userId === userId);

      return {
        account: { id: acc.id, name: acc.name, color: acc.color },
        totalExpenses,
        totalTransfersOut,
        totalIncomes,
        totalToCover,
        myShare: mine?.sharePercent ?? 0,
        myAmount: mine?.amount ?? 0,
        breakdown
      };
    })
  );

  // Ne retourner que les comptes communs ayant des dépenses ou virements sortants
  return suggestions.filter((s) => s.totalToCover > 0);
}

// ─── Dashboard : solde restant par compte ─────────────────────────────────────

/** Retourne une liste plate de tous les comptes accessibles (possédés + partagés) */
export async function getAccessibleAccounts(userId: string) {
  const { owned, shared } = await getAccounts(userId);
  return [
    ...owned.map((a) => ({ ...a, _sharedBy: null as typeof shared[0]['_sharedBy'] | null })),
    ...shared
  ];
}

export async function getDashboard(userId: string) {
  const accounts = await getAccessibleAccounts(userId);

  const enriched = await Promise.all(
    accounts.map(async (acc) => {
      const [incomes, expenses, transfersOut, transfersIn] = await Promise.all([
        getDb().query.income.findMany({ where: eq(income.bankAccountId, acc.id) }),
        getDb().query.expense.findMany({
          where: eq(expense.bankAccountId, acc.id),
          with: { participants: true }
        }),
        getDb().query.scheduledTransfer.findMany({ where: eq(scheduledTransfer.fromAccountId, acc.id) }),
        getDb().query.scheduledTransfer.findMany({ where: eq(scheduledTransfer.toAccountId, acc.id) })
      ]);

      const totalIncomes = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);

      // Le montant intégral de chaque dépense est débité du compte,
      // quelle que soit la répartition entre participants.
      const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const totalRealizedExpenses = expenses
        .filter((e) => e.isRealized)
        .reduce((s, e) => s + parseFloat(e.amount), 0);

      const totalTransfersOut = transfersOut.reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalTransfersIn = transfersIn.reduce((s, t) => s + parseFloat(t.amount), 0);

      const balance = parseFloat(acc.initialBalance) + totalIncomes - totalExpenses - totalTransfersOut + totalTransfersIn;

      return { ...acc, totalIncomes, totalExpenses, totalRealizedExpenses, totalTransfersOut, totalTransfersIn, balance };
    })
  );

  return enriched;
}
