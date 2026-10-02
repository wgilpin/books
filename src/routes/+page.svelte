<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Books</title></svelte:head>

<main>
	<h1>Award novels</h1>
	<form method="POST" action="?/refresh">
		<button type="submit">Refresh from Wikidata</button>
	</form>
	{#if data.books.length === 0}
		<p>No award data yet.</p>
	{/if}
</main>
