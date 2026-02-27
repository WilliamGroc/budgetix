<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<h1>Liaisons</h1>
<p class="subtitle">
	Liez votre compte à celui d'un autre utilisateur pour partager des dépenses communes.
</p>

<!-- Envoyer une demande -->
<section class="card">
	<h2>Envoyer une demande</h2>
	<form method="POST" action="?/send" use:enhance>
		<div class="form-row">
			<label>
				Email de l'utilisateur
				<input type="email" name="email" required placeholder="partenaire@exemple.fr" />
			</label>
			<button type="submit">Envoyer</button>
		</div>
		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
	</form>
</section>

<!-- Demandes reçues -->
<section class="card">
	<h2>Demandes reçues</h2>
	{#if data.pending.length === 0}
		<p class="empty">Aucune demande en attente.</p>
	{:else}
		<ul class="request-list">
			{#each data.pending as req}
				<li>
					<div class="user-info">
						<strong>{req.requester.name}</strong>
						<span class="email">{req.requester.email}</span>
					</div>
					<div class="actions">
						<form method="POST" action="?/accept" use:enhance>
							<input type="hidden" name="id" value={req.id} />
							<button type="submit" class="btn-accept">Accepter</button>
						</form>
						<form method="POST" action="?/decline" use:enhance>
							<input type="hidden" name="id" value={req.id} />
							<button type="submit" class="btn-decline">Refuser</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- Demandes envoyées -->
<section class="card">
	<h2>Demandes envoyées</h2>
	{#if data.sent.length === 0}
		<p class="empty">Aucune demande envoyée.</p>
	{:else}
		<ul class="request-list">
			{#each data.sent as req}
				<li>
					<div class="user-info">
						<strong>{req.receiver.name}</strong>
						<span class="email">{req.receiver.email}</span>
						<span class="badge badge--{req.status}">
							{req.status === 'pending'
								? 'En attente'
								: req.status === 'accepted'
									? 'Acceptée'
									: 'Refusée'}
						</span>
					</div>
					<form method="POST" action="?/decline" use:enhance>
						<input type="hidden" name="id" value={req.id} />
						<button type="submit" class="btn-decline">Annuler</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- Utilisateurs liés -->
<section class="card">
	<h2>Utilisateurs liés</h2>
	{#if data.linked.length === 0}
		<p class="empty">Aucune liaison active pour l'instant.</p>
	{:else}
		<ul class="request-list">
			{#each data.linked as u}
				<li>
					<div class="user-info">
						<strong>{u.name}</strong>
						<span class="email">{u.email}</span>
						<span class="badge badge--accepted">Lié</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	h1 {
		margin-bottom: 0.25rem;
	}
	.subtitle {
		color: #a9b1d6;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
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
	input {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border: 1px solid #414868;
		background: #1a1b26;
		color: #c0caf5;
		min-width: 240px;
	}
	button[type='submit'] {
		padding: 0.5rem 1rem;
		background: #7aa2f7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		align-self: flex-end;
	}

	.request-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.request-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #1a1b26;
		border-radius: 8px;
		gap: 1rem;
	}
	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.email {
		color: #6c7086;
		font-size: 0.85rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.btn-accept {
		padding: 0.35rem 0.9rem;
		background: #9ece6a;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.btn-decline {
		padding: 0.35rem 0.9rem;
		background: #f7768e;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
	}
	.badge--pending {
		background: #e0af68;
		color: #1a1b26;
	}
	.badge--accepted {
		background: #9ece6a;
		color: #1a1b26;
	}
	.badge--declined {
		background: #f7768e;
		color: #1a1b26;
	}

	.error {
		color: #f7768e;
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}
	.empty {
		color: #6c7086;
	}
</style>
