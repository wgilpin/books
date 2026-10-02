<script lang="ts">
	import BookCard from '#lib/components/BookCard.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
	const running = $derived(data.refresh?.status === 'running');
	const genre = $derived(data.genre ?? null);
	const includeUnknown = $derived(data.includeUnknown ?? true);
	const filters = [
		{ value: null, label: 'All' },
		{ value: 'sf', label: 'Science fiction' },
		{ value: 'fantasy', label: 'Fantasy' }
	];

	/** The query for a genre and the unknown setting; unknown=0 only when it is off. */
	function query(g: string | null, unknown: boolean) {
		const params = [g ? `genre=${g}` : '', unknown ? '' : 'unknown=0'].filter(Boolean);
		return params.join('&');
	}
	const href = (g: string | null, unknown: boolean) => {
		const q = query(g, unknown);
		return q ? `/?${q}` : '/';
	};
	/** Form actions keep the current filter, so the page comes back filtered. */
	const action = (name: string) => {
		const q = query(genre, includeUnknown);
		return q ? `?${q}&/${name}` : `?/${name}`;
	};
</script>

<svelte:head>
	<title>Award novels</title>
	{#if running}
		<!-- Reload until the background refresh ends. -->
		<meta http-equiv="refresh" content="3" />
	{/if}
</svelte:head>

<main>
	<PageHeader title="Award novels">
		<form class="inline-form" method="POST" action={action('refresh')}>
			<button class="button button--secondary" type="submit" disabled={running}>Refresh from Wikidata</button>
		</form>
		<a class="button button--quiet" href="/queue">Queue ({data.queueCount ?? 0})</a>
		<a class="button button--quiet" href="/import">Import Kindle library</a>
	</PageHeader>

	<nav class="filters" aria-label="Genre">
		{#each filters as filter (filter.label)}
			<a href={href(filter.value, includeUnknown)} class="filter" aria-current={filter.value === genre ? 'page' : undefined}>{filter.label}</a>
		{/each}
		<a href={href(genre, !includeUnknown)} class="toggle{includeUnknown ? ' toggle--on' : ''}">Include unknown<span class="sr-only">, {includeUnknown ? 'on' : 'off'}</span></a>
	</nav>

	{#if running}
		<p class="notice notice--progress">Refreshing from Wikidata…</p>
	{:else if data.refresh?.status === 'failed'}
		<p class="notice notice--error" role="alert">Refresh failed at {data.refresh.finishedAt}: {data.refresh.error}</p>
	{:else if data.refresh?.status === 'ok'}
		<p class="notice">Last refreshed {data.refresh.finishedAt}.</p>
	{/if}

	{#if data.books.length > 0}
		<ol class="stack">
			{#each data.books as book}
				<li>
					<BookCard {book} action={action('mark')} genreAction={action('genre')} marks={['owned', 'read', 'queued', 'rejected']} />
				</li>
			{/each}
		</ol>
	{:else if data.refresh?.status === 'ok'}
		<p class="notice">You own every award book in the list.</p>
	{:else}
		<p class="notice">No award data yet.</p>
	{/if}
</main>
