<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	type Expense = PageData['expenses'][number];
	type Account = PageData['accounts'][number];

	let { data } = $props<{ data: PageData }>();

	let isShared = $state(false);
	let isProrata = $state(false);
	let editingId = $state<number | null>(null);
	let activeTab = $state<number | null>(null);

	const accountTabs = $derived(
		data.accounts.filter((acc: Account) =>
			data.expenses.some((e: Expense) => e.bankAccountId === acc.id)
		)
	);
	const currentTab = $derived(activeTab ?? accountTabs[0]?.id ?? null);
	const visible = $derived(
		currentTab === null
			? data.expenses
			: data.expenses.filter((e: Expense) => e.bankAccountId === currentTab)
	);
</script>

<h1>Dépenses</h1>

<section class="card">
	<h2>Ajouter une dépense récurrente</h2>
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label>
				Libellé
				<input name="label" required placeholder="Loyer, Internet…" />
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
				Catégorie
				<input name="category" placeholder="Logement, Transport…" />
			</label>
			<label>
				Jour du mois
				<input name="dayOfMonth" type="number" min="1" max="31" value="1" required />
			</label>
			<label class="inline">
				<input type="checkbox" name="isShared" bind:checked={isShared} />
				Dépense commune
			</label>
			{#if isShared}
				<label class="inline">
					<input type="checkbox" name="isProrata" bind:checked={isProrata} />
					Prorata des revenus personnels
				</label>
			{/if}
		</div>

		{#if isShared}
			{#if data.linkedUsers.length === 0}
				<p class="warn">
					Aucun utilisateur lié. <a href="/links">Envoyer une demande de liaison →</a>
				</p>
			{:else if isProrata}
				<div class="prorata-info">
					<span class="badge badge--prorata">Prorata</span>
					La répartition sera calculée automatiquement selon les revenus personnels de chaque participant.
					<div class="participants" style="margin-top:0.5rem">
						{#each data.linkedUsers as u}
							<input type="hidden" name="participantId" value={u.id} />
						{/each}
					</div>
				</div>
			{:else}
				<div class="participants">
					<h3>Répartition</h3>
					{#each data.linkedUsers as u}
						<div class="participant-row">
							<span>{u.name} ({u.email})</span>
							<input type="hidden" name="participantId" value={u.id} />
							<label class="share-label">
								Part (%)
								<input
									name="participantShare"
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={Math.floor(100 / (data.linkedUsers.length + 1))}
								/>
							</label>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<button type="submit" style="margin-top:1rem">Ajouter</button>
	</form>
</section>

<section class="card">
	<h2>Mes dépenses</h2>
	{#if data.expenses.length === 0}
		<p class="empty">Aucune dépense définie.</p>
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
				<tr
					><th>Libellé</th><th>Catégorie</th><th>Montant</th><th>Jour</th><th>Commune</th><th
						>Réalisée</th
					><th></th></tr
				>
			</thead>
			<tbody>
				{#each visible as exp}
					<tr>
						<td>{exp.label}</td>

						<td>{exp.category ?? '—'}</td>
						<td class="amount" class:realized={exp.isRealized}
							>-{parseFloat(exp.amount).toFixed(2)} €</td
						>
						<td>Le {exp.dayOfMonth}</td>
						<td>
							{#if exp.isShared}
								<span class="badge">Partagée</span>
								{#if exp.isProrata}
									<span class="badge badge--prorata">Prorata</span>
								{/if}
								<div class="shares">
									{#each exp.computedShares as p}
										<small>{p.user.name} : {parseFloat(p.sharePercentage).toFixed(1)}%</small>
									{/each}
								</div>
							{:else}
								—
							{/if}
						</td>
						<td>
							<form method="POST" action="?/toggleRealized" use:enhance>
								<input type="hidden" name="id" value={exp.id} />
								<input type="hidden" name="isRealized" value={String(!exp.isRealized)} />
								<button type="submit" class="btn-realized" class:is-realized={exp.isRealized}>
									{exp.isRealized ? '✓' : '○'}
								</button>
							</form>
						</td>
						<td>
							<button
								class="btn-edit"
								onclick={() => (editingId = editingId === exp.id ? null : exp.id)}>Éditer</button
							>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={exp.id} />
								<button type="submit" class="btn-danger">Supprimer</button>
							</form>
						</td>
					</tr>
					{#if editingId === exp.id}
						<tr class="edit-row">
							<td colspan="7">
								<form
									method="POST"
									action="?/update"
									use:enhance={() =>
										async ({ update }) => {
											await update();
											editingId = null;
										}}
								>
									<input type="hidden" name="id" value={exp.id} />
									<div class="edit-fields">
										<label>
											Libellé
											<input name="label" required value={exp.label} />
										</label>
										<label>
											Compte
											<select name="bankAccountId">
												{#each data.accounts as acc}
													<option value={acc.id} selected={acc.id === exp.bankAccountId}
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
												value={parseFloat(exp.amount)}
											/>
										</label>
										<label>
											Catégorie
											<input name="category" value={exp.category ?? ''} placeholder="Logement…" />
										</label>
										<label>
											Jour du mois
											<input
												name="dayOfMonth"
												type="number"
												min="1"
												max="31"
												required
												value={exp.dayOfMonth}
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
	label.inline {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		align-self: flex-end;
		padding-bottom: 0.5rem;
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
		background: #f7768e;
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
		vertical-align: top;
	}
	th {
		color: #7aa2f7;
		font-size: 0.8rem;
		text-transform: uppercase;
	}
	.amount {
		color: #f7768e;
		font-weight: 600;
	}
	.badge {
		background: #bb9af7;
		color: #1a1b26;
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		font-size: 0.75rem;
	}
	.badge--prorata {
		background: #e0af68;
		color: #1a1b26;
	}
	.prorata-info {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #1a1b26;
		border-radius: 8px;
		border: 1px solid #414868;
		color: #a9b1d6;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.shares {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-top: 0.25rem;
	}
	.shares small {
		color: #6c7086;
		font-size: 0.75rem;
	}
	.participants {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.participant-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.share-label {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
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
		color: #f7768e;
		border-bottom-color: #f7768e;
	}
	.warn {
		color: #e0af68;
		font-size: 0.9rem;
		margin-top: 0.75rem;
	}
	.warn a {
		color: #7aa2f7;
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
	.btn-realized {
		background: none;
		border: 1px solid #414868;
		border-radius: 50%;
		width: 1.75rem;
		height: 1.75rem;
		cursor: pointer;
		color: #6c7086;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}
	.btn-realized.is-realized {
		background: #9ece6a22;
		border-color: #9ece6a;
		color: #9ece6a;
	}
	.amount.realized {
		text-decoration: line-through;
		color: #6c7086;
	}
</style>
