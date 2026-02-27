<div class="hero">
	<div class="content">
		<h1>💰 Budgetix</h1>
		<p class="tagline">
			Gérez vos comptes, suivez vos dépenses et visualisez votre budget en un coup d'œil.
		</p>

		<ul class="features">
			<li>🏦 Comptes personnels, épargne et communs</li>
			<li>💸 Dépenses récurrentes avec répartition équitable</li>
			<li>📈 Calcul automatique du solde disponible</li>
			<li>👥 Partage des dépenses entre utilisateurs</li>
		</ul>

		<div class="cta">
			<a href="/login" class="btn-primary">Commencer</a>
			<a href="/login" class="btn-secondary">Se connecter</a>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #1a1b26;
		color: #c0caf5;
		font-family: system-ui, sans-serif;
	}

	.hero {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.content {
		max-width: 560px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 800;
		color: #cba6f7;
		margin: 0;
	}

	.tagline {
		font-size: 1.15rem;
		color: #a9b1d6;
		line-height: 1.6;
		margin: 0;
	}

	.features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: #24283b;
		border-radius: 12px;
		padding: 1.5rem 2rem;
		width: 100%;
		text-align: left;
		font-size: 0.95rem;
		color: #a9b1d6;
		line-height: 1.5;
	}

	.cta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-primary {
		padding: 0.75rem 2rem;
		background: #7aa2f7;
		color: #1a1b26;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 700;
		font-size: 1rem;
		transition: background 0.15s;
	}
	.btn-primary:hover {
		background: #89b4fa;
	}

	.btn-secondary {
		padding: 0.75rem 2rem;
		background: transparent;
		color: #7aa2f7;
		border: 2px solid #7aa2f7;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		font-size: 1rem;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.btn-secondary:hover {
		background: #7aa2f7;
		color: #1a1b26;
	}
</style>
