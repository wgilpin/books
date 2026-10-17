<script lang="ts">
	import { groupAwards } from '#lib/awards.js';
	import AwardBadge from './AwardBadge.svelte';
	import Icon from './Icon.svelte';

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

	/** Queue and Read sit on the card as icons; the rest go in the More menu. */
	const ICON_MARKS: Partial<Record<Mark, { icon: 'bookmark' | 'check'; label: string; name: string }>> = {
		queued: { icon: 'bookmark', label: 'Queue', name: 'Queue' },
		read: { icon: 'check', label: 'Read', name: 'I have read' }
	};
	const MENU_MARKS: Partial<Record<Mark, { label: string; name: string }>> = {
		owned: { label: 'I own this', name: 'I own' },
		rejected: { label: 'Reject', name: 'Reject' }
	};

	const iconMarks = $derived((['queued', 'read'] as Mark[]).filter((m) => marks.includes(m)));
	const menuMarks = $derived(marks.filter((m) => MENU_MARKS[m]));
	const groups = $derived(groupAwards(book.awards));
	/** Award books this entry stands for, when they are not the book shown. */
	const otherAwardBooks = $derived([
		...new Set(book.awards.map((a) => a.bookTitle).filter((t): t is string => !!t && t !== book.title))
	]);
	const unknownGenre = $derived(!!book.genre && !book.genre.sf && !book.genre.fantasy);
	const currentGenre = $derived(
		!book.genre ? null : book.genre.sf && book.genre.fantasy ? 'both' : book.genre.sf ? 'sf' : book.genre.fantasy ? 'fantasy' : null
	);
	const canSetGenre = $derived(!!genreAction && !!book.awardBooks?.length);
	const coverSrc = $derived(
		`/cover/${encodeURIComponent(book.source)}/${encodeURIComponent(book.sourceId)}?title=${encodeURIComponent(book.title)}`
	);

	let menu = $state<HTMLDetailsElement>();

	/** Close the More menu on a click outside it or on Escape. */
	function closeMenu(event: Event) {
		if (!menu?.open) return;
		if (event instanceof KeyboardEvent ? event.key === 'Escape' : !menu.contains(event.target as Node)) {
			menu.open = false;
		}
	}
</script>

<svelte:document onclick={closeMenu} onkeydown={closeMenu} />

{#snippet genreForm()}
	<form class="card__genre" method="POST" action={genreAction}>
		<span class="help">Genre:</span>
		{#each book.awardBooks ?? [] as key (key.source + key.sourceId)}
			<input type="hidden" name="work" value="{key.source}|{key.sourceId}" />
		{/each}
		{#each GENRE_BUTTONS as choice (choice.value)}
			<button class="chip" type="submit" name="genre" value={choice.value} disabled={choice.value === currentGenre} aria-label="Set {book.title} as {choice.label}">{choice.label}</button>
		{/each}
	</form>
{/snippet}

<article class="card">
	<a class="card__cover" href={book.kindleUrl} rel="noopener noreferrer" target="_blank" tabindex="-1" aria-hidden="true">
		<img src={coverSrc} alt="" loading="lazy" width="80" height="120" />
	</a>
	<div class="card__body">
		<h2 class="card__title"><a href={book.kindleUrl} rel="noopener noreferrer" target="_blank">{book.title}</a></h2>
		<p class="card__author">{book.author}</p>
		{#if book.series}
			<p class="card__series">Book {book.series.position} of {book.series.name}</p>
		{/if}
		{#if groups.length || unknownGenre}
			<div class="card__badges">
				{#each groups as group (group.award)}
					<AwardBadge {group} />
				{/each}
				{#if unknownGenre}
					<span class="tag">genre unknown</span>
				{/if}
			</div>
		{/if}
		{#if otherAwardBooks.length}
			<details class="card__note">
				<summary>Series awards</summary>
				<p class="card__series">Award for {otherAwardBooks.join(', ')}</p>
			</details>
		{/if}
		{#if canSetGenre && unknownGenre}
			{@render genreForm()}
		{/if}
		<div class="card__actions">
			<a class="button button--primary button--small" href={book.kindleUrl} rel="noopener noreferrer" target="_blank">Kindle<span class="sr-only">{' '}(opens in a new tab)</span></a>
			{#if iconMarks.length}
				<form class="inline-form card__marks" method="POST" {action}>
					<input type="hidden" name="source" value={book.source} />
					<input type="hidden" name="sourceId" value={book.sourceId} />
					{#each iconMarks as mark (mark)}
						{@const m = ICON_MARKS[mark]!}
						<button class="icon-button" type="submit" name="mark" value={mark} aria-label="{m.name} {book.title}" title={m.label}><Icon name={m.icon} /></button>
					{/each}
				</form>
			{/if}
			{#if menuMarks.length || (canSetGenre && !unknownGenre)}
				<details class="menu" bind:this={menu}>
					<summary class="icon-button" aria-label="More actions for {book.title}" title="More"><Icon name="more" /></summary>
					<div class="menu__panel">
						{#if menuMarks.length}
							<form class="menu__group" method="POST" {action}>
								<input type="hidden" name="source" value={book.source} />
								<input type="hidden" name="sourceId" value={book.sourceId} />
								{#each menuMarks as mark (mark)}
									{@const m = MENU_MARKS[mark]!}
									<button class="menu__item" type="submit" name="mark" value={mark} aria-label="{m.name} {book.title}">{m.label}</button>
								{/each}
							</form>
						{/if}
						{#if canSetGenre && !unknownGenre}
							{@render genreForm()}
						{/if}
					</div>
				</details>
			{/if}
		</div>
	</div>
</article>
