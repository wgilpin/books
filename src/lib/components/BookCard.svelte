<script lang="ts">
	import AwardBadge from './AwardBadge.svelte';

	type Mark = 'owned' | 'read' | 'queued' | 'rejected';
	interface Book {
		source: string;
		sourceId: string;
		title: string;
		author: string;
		kindleUrl: string;
		awards: { award: string; year: number; result: 'won' | 'shortlisted'; bookTitle?: string }[];
		series?: { name: string; position: number } | null;
		genre?: { sf: boolean; fantasy: boolean };
	}

	let { book, action, marks }: { book: Book; action: string; marks: Mark[] } = $props();

	const BUTTONS: Record<Mark, { label: string; name: string; variant: string }> = {
		owned: { label: 'I own this', name: 'I own', variant: 'secondary' },
		read: { label: 'Read', name: 'I have read', variant: 'secondary' },
		queued: { label: 'Queue', name: 'Queue', variant: 'secondary' },
		rejected: { label: 'Reject', name: 'Reject', variant: 'quiet' }
	};

	/** Award books this entry stands for, when they are not the book shown. */
	const otherAwardBooks = $derived([
		...new Set(book.awards.map((a) => a.bookTitle).filter((t): t is string => !!t && t !== book.title))
	]);
	const unknownGenre = $derived(!!book.genre && !book.genre.sf && !book.genre.fantasy);
</script>

<article class="card">
	<h2 class="card__title"><a href={book.kindleUrl} rel="noopener noreferrer" target="_blank">{book.title}</a></h2>
	<p class="card__author">{book.author}</p>
	{#if book.awards.length || unknownGenre}
		<div class="card__badges">
			{#each book.awards as entry, i (i)}
				<AwardBadge award={entry.award} year={entry.year} result={entry.result} />
			{/each}
			{#if unknownGenre}
				<span class="tag">genre unknown</span>
			{/if}
		</div>
	{/if}
	{#if book.series}
		<p class="card__series">Book {book.series.position} of {book.series.name}</p>
	{/if}
	{#if otherAwardBooks.length}
		<p class="card__series">Award for {otherAwardBooks.join(', ')}</p>
	{/if}
	<div class="card__actions">
		<a class="button button--primary" href={book.kindleUrl} rel="noopener noreferrer" target="_blank">Kindle<span class="sr-only">{' '}(opens in a new tab)</span></a>
		<form class="inline-form card__marks" method="POST" {action}>
			<input type="hidden" name="source" value={book.source} />
			<input type="hidden" name="sourceId" value={book.sourceId} />
			{#each marks as mark (mark)}
				<button class="button button--{BUTTONS[mark].variant}" type="submit" name="mark" value={mark} aria-label="{BUTTONS[mark].name} {book.title}">{BUTTONS[mark].label}</button>
			{/each}
		</form>
	</div>
</article>
