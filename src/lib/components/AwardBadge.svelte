<script lang="ts">
	import type { AwardGroup } from '#lib/awards.js';
	let { group }: { group: AwardGroup } = $props();
	const slug = $derived(group.award.toLowerCase().replaceAll(' ', '-'));
</script>

<span class="badge badge--{slug}{group.won ? ' badge--won' : ''}" title="{group.award}: {group.detail}">{group.won ? '★ ' : ''}{group.label}<span class="sr-only">, {group.detail}</span></span>
