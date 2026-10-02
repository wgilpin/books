<script lang="ts">
	import BookCard from '#lib/components/BookCard.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
	const running = $derived(data.refresh?.status === 'running');
	const genre = $derived(data.genre ?? null);
	const filters = [
		{ value: null, label: 'All', href: '/' },
		{ value: 'sf', label: 'Science fiction', href: '/?genre=sf' },
		{ value: 'fantasy', label: 'Fantasy', href: '/?genre=fantasy' }
	];
	/** Form actions keep the current filter, so the page comes back filtered. */
	const action = (name: string) => (genre ? `?genre=${genre}&/${name}` : `?/${name}`);
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
			<a href={filter.href} class="filter" aria-current={filter.value === genre ? 'page' : undefined}>{filter.label}</a>
		{/each}
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
					<BookCard {book} action={action('mark')} marks={['owned', 'read', 'queued', 'rejected']} />
				</li>
			{/each}
		</ol>
	{:else if data.refresh?.status === 'ok'}
		<p class="notice">You own every award book in the list.</p>
	{:else}
		<p class="notice">No award data yet.</p>
	{/if}
</main>
