import { relations } from 'drizzle-orm';
import { pgTable, serial, integer, text, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

// ─── Comptes bancaires ────────────────────────────────────────────────────────

export const bankAccount = pgTable(
  'bank_account',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** 'personal' | 'savings' | 'common' */
    type: text('type', { enum: ['personal', 'savings', 'common'] })
      .notNull()
      .default('personal'),
    /** Solde initial du compte */
    initialBalance: numeric('initial_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    /** Solde actuel saisi manuellement (valeur réelle du compte bancaire) */
    currentBalance: numeric('current_balance', { precision: 12, scale: 2 }),
    color: text('color'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (t) => [index('bank_account_user_idx').on(t.userId)]
);

// ─── Entrées d'argent récurrentes (salaire, loyer perçu…) ────────────────────

export const income = pgTable(
  'income',
  {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id')
      .notNull()
      .references(() => bankAccount.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    /** Jour du mois où le revenu est perçu (1–31) */
    dayOfMonth: integer('day_of_month').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [index('income_account_idx').on(t.bankAccountId)]
);

// ─── Dépenses récurrentes mensuelles ─────────────────────────────────────────

export const expense = pgTable(
  'expense',
  {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id')
      .notNull()
      .references(() => bankAccount.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    /** Catégorie libre : logement, alimentation, transport… */
    category: text('category'),
    /** Jour du mois du prélèvement (1–31) */
    dayOfMonth: integer('day_of_month').notNull().default(1),
    /** Dépense commune à répartir entre plusieurs utilisateurs */
    isShared: boolean('is_shared').notNull().default(false),
    /** Répartition calculée au prorata des revenus personnels des participants */
    isProrata: boolean('is_prorata').notNull().default(false),
    /** La dépense a effectivement été prélevée ce mois-ci */
    isRealized: boolean('is_realized').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [index('expense_account_idx').on(t.bankAccountId)]
);

// ─── Participants à une dépense commune ──────────────────────────────────────

export const expenseParticipant = pgTable('expense_participant', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id')
    .notNull()
    .references(() => expense.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** Part en % de cet utilisateur pour cette dépense (ex: 50.00) */
  sharePercentage: numeric('share_percentage', { precision: 5, scale: 2 })
    .notNull()
    .default('50')
});

// ─── Partage de comptes entre utilisateurs liés ───────────────────────────────

export const bankAccountShare = pgTable(
  'bank_account_share',
  {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id')
      .notNull()
      .references(() => bankAccount.id, { onDelete: 'cascade' }),
    sharedWithUserId: text('shared_with_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [
    index('bank_account_share_account_idx').on(t.bankAccountId),
    index('bank_account_share_user_idx').on(t.sharedWithUserId)
  ]
);

// ─── Liaisons entre utilisateurs ─────────────────────────────────────────────

export const userLink = pgTable(
  'user_link',
  {
    id: serial('id').primaryKey(),
    requesterId: text('requester_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    receiverId: text('receiver_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** 'pending' | 'accepted' | 'declined' */
    status: text('status', { enum: ['pending', 'accepted', 'declined'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [
    index('user_link_requester_idx').on(t.requesterId),
    index('user_link_receiver_idx').on(t.receiverId)
  ]
);

// ─── Virements planifiés récurrents ─────────────────────────────────────────

export const scheduledTransfer = pgTable(
  'scheduled_transfer',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fromAccountId: integer('from_account_id')
      .notNull()
      .references(() => bankAccount.id, { onDelete: 'cascade' }),
    toAccountId: integer('to_account_id')
      .notNull()
      .references(() => bankAccount.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    /** Jour du mois du virement (1–31) */
    dayOfMonth: integer('day_of_month').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [
    index('scheduled_transfer_user_idx').on(t.userId),
    index('scheduled_transfer_from_idx').on(t.fromAccountId),
    index('scheduled_transfer_to_idx').on(t.toAccountId)
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const bankAccountRelations = relations(bankAccount, ({ one, many }) => ({
  user: one(user, { fields: [bankAccount.userId], references: [user.id] }),
  incomes: many(income),
  expenses: many(expense),
  shares: many(bankAccountShare),
  transfersOut: many(scheduledTransfer, { relationName: 'transferFrom' }),
  transfersIn: many(scheduledTransfer, { relationName: 'transferTo' })
}));

export const incomeRelations = relations(income, ({ one }) => ({
  bankAccount: one(bankAccount, { fields: [income.bankAccountId], references: [bankAccount.id] }),
  user: one(user, { fields: [income.userId], references: [user.id] })
}));

export const expenseRelations = relations(expense, ({ one, many }) => ({
  bankAccount: one(bankAccount, { fields: [expense.bankAccountId], references: [bankAccount.id] }),
  participants: many(expenseParticipant)
}));

export const expenseParticipantRelations = relations(expenseParticipant, ({ one }) => ({
  expense: one(expense, { fields: [expenseParticipant.expenseId], references: [expense.id] }),
  user: one(user, { fields: [expenseParticipant.userId], references: [user.id] })
}));

export const userLinkRelations = relations(userLink, ({ one }) => ({
  requester: one(user, { fields: [userLink.requesterId], references: [user.id], relationName: 'linkRequester' }),
  receiver: one(user, { fields: [userLink.receiverId], references: [user.id], relationName: 'linkReceiver' })
}));

export const bankAccountShareRelations = relations(bankAccountShare, ({ one }) => ({
  bankAccount: one(bankAccount, { fields: [bankAccountShare.bankAccountId], references: [bankAccount.id] }),
  sharedWithUser: one(user, { fields: [bankAccountShare.sharedWithUserId], references: [user.id] })
}));

export const scheduledTransferRelations = relations(scheduledTransfer, ({ one }) => ({
  user: one(user, { fields: [scheduledTransfer.userId], references: [user.id] }),
  fromAccount: one(bankAccount, {
    fields: [scheduledTransfer.fromAccountId],
    references: [bankAccount.id],
    relationName: 'transferFrom'
  }),
  toAccount: one(bankAccount, {
    fields: [scheduledTransfer.toAccountId],
    references: [bankAccount.id],
    relationName: 'transferTo'
  })
}));

export * from './auth.schema';
