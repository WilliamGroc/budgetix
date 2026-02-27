<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const typeLabels: Record<string, string> = {
		personal: 'Personnel',
		savings: 'Épargne',
		common: 'Commun'
	};

	const typeColors: Record<string, string> = {
		personal: '#7aa2f7',
		savings: '#9ece6a',
		common: '#bb9af7'
	};

	function fmt(n: number) {
		return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<h1>Tableau de bord</h1>

{#if data.suggestions.length > 0}
	<section class="equilibrage">
		<h2>Équilibrage ce mois-ci</h2>
		<p class="equilibrage-desc">
			Montants à virer sur chaque compte commun pour couvrir votre part des dépenses, calculés au
			prorata de vos revenus personnels.
		</p>
		<div class="suggestions-grid">
			{#each data.suggestions as s}
				<div class="suggestion-card" style="border-left: 4px solid {s.account.color ?? '#bb9af7'}">
					<div class="suggestion-header">
						<span class="suggestion-account">{s.account.name}</span>
						<div class="suggestion-totals">
							<span class="suggestion-total">Dépenses : {fmt(s.totalExpenses)} €</span>
							{#if s.totalTransfersOut > 0}
								<span class="suggestion-total"
									>Virements sortants : {fmt(s.totalTransfersOut)} €</span
								>
							{/if}
							{#if s.totalIncomes > 0}
								<span class="suggestion-total suggestion-total--income"
									>Revenus : -{fmt(s.totalIncomes)} €</span
								>
							{/if}
							<span class="suggestion-total suggestion-total--main"
								>Total à couvrir : {fmt(s.totalToCover)} €</span
							>
						</div>
					</div>
					<div class="suggestion-amount">
						<span class="amount-label">Votre contribution</span>
						<span class="amount-value">{fmt(s.myAmount)} €</span>
						<span class="amount-pct">({s.myShare.toFixed(1)} % des revenus)</span>
					</div>
					{#if s.breakdown.length > 1}
						<div class="breakdown">
							{#each s.breakdown as b}
								<div class="breakdown-row">
									<span>{b.userName}</span>
									<span>{fmt(b.amount)} € ({b.sharePercent.toFixed(1)} %)</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}

<div class="total-card">
	<span class="label">Solde total disponible</span>
	<span class="total" class:negative={data.totalBalance < 0}>
		{fmt(data.totalBalance)} €
	</span>
</div>

<div class="accounts-grid">
	{#each data.accounts as acc}
		<div class="account-card" style="border-top: 4px solid {acc.color ?? typeColors[acc.type]}">
			<div class="account-header">
				<span class="account-name">{acc.name}</span>
				<span class="type-badge" style="color:{typeColors[acc.type]}">{typeLabels[acc.type]}</span>
			</div>
			{#if acc._sharedBy}
				<div class="shared-by">Partagé par {acc._sharedBy.name}</div>
			{/if}

			{#if acc.currentBalance !== null && acc.currentBalance !== undefined}
				{@const current = parseFloat(acc.currentBalance)}
				{@const delta = current - acc.balance}
				<div class="current-balance-row">
					<span class="current-balance-label">Solde actuel</span>
					<span class="current-balance-value" class:negative={current < 0}>{fmt(current)} €</span>
				</div>
				<div class="delta-row" class:delta-pos={delta >= 0} class:delta-neg={delta < 0}>
					<span>Écart vs théorique</span>
					<span>{delta >= 0 ? '+' : ''}{fmt(delta)} €</span>
				</div>
				<div class="balance balance--theoretical" class:negative={acc.balance < 0}>
					{fmt(acc.balance)} € <span class="theoretical-label">théorique</span>
				</div>
			{:else}
				<div class="balance" class:negative={acc.balance < 0}>{fmt(acc.balance)} €</div>
			{/if}

			<div class="details">
				<div class="detail-row">
					<span>Solde initial</span>
					<span>{fmt(parseFloat(acc.initialBalance))} €</span>
				</div>
				<div class="detail-row income">
					<span>Revenus / mois</span>
					<span>+{fmt(acc.totalIncomes)} €</span>
				</div>
				<div class="detail-row expense">
					<span>Dépenses prévues</span>
					<span>-{fmt(acc.totalExpenses)} €</span>
				</div>
				{#if acc.totalRealizedExpenses > 0}
					<div class="detail-row realized">
						<span>… dont réalisées</span>
						<span>-{fmt(acc.totalRealizedExpenses)} €</span>
					</div>
				{/if}
				{#if acc.totalTransfersOut > 0}
					<div class="detail-row transfer-out">
						<span>Virements sortants</span>
						<span>-{fmt(acc.totalTransfersOut)} €</span>
					</div>
				{/if}
				{#if acc.totalTransfersIn > 0}
					<div class="detail-row transfer-in">
						<span>Virements entrants</span>
						<span>+{fmt(acc.totalTransfersIn)} €</span>
					</div>
				{/if}
			</div>
		</div>
	{/each}

	{#if data.accounts.length === 0}
		<p class="empty">
			Aucun compte défini. <a href="/accounts">Créer un compte →</a>
		</p>
	{/if}
</div>

<style>
	h1 {
		margin-bottom: 1.5rem;
	}

	.total-card {
		background: #24283b;
		border-radius: 10px;
		padding: 1.5rem 2rem;
		margin-bottom: 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.label {
		color: #a9b1d6;
		font-size: 1rem;
	}
	.total {
		font-size: 2rem;
		font-weight: 700;
		color: #9ece6a;
	}
	.total.negative {
		color: #f7768e;
	}

	.accounts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.25rem;
	}

	.account-card {
		background: #24283b;
		border-radius: 10px;
		padding: 1.25rem;
	}
	.account-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	.account-name {
		font-weight: 600;
		font-size: 1.05rem;
	}
	.type-badge {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	.shared-by {
		font-size: 0.75rem;
		color: #bb9af7;
		margin-bottom: 0.5rem;
	}

	.balance {
		font-size: 1.75rem;
		font-weight: 700;
		color: #9ece6a;
		margin-bottom: 1rem;
	}
	.balance.negative {
		color: #f7768e;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		border-top: 1px solid #2e3255;
		padding-top: 0.75rem;
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: #a9b1d6;
	}
	.detail-row.income span:last-child {
		color: #9ece6a;
	}
	.detail-row.expense span:last-child {
		color: #f7768e;
	}
	.detail-row.transfer-out span:last-child {
		color: #e0af68;
	}
	.detail-row.transfer-in span:last-child {
		color: #73daca;
	}
	.detail-row.realized span:last-child {
		color: #9ece6a;
	}
	.detail-row.realized span:first-child {
		padding-left: 0.75rem;
		color: #6c7086;
		font-style: italic;
	}
	.current-balance-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.15rem;
	}
	.current-balance-label {
		font-size: 0.75rem;
		color: #9ece6a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.current-balance-value {
		font-size: 1.6rem;
		font-weight: 700;
		color: #9ece6a;
	}
	.current-balance-value.negative {
		color: #f7768e;
	}
	.delta-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		margin-bottom: 0.4rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}
	.delta-pos {
		color: #9ece6a;
		background: #9ece6a11;
	}
	.delta-neg {
		color: #f7768e;
		background: #f7768e11;
	}
	.balance--theoretical {
		font-size: 1rem;
		color: #6c7086;
		margin-bottom: 0.25rem;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.theoretical-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.empty {
		color: #6c7086;
	}
	.empty a {
		color: #7aa2f7;
	}

	/* ── Équilibrage ── */
	.equilibrage {
		background: #24283b;
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}
	.equilibrage h2 {
		margin: 0 0 0.4rem;
		color: #cba6f7;
	}
	.equilibrage-desc {
		color: #6c7086;
		font-size: 0.85rem;
		margin: 0 0 1.25rem;
	}
	.suggestions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}
	.suggestion-card {
		background: #1a1b26;
		border-radius: 8px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.suggestion-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.suggestion-account {
		font-weight: 600;
		font-size: 1rem;
	}
	.suggestion-totals {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
	}
	.suggestion-total {
		font-size: 0.8rem;
		color: #6c7086;
	}
	.suggestion-total--main {
		color: #a9b1d6;
		font-weight: 600;
	}
	.suggestion-total--income {
		color: #9ece6a;
	}
	.suggestion-amount {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.amount-label {
		font-size: 0.85rem;
		color: #a9b1d6;
	}
	.amount-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #e0af68;
	}
	.amount-pct {
		font-size: 0.8rem;
		color: #6c7086;
	}
	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		border-top: 1px solid #2e3255;
		padding-top: 0.6rem;
	}
	.breakdown-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #6c7086;
	}
</style>
