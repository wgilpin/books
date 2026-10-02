<script lang="ts">
	let { data } = $props();
	const running = $derived(data.refresh?.status === 'running');
</script>

<svelte:head>
	<title>Books</title>
	{#if running}
		<!-- Reload until the background refresh ends. -->
		<meta http-equiv="refresh" content="3" />
	{/if}
</svelte:head>

<main>
	<h1>Award novels</h1>
	<p><a href="/import">Import Kindle library</a></p>

	<form method="POST" action="?/refresh">
		<button type="submit" disabled={running}>Refresh from Wikidata</button>
	</form>

	{#if running}
		<p>Refreshing from Wikidata…</p>
	{:else if data.refresh?.status === 'failed'}
		<p role="alert">Refresh failed at {data.refresh.finishedAt}: {data.refresh.error}</p>
	{:else if data.refresh?.status === 'ok'}
		<p>Last refreshed {data.refresh.finishedAt}.</p>
	{/if}

	{#if data.books.length === 0}
		<p>No award data yet.</p>
	{:else}
		<ol>
			{#each data.books as book}
				<li>
					<a href={book.kindleUrl} rel="noopener noreferrer" target="_blank">{book.title}</a>
					— {book.author}
					<form method="POST" action="?/own">
						<input type="hidden" name="source" value={book.source} />
						<input type="hidden" name="sourceId" value={book.sourceId} />
						<button type="submit">I own this</button>
					</form>
					<ul>
						{#each book.awards as entry (entry.award + entry.year)}
							<li>{entry.award} {entry.year} · {entry.result}</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{/if}
</main>
