<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	const typeLabels: Record<string, string> = {
		personal: 'Personnel',
		savings: 'Épargne',
		common: 'Commun'
	};

	// Suivi du compte dont le panneau de partage est ouvert
	let sharingAccountId = $state<number | null>(null);
	let editingId = $state<number | null>(null);
</script>

<h1>Comptes bancaires</h1>

<!-- Créer un compte -->
<section class="card">
	<h2>Ajouter un compte</h2>
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label>
				Nom
				<input name="name" required />
			</label>
			<label>
				Type
				<select name="type">
					<option value="personal">Personnel</option>
					<option value="savings">Épargne</option>
					<option value="common">Commun</option>
				</select>
			</label>
			<label>
				Solde initial (€)
				<input name="initialBalance" type="number" step="0.01" value="0" required />
			</label>
			<label>
				Couleur
				<input name="color" type="color" value="#cba6f7" />
			</label>
			<button type="submit">Ajouter</button>
		</div>
	</form>
</section>

<!-- Mes comptes (propriétaire) -->
<section class="card">
	<h2>Mes comptes</h2>
	{#if data.owned.length === 0}
		<p class="empty">Aucun compte défini pour l'instant.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Nom</th>
					<th>Type</th>
					<th>Solde initial</th>
					<th>Solde actuel</th>
					<th>Partagé avec</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.owned as acc}
					<tr>
						<td>
							<span class="dot" style="background:{acc.color ?? '#888'}"></span>
							{acc.name}
						</td>
						<td>{typeLabels[acc.type]}</td>
						<td>{parseFloat(acc.initialBalance).toFixed(2)} €</td>
						<td>
							{#if acc.currentBalance !== null && acc.currentBalance !== undefined}
								<span class="current-balance">{parseFloat(acc.currentBalance).toFixed(2)} €</span>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td>
							{#if acc.shares.length === 0}
								<span class="muted">—</span>
							{:else}
								<div class="share-pills">
									{#each acc.shares as s}
										<span class="pill">
											{s.sharedWithUser.name}
											<form method="POST" action="?/unshare" use:enhance style="display:inline">
												<input type="hidden" name="accountId" value={acc.id} />
												<input type="hidden" name="targetUserId" value={s.sharedWithUser.id} />
												<button type="submit" class="pill-remove" title="Retirer le partage"
													>×</button
												>
											</form>
										</span>
									{/each}
								</div>
							{/if}
						</td>
						<td class="actions-cell">
							<button
								class="btn-edit"
								onclick={() => (editingId = editingId === acc.id ? null : acc.id)}>Éditer</button
							>
							{#if data.linkedUsers.length > 0}
								<button
									class="btn-share"
									onclick={() => (sharingAccountId = sharingAccountId === acc.id ? null : acc.id)}
								>
									{sharingAccountId === acc.id ? 'Fermer' : 'Partager'}
								</button>
							{/if}
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={acc.id} />
								<button type="submit" class="btn-danger">Supprimer</button>
							</form>
						</td>
					</tr>
					{#if sharingAccountId === acc.id}
						<tr class="share-row">
							<td colspan="6">
								<div class="share-panel">
									<strong>Partager avec :</strong>
									{#each data.linkedUsers as u}
										{@const alreadyShared = acc.shares.some(
											(s: { sharedWithUser: { id: string } }) => s.sharedWithUser.id === u.id
										)}
										<div class="share-user">
											<span>{u.name} <span class="muted">({u.email})</span></span>
											{#if alreadyShared}
												<form method="POST" action="?/unshare" use:enhance>
													<input type="hidden" name="accountId" value={acc.id} />
													<input type="hidden" name="targetUserId" value={u.id} />
													<button type="submit" class="btn-danger-sm">Retirer</button>
												</form>
											{:else}
												<form method="POST" action="?/share" use:enhance>
													<input type="hidden" name="accountId" value={acc.id} />
													<input type="hidden" name="targetUserId" value={u.id} />
													<button type="submit" class="btn-ok">Partager</button>
												</form>
											{/if}
										</div>
									{/each}
									{#if form?.message}
										<p class="error">{form.message}</p>
									{/if}
								</div>
							</td>
						</tr>
					{/if}
					{#if editingId === acc.id}
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
									<input type="hidden" name="id" value={acc.id} />
									<div class="edit-fields">
										<label>
											Nom
											<input name="name" required value={acc.name} />
										</label>
										<label>
											Type
											<select name="type">
												<option value="personal" selected={acc.type === 'personal'}
													>Personnel</option
												>
												<option value="savings" selected={acc.type === 'savings'}>Épargne</option>
												<option value="common" selected={acc.type === 'common'}>Commun</option>
											</select>
										</label>
										<label>
											Solde initial (€)
											<input
												name="initialBalance"
												type="number"
												step="0.01"
												required
												value={parseFloat(acc.initialBalance)}
											/>
										</label>
										<label>
											Solde actuel (€) <span class="field-hint">optionnel</span>
											<input
												name="currentBalance"
												type="number"
												step="0.01"
												placeholder="Valeur réelle du compte"
												value={acc.currentBalance !== null && acc.currentBalance !== undefined
													? parseFloat(acc.currentBalance)
													: ''}
											/>
										</label>
										<label>
											Couleur
											<input name="color" type="color" value={acc.color ?? '#cba6f7'} />
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

<!-- Comptes partagés avec moi -->
{#if data.shared.length > 0}
	<section class="card">
		<h2>Comptes partagés avec moi</h2>
		<table>
			<thead>
				<tr>
					<th>Nom</th>
					<th>Type</th>
					<th>Solde initial</th>
					<th>Propriétaire</th>
				</tr>
			</thead>
			<tbody>
				{#each data.shared as acc}
					<tr>
						<td>
							<span class="dot" style="background:{acc.color ?? '#888'}"></span>
							{acc.name}
						</td>
						<td>{typeLabels[acc.type]}</td>
						<td>{parseFloat(acc.initialBalance).toFixed(2)} €</td>
						<td class="muted">{acc._sharedBy?.name} ({acc._sharedBy?.email})</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

{#if data.linkedUsers.length === 0 && data.owned.length > 0}
	<p class="hint">
		💡 Aucun utilisateur lié. <a href="/links">Créer une liaison →</a> pour partager vos comptes.
	</p>
{/if}

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
	button[type='submit']:not(.btn-danger):not(.btn-danger-sm):not(.btn-ok):not(.pill-remove) {
		padding: 0.5rem 1rem;
		background: #7aa2f7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		align-self: flex-end;
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
	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-right: 6px;
		vertical-align: middle;
	}
	.muted {
		color: #6c7086;
		font-size: 0.85rem;
	}
	.empty {
		color: #6c7086;
	}
	.hint {
		color: #a9b1d6;
		font-size: 0.875rem;
	}
	.hint a {
		color: #7aa2f7;
	}
	.actions-cell {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.6rem 0.75rem;
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
	.btn-danger-sm {
		padding: 0.2rem 0.6rem;
		background: #f7768e;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
	}
	.btn-ok {
		padding: 0.2rem 0.6rem;
		background: #9ece6a;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
	}
	.btn-share {
		padding: 0.3rem 0.7rem;
		background: #bb9af7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.share-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: #414868;
		border-radius: 20px;
		padding: 0.15rem 0.5rem;
		font-size: 0.8rem;
		color: #c0caf5;
	}
	.pill-remove {
		background: none;
		border: none;
		color: #f7768e;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		line-height: 1;
	}

	.share-row td {
		background: #1e2030;
		padding: 0;
		border-bottom: 2px solid #7aa2f7;
	}
	.share-panel {
		padding: 1rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.share-panel strong {
		color: #cba6f7;
		font-size: 0.9rem;
	}
	.share-user {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.5rem;
		background: #24283b;
		border-radius: 6px;
		gap: 1rem;
		font-size: 0.875rem;
	}
	.error {
		color: #f7768e;
		font-size: 0.85rem;
		margin: 0;
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
	.current-balance {
		color: #9ece6a;
		font-weight: 600;
	}
	.field-hint {
		font-size: 0.75rem;
		color: #6c7086;
		font-weight: 400;
	}
</style>
