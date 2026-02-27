<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	let editingId = $state<number | null>(null);

	const typeLabels: Record<string, string> = {
		personal: 'Personnel',
		savings: 'Épargne',
		common: 'Commun'
	};

	function fmt(n: number) {
		return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function accountLabel(acc: { name: string; type: string }) {
		return `${acc.name} (${typeLabels[acc.type] ?? acc.type})`;
	}
</script>

<h1>Virements planifiés</h1>

<section class="card">
	<h2>Nouveau virement récurrent</h2>
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label>
				Libellé
				<input name="label" required placeholder="Épargne mensuelle, Participation loyer…" />
			</label>
			<label>
				Compte source
				<select name="fromAccountId" required>
					{#each data.accounts as acc}
						<option value={acc.id}>{accountLabel(acc)}</option>
					{/each}
				</select>
			</label>
			<label>
				Compte destination
				<select name="toAccountId" required>
					{#each data.accounts as acc}
						<option value={acc.id}>{accountLabel(acc)}</option>
					{/each}
				</select>
			</label>
			<label>
				Montant (€)
				<input name="amount" type="number" step="0.01" min="0.01" required />
			</label>
			<label>
				Jour du mois
				<input name="dayOfMonth" type="number" min="1" max="31" value="1" required />
			</label>
		</div>
		<button type="submit" style="margin-top:1rem">Planifier le virement</button>
	</form>
</section>

<section class="card">
	<h2>Virements programmés</h2>
	{#if data.transfers.length === 0}
		<p class="empty">Aucun virement planifié.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Libellé</th>
					<th>De</th>
					<th>Vers</th>
					<th>Montant</th>
					<th>Jour</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.transfers as t}
					<tr>
						<td>{t.label}</td>
						<td>
							<span class="account-chip chip--from">{t.fromAccount.name}</span>
						</td>
						<td>
							<span class="account-chip chip--to">{t.toAccount.name}</span>
						</td>
						<td class="amount">{fmt(parseFloat(t.amount))} €</td>
						<td>Le {t.dayOfMonth}</td>
						<td>
							{#if t.userId === data.currentUserId}
								<button
									class="btn-edit"
									onclick={() => (editingId = editingId === t.id ? null : t.id)}>Éditer</button
								>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={t.id} />
									<button type="submit" class="btn-danger">Supprimer</button>
								</form>
							{/if}
						</td>
					</tr>
					{#if editingId === t.id && t.userId === data.currentUserId}
						<tr class="edit-row">
							<td colspan="6">
								<form
									method="POST"
									action="?/update"
									use:enhance={() =>
										async ({ update }) => {
											await update();
											editingId = null;
										}}
								>
									<input type="hidden" name="id" value={t.id} />
									<div class="edit-fields">
										<label>
											Libellé
											<input name="label" required value={t.label} />
										</label>
										<label>
											Compte source
											<select name="fromAccountId">
												{#each data.accounts as acc}
													<option value={acc.id} selected={acc.id === t.fromAccountId}
														>{accountLabel(acc)}</option
													>
												{/each}
											</select>
										</label>
										<label>
											Compte destination
											<select name="toAccountId">
												{#each data.accounts as acc}
													<option value={acc.id} selected={acc.id === t.toAccountId}
														>{accountLabel(acc)}</option
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
												min="0.01"
												required
												value={parseFloat(t.amount)}
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
												value={t.dayOfMonth}
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
		background: #7aa2f7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
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
		vertical-align: middle;
	}
	th {
		color: #7aa2f7;
		font-size: 0.8rem;
		text-transform: uppercase;
	}
	.amount {
		color: #e0af68;
		font-weight: 600;
	}
	.account-chip {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
	}
	.chip--from {
		background: #2e3255;
		color: #f7768e;
	}
	.chip--to {
		background: #2e3255;
		color: #9ece6a;
	}
	.empty {
		color: #6c7086;
	}
	.error {
		color: #f7768e;
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
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
		margin-right: 0.3rem;
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
