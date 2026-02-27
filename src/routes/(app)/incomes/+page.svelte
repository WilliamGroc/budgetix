<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	type Income = PageData['incomes'][number];
	type Account = PageData['accounts'][number];

	let { data } = $props<{ data: PageData }>();

	let editingId = $state<number | null>(null);
	let activeTab = $state<number | null>(null);

	const accountTabs = $derived(
		data.accounts.filter((acc: Account) =>
			data.incomes.some((i: Income) => i.bankAccountId === acc.id)
		)
	);
	const currentTab = $derived(activeTab ?? accountTabs[0]?.id ?? null);
	const visible = $derived(
		currentTab === null
			? data.incomes
			: data.incomes.filter((i: Income) => i.bankAccountId === currentTab)
	);
</script>

<h1>Revenus</h1>

<section class="card">
	<h2>Ajouter un revenu récurrent</h2>
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label>
				Libellé
				<input name="label" required placeholder="Salaire" />
			</label>
			<label>
				Compte
				<select name="bankAccountId" required>
					{#each data.accounts as acc}
						<option value={acc.id}>{acc.name}</option>
					{/each}
				</select>
			</label>
			<label>
				Montant (€)
				<input name="amount" type="number" step="0.01" min="0" required />
			</label>
			<label>
				Jour du mois
				<input name="dayOfMonth" type="number" min="1" max="31" value="1" required />
			</label>
			<button type="submit">Ajouter</button>
		</div>
	</form>
</section>

<section class="card">
	<h2>Mes revenus</h2>
	{#if data.incomes.length === 0}
		<p class="empty">Aucun revenu défini.</p>
	{:else}
		<div class="tabs">
			{#each accountTabs as tab}
				<button
					class="tab"
					class:active={currentTab === tab.id}
					onclick={() => (activeTab = tab.id)}>{tab.name}</button
				>
			{/each}
		</div>
		<table>
			<thead>
				<tr><th>Libellé</th><th>Montant</th><th>Jour</th><th></th></tr>
			</thead>
			<tbody>
				{#each visible as inc}
					<tr>
						<td>{inc.label}</td>
						<td class="amount">+{parseFloat(inc.amount).toFixed(2)} €</td>
						<td>Le {inc.dayOfMonth}</td>
						<td class="actions-cell">
							<button
								class="btn-edit"
								onclick={() => (editingId = editingId === inc.id ? null : inc.id)}>Éditer</button
							>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={inc.id} />
								<button type="submit" class="btn-danger">Supprimer</button>
							</form>
						</td>
					</tr>
					{#if editingId === inc.id}
						<tr class="edit-row">
							<td colspan="4">
								<form
									method="POST"
									action="?/update"
									use:enhance={() =>
										async ({ update }) => {
											await update();
											editingId = null;
										}}
								>
									<input type="hidden" name="id" value={inc.id} />
									<div class="edit-fields">
										<label>
											Libellé
											<input name="label" required value={inc.label} />
										</label>
										<label>
											Compte
											<select name="bankAccountId">
												{#each data.accounts as acc}
													<option value={acc.id} selected={acc.id === inc.bankAccountId}
														>{acc.name}</option
													>
												{/each}
											</select>
										</label>
										<label>
											Montant (€)
											<input
												name="amount"
												type="number"
												step="0.01"
												min="0"
												required
												value={parseFloat(inc.amount)}
											/>
										</label>
										<label>
											Jour du mois
											<input
												name="dayOfMonth"
												type="number"
												min="1"
												max="31"
												required
												value={inc.dayOfMonth}
											/>
										</label>
										<div class="edit-actions">
											<button type="submit">Enregistrer</button>
											<button type="button" class="btn-cancel" onclick={() => (editingId = null)}
												>Annuler</button
											>
										</div>
									</div>
								</form>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	h1 {
		margin-bottom: 1.5rem;
	}
	.card {
		background: #24283b;
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
	.form-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: #a9b1d6;
	}
	input,
	select {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border: 1px solid #414868;
		background: #1a1b26;
		color: #c0caf5;
	}
	button[type='submit'] {
		padding: 0.5rem 1rem;
		background: #9ece6a;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		align-self: flex-end;
	}
	.btn-danger {
		padding: 0.3rem 0.7rem;
		background: #f7768e;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 0.6rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid #2e3255;
	}
	th {
		color: #7aa2f7;
		font-size: 0.8rem;
		text-transform: uppercase;
	}
	.amount {
		color: #9ece6a;
		font-weight: 600;
	}
	.empty {
		color: #6c7086;
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
		border-bottom: 2px solid #2e3255;
		padding-bottom: 0;
	}
	.tab {
		padding: 0.4rem 1rem;
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		color: #6c7086;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		transition:
			color 0.15s,
			border-color 0.15s;
		margin-bottom: -2px;
	}
	.tab:hover {
		color: #c0caf5;
	}
	.tab.active {
		color: #9ece6a;
		border-bottom-color: #9ece6a;
	}
	.actions-cell {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}
	.btn-edit {
		padding: 0.3rem 0.7rem;
		background: #7aa2f7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 600;
	}
	.edit-row td {
		background: #1e2030;
		padding: 0;
		border-bottom: 2px solid #7aa2f7;
	}
	.edit-fields {
		padding: 1rem 1.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
	}
	.edit-actions {
		display: flex;
		gap: 0.5rem;
		align-self: flex-end;
	}
	.edit-actions button[type='submit'] {
		padding: 0.4rem 0.9rem;
		background: #9ece6a;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
	}
	.btn-cancel {
		padding: 0.4rem 0.9rem;
		background: #414868;
		color: #c0caf5;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
	}
</style>
