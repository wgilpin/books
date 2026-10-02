<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data, form } = $props();
	const meta = $derived(
		data.importedAt ? `${data.count} owned books, imported ${data.importedAt}.` : 'No Kindle library imported yet.'
	);
</script>

<svelte:head><title>Import Kindle library</title></svelte:head>

<main>
	<PageHeader title="Import Kindle library" {meta}>
		<a class="button button--quiet" href="/">Back to the list</a>
	</PageHeader>

	{#if form?.error}
		<p class="notice notice--error" role="alert">Import failed: {form.error}</p>
	{:else if form?.imported !== undefined}
		<p class="notice">Imported {form.imported} books.</p>
	{/if}

	<form class="card stack" method="POST" enctype="multipart/form-data">
		<label class="picker">
			Kindle library CSV
			<input type="file" name="file" accept=".csv,text/csv" required />
		</label>
		<div><button class="button button--primary" type="submit">Import</button></div>
	</form>

	<p class="help">
		Make the file with <code>scripts/kindle-export.js</code> on the Kindle library page. The import
		replaces the whole owned list.
	</p>
</main>
