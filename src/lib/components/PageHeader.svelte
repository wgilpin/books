<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, meta, children }: { title: string; meta?: string; children?: Snippet } = $props();
</script>

<header class="header">
	<div class="header__text">
		<h1>{title}</h1>
		{#if meta}<p class="header__meta">{meta}</p>{/if}
	</div>
	{#if children}<div class="header__actions">{@render children()}</div>{/if}
</header>
