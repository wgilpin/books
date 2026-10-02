<script lang="ts">
	import AwardBadge from '#lib/components/AwardBadge.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
	const running = $derived(data.refresh?.status === 'running');
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
		<form class="inline-form" method="POST" action="?/refresh">
			<button class="button button--secondary" type="submit" disabled={running}>Refresh from Wikidata</button>
		</form>
		<a class="button button--quiet" href="/import">Import Kindle library</a>
	</PageHeader>

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
					<article class="card">
						<h2 class="card__title"><a href={book.kindleUrl} rel="noopener noreferrer" target="_blank">{book.title}</a></h2>
						<p class="card__author">{book.author}</p>
						<div class="card__badges">
							{#each book.awards as entry (entry.award + entry.year)}
								<AwardBadge {...entry} />
							{/each}
						</div>
						<div class="card__actions">
							<a class="button button--primary" href={book.kindleUrl} rel="noopener noreferrer" target="_blank">Kindle<span class="sr-only">{' '}(opens in a new tab)</span></a>
							<form class="inline-form" method="POST" action="?/own">
								<input type="hidden" name="source" value={book.source} />
								<input type="hidden" name="sourceId" value={book.sourceId} />
								<button class="button button--secondary" type="submit" aria-label="I own {book.title}">I own this</button>
							</form>
						</div>
					</article>
				</li>
			{/each}
		</ol>
	{:else if data.refresh?.status === 'ok'}
		<p class="notice">You own every award book in the list.</p>
	{:else}
		<p class="notice">No award data yet.</p>
	{/if}
</main>
