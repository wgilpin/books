<script lang="ts">
	let { award, year, result }: { award: string; year: number; result: 'won' | 'shortlisted' } = $props();
	const won = $derived(result === 'won');
	const slug = $derived(award.toLowerCase().replaceAll(' ', '-'));
</script>

<span class="badge badge--{slug}{won ? ' badge--won' : ''}">{award} {year}{won ? ' · won' : ''}</span>
