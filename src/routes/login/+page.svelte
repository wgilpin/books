<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { form } = $props();
</script>

<svelte:head><title>Log in</title></svelte:head>

<main>
	<PageHeader title="Log in" />

	{#if form?.error}
		<p class="notice notice--error" role="alert">{form.error}</p>
	{/if}

	<form class="card stack" method="POST">
		<label class="picker">
			Password
			<input type="password" name="password" autocomplete="current-password" required />
		</label>
		<div><button class="button button--primary" type="submit">Log in</button></div>
	</form>
</main>
