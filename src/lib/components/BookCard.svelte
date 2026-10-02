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
		awardBooks?: { source: string; sourceId: string }[];
	}

	let {
		book,
		action,
		marks,
		genreAction
	}: { book: Book; action: string; marks: Mark[]; genreAction?: string } = $props();

	const GENRE_BUTTONS = [
		{ value: 'sf', label: 'Science fiction' },
		{ value: 'fantasy', label: 'Fantasy' },
		{ value: 'both', label: 'Both' }
	];

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
	{#if unknownGenre && genreAction && book.awardBooks?.length}
		<form class="card__genre" method="POST" action={genreAction}>
			<span class="help">Set genre:</span>
			{#each book.awardBooks as key (key.source + key.sourceId)}
				<input type="hidden" name="work" value="{key.source}|{key.sourceId}" />
			{/each}
			{#each GENRE_BUTTONS as choice (choice.value)}
				<button class="button button--quiet button--small" type="submit" name="genre" value={choice.value} aria-label="Set {book.title} as {choice.label}">{choice.label}</button>
			{/each}
		</form>
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
