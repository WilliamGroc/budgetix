<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let mode = $state<'login' | 'register'>('login');
</script>

<div class="center">
	<div class="box">
		<h1>💰 Budgetix</h1>

		<div class="tabs">
			<button class:active={mode === 'login'} onclick={() => (mode = 'login')}>Connexion</button>
			<button class:active={mode === 'register'} onclick={() => (mode = 'register')}
				>Inscription</button
			>
		</div>

		{#if mode === 'login'}
			<form method="POST" action="?/signIn" use:enhance>
				<label>Email <input type="email" name="email" required /></label>
				<label>Mot de passe <input type="password" name="password" required /></label>
				<button type="submit">Se connecter</button>
			</form>
		{:else}
			<form method="POST" action="?/signUp" use:enhance>
				<label>Nom <input name="name" required /></label>
				<label>Email <input type="email" name="email" required /></label>
				<label>Mot de passe <input type="password" name="password" required minlength="8" /></label>
				<button type="submit">Créer un compte</button>
			</form>
		{/if}

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
	</div>
</div>

<style>
	.center {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1b26;
	}
	.box {
		background: #24283b;
		border-radius: 12px;
		padding: 2.5rem;
		width: 360px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		font-family: system-ui, sans-serif;
	}
	h1 {
		text-align: center;
		color: #cba6f7;
		margin: 0;
		font-size: 1.5rem;
	}
	.tabs {
		display: flex;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #414868;
	}
	.tabs button {
		flex: 1;
		padding: 0.5rem;
		background: transparent;
		color: #6c7086;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.tabs button.active {
		background: #414868;
		color: #c0caf5;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: #a9b1d6;
	}
	input {
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid #414868;
		background: #1a1b26;
		color: #c0caf5;
		font-size: 0.9rem;
	}
	button[type='submit'] {
		padding: 0.6rem;
		background: #7aa2f7;
		color: #1a1b26;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		margin-top: 0.25rem;
	}
	button[type='submit']:hover {
		background: #89b4fa;
	}
	.error {
		color: #f7768e;
		font-size: 0.85rem;
		text-align: center;
		margin: 0;
	}
</style>
