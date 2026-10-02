<script lang="ts">
	let { award, year, result }: { award: string; year: number; result: 'won' | 'shortlisted' } = $props();
	const won = $derived(result === 'won');
</script>

<span class="badge badge--{award.toLowerCase()}{won ? ' badge--won' : ''}">{award} {year}{won ? ' · won' : ''}</span>
