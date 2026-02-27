<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children } = $props<{ data: LayoutData; children: any }>();
</script>

<div class="app-shell">
	<nav class="sidebar">
		<div class="brand">💰 Budgetix</div>
		<a href="/dashboard">Tableau de bord</a>
		<a href="/accounts">Comptes</a>
		<a href="/incomes">Revenus</a>
		<a href="/expenses">Dépenses</a>
		<a href="/transfers">Virements</a>
		<a href="/links">Liaisons</a>
		<div class="spacer"></div>
		<span class="user-email">{data.user.email}</span>
		<form method="POST" action="/logout">
			<button type="submit">Déconnexion</button>
		</form>
	</nav>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
		font-family: system-ui, sans-serif;
	}
	.sidebar {
		width: 220px;
		background: #1e1e2e;
		color: #cdd6f4;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1.5rem 1rem;
		flex-shrink: 0;
	}
	.brand {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #cba6f7;
	}
	.sidebar a {
		color: #cdd6f4;
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		transition: background 0.15s;
	}
	.sidebar a:hover {
		background: #313244;
	}
	.spacer {
		flex: 1;
	}
	.user-email {
		font-size: 0.75rem;
		color: #6c7086;
		padding: 0 0.75rem;
		word-break: break-all;
	}
	button {
		margin-top: 0.5rem;
		width: 100%;
		padding: 0.5rem;
		background: #313244;
		color: #cdd6f4;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	button:hover {
		background: #45475a;
	}
	.content {
		flex: 1;
		padding: 2rem;
		background: #1a1b26;
		color: #c0caf5;
	}
</style>
