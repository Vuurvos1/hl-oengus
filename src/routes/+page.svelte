<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';

	const { data } = $props();

	const MINUTE = 60 * 1000;

	let time = new Date();

	let runs = data.lines;
	let currentRun = $derived(
		runs.find(
			(run, i, runs) =>
				runs[i + 1] && time < new Date(runs[i + 1].date) && new Date(run.date) < time
		)
	);

	function getHHMM(date: Date) {
		const hours = date.getHours();
		const mins = date.getMinutes();
		return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
	}

	function formatDuration(str: string) {
		if (!str) return '';
		const hours = str.match(/(\d+)\s*H/);
		const minutes = str.match(/(\d+)\s*M/);
		const seconds = str.match(/(\d+)\s*S/);

		return `${hours ? hours[1].padStart(2, '0') : '00'}:${
			minutes ? minutes[1].padStart(2, '0') : '00'
		}:${seconds ? seconds[1].padStart(2, '0') : '00'}`;
	}

	let interval: number;
	let timer: number;
	let timeOut: number;

	let activeRun: number | null = $state(null);

	onMount(() => {
		// this could be done over a websocket if one exists???
		interval = setInterval(async () => {
			// refetch runs data every 5 minutes
			try {
				invalidateAll();
			} catch (err) {
				console.error('error updating schedule data');
			}
		}, MINUTE * 5);

		timeOut = setTimeout(
			() => {
				time = new Date();

				// start timer
				timer = setInterval(() => {
					// upate time every minute
					time = new Date();
				}, MINUTE);
				// offset timer to next full minute
			},
			MINUTE - (new Date().getTime() % MINUTE)
		);
	});

	onDestroy(() => {
		clearInterval(interval);
		clearInterval(timer);
		clearTimeout(timeOut);
	});
</script>

<div class="bg"></div>

<div class="container">
	<div class="settings-panel">
		<div class="settings-header">
			<div>
				<h1>Source Runs Schedule</h1>
				{#if currentRun}
					<a href="#{currentRun.id}"> Jump to current run </a>
				{/if}
			</div>

			<a href="https://sourceruns.org" aria-label="close">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
				>
			</a>
		</div>

		<div class="runs">
			<div class="runs-header runsHeader row-cols">
				<p class="spacer"></p>
				<p>Time</p>
				<p>Runner(s)</p>
				<p>Game</p>
				<p>Category</p>
				<p>Estimate</p>
			</div>

			{#each runs as run, i}
				<!-- this might not highlight the first run of a schedule -->
				{#if i == 0 || (i > 1 && new Date(runs[i - 1].date).getDay() != new Date(run.date).getDay())}
					<div class="timie time-header">
						{new Date(run.date).toLocaleDateString('default', {
							weekday: 'long',
							month: 'long',
							day: '2-digit',
							year: 'numeric'
						})}
					</div>
				{/if}

				<button
					class="run run-row"
					id={String(run.id)}
					class:active={run.id === currentRun?.id}
					class:open={activeRun === run.id}
					onclick={() => {
						if (activeRun === run.id) {
							activeRun = null;
							return;
						}

						activeRun = run.id;
					}}
				>
					<div class="runSummary run-summary row-cols">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="currentColor"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="open-icon"
						>
							<polygon points="6 3 20 12 6 21 6 3" />
						</svg>

						<time>{getHHMM(new Date(run.date))}</time>
						{#if run.runners.length > 0}
							<div>
								{#each run.runners as runner}
									<p>
										{runner.username}
									</p>
								{/each}
							</div>
						{/if}
						<!-- game -->
						{#if run.setupBlockText}
							<p>{run.setupBlockText}</p>
						{:else if run.setupBlock}
							<p>Setup Block</p>
						{:else}
							<p>{run.gameName}</p>
						{/if}

						<!-- cat -->
						<p>{run.categoryName ?? ''}</p>

						<!-- est -->
						<p>{formatDuration(run.estimate)}</p>
					</div>

					{#if activeRun === run.id}
						<div class="runDetails run-details">
							<dl>
								{#if run.setupTime}
									<dt>Setup Time</dt>
									<dd>{formatDuration(run.setupTime)}</dd>
								{/if}

								{#if run.console}
									<dt>Console</dt>
									<dd>{run.console}</dd>
								{/if}

								{#if run.type}
									<dt>Type</dt>
									<dd>{run.type}</dd>
								{/if}
							</dl>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.bg {
		position: fixed;
		inset: -4px;
		background-image: url('/bg.jpg');
		background-size: cover;
		filter: blur(4px);
		z-index: -1;
	}

	.container {
		overflow: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.row-cols {
		display: grid;
		grid-template-columns: 2rem repeat(auto-fit, minmax(100px, 1fr));
	}

	.settings-panel {
		display: flex;
		flex-direction: column;
		color: white;
		margin: 2rem 0;
		height: calc(100vmin - 4rem);
		background: var(--hl-panel-background);
		border: 2px solid var(--hl-highlight);
	}

	.settings-header {
		display: flex;
		flex: row;
		align-items: start;
		justify-content: space-between;

		padding: 0.5rem 0.5rem 0.75rem 0.5rem;

		h1 {
			margin-bottom: 0.2ch;
		}

		a {
			line-height: 0;
		}

		svg {
			margin-left: auto;
			color: var(--hl-grey);

			border-top: 2px solid var(--hl-highlight);
			border-right: 2px solid var(--hl-shadow);
			border-bottom: 2px solid var(--hl-shadow);
			border-left: 2px solid var(--hl-highlight);
		}
	}

	.runs {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: auto;
		height: 100%;
		max-height: 100%;

		scroll-padding: 4rem;
		scroll-behavior: smooth;
	}

	.runs > div:nth-child(2) {
		margin-top: 0;
	}

	.runs-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--hl-panel-background);

		.spacer {
			width: 12rem;
		}

		p {
			padding: 0.2rem 0.5rem;

			border-top: 2px solid var(--hl-highlight);
			border-bottom: 2px solid var(--hl-shadow);
			border-left: 2px solid var(--hl-highlight);

			background: var(--hl-background-green);
		}
	}

	.time-header {
		position: sticky;
		top: 28px;
		z-index: 10;

		padding: 0.4rem 0.5rem;
		margin: 0.5rem 0;

		border-top: 2px solid var(--hl-highlight);
		border-bottom: 2px solid var(--hl-shadow);
		border-left: 2px solid var(--hl-highlight);

		background-color: var(--hl-background-green);
		text-align: center;
	}

	.run-row {
		text-align: left;
		padding: 0.25rem 0.5rem;
		color: white;

		&.active {
			background-color: var(--hl-row-highlight);
		}

		.open-icon {
			margin-top: 0.1rem;
		}

		&.open .open-icon {
			transform: rotate(90deg);
		}
	}

	.run-summary {
		gap: 0.25rem;
	}

	.run-details {
		padding: 0.5rem 0 0.5rem 2rem;
	}

	a {
		color: var(--hl-hud-text-color);
		text-decoration: none;
	}

	.runs {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	dl {
		width: max-content;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 1rem;
	}

	dl dt {
		font-weight: 600;
	}

	.runSummary > * {
		overflow-x: auto;
	}
</style>
