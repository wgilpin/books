<script lang="ts">
	import BookCard from '#lib/components/BookCard.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Queue</title></svelte:head>

<main>
	<PageHeader title="Queue" meta="Books you queued, newest first.">
		<a class="button button--quiet" href="/">Back to the list</a>
	</PageHeader>

	{#if data.books.length > 0}
		<ol class="stack">
			{#each data.books as book (book.source + book.sourceId)}
				<li><BookCard {book} action="?/mark" marks={['owned', 'read', 'rejected']} /></li>
			{/each}
		</ol>
	{:else}
		<p class="notice">Nothing queued.</p>
	{/if}
</main>
