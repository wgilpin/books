<script lang="ts">
	import BookCard from '#lib/components/BookCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
	const running = $derived(data.refresh?.status === 'running');
	const genre = $derived(data.genre ?? null);
	const includeUnknown = $derived(data.includeUnknown ?? true);
	const limit = $derived(data.limit ?? 10);
	const filters = [
		{ value: null, label: 'All' },
		{ value: 'sf', label: 'Science fiction' },
		{ value: 'fantasy', label: 'Fantasy' }
	];

	/** The query for the settings; each part only when it differs from the default. */
	function query(g: string | null, unknown: boolean, n = 10) {
		const params = [g ? `genre=${g}` : '', unknown ? '' : 'unknown=0', n === 10 ? '' : `limit=${n}`].filter(Boolean);
		return params.join('&');
	}
	/** Filter links start again at ten. */
	const href = (g: string | null, unknown: boolean, n = 10) => {
		const q = query(g, unknown, n);
		return q ? `/?${q}` : '/';
	};
	/** Form actions keep the filter and the length, so the page comes back as it was. */
	const action = (name: string) => {
		const q = query(genre, includeUnknown, limit);
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
	<PageHeader title="Award novels" meta={data.refresh?.status === 'ok' ? `Last refreshed ${data.refresh.finishedAt}` : undefined}>
		<a class="tab" href="/queue">Queue <span class="count">{data.queueCount ?? 0}</span></a>
		<form class="inline-form" method="POST" action={action('refresh')}>
			<button class="icon-button" type="submit" disabled={running} aria-label="Refresh from Wikidata" title="Refresh from Wikidata"><Icon name="refresh" /></button>
		</form>
		<details class="menu">
			<summary class="icon-button" aria-label="More" title="More"><Icon name="more" /></summary>
			<div class="menu__panel">
				<a class="menu__item" href="/import">Import Kindle library</a>
			</div>
		</details>
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
	{/if}

	{#if data.books.length > 0}
		<ol class="stack">
			{#each data.books as book, i}
				<li id="book-{i + 1}">
					<BookCard {book} action={action('mark')} genreAction={action('genre')} marks={['owned', 'read', 'queued', 'rejected']} />
				</li>
			{/each}
		</ol>
		{#if data.hasMore}
			<p class="more"><a class="button button--secondary" href="{href(genre, includeUnknown, limit + 10)}#book-{limit + 1}">Show 10 more</a></p>
		{/if}
	{:else if data.refresh?.status === 'ok'}
		<p class="notice">You own every award book in the list.</p>
	{:else}
		<p class="notice">No award data yet.</p>
	{/if}
</main>
