<script lang="ts">
	let { name }: { name: 'bookmark' | 'check' | 'refresh' | 'more' } = $props();
</script>

<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
	{#if name === 'bookmark'}
		<path d="M6 3h12v18l-6-4.5L6 21z" />
	{:else if name === 'check'}
		<path d="M4.5 12.5l5 5 10-11" />
	{:else if name === 'refresh'}
		<path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
	{:else}
		<circle cx="5" cy="12" r="1.6" class="icon__dot" /><circle cx="12" cy="12" r="1.6" class="icon__dot" /><circle cx="19" cy="12" r="1.6" class="icon__dot" />
	{/if}
</svg>
