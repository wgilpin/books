<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head><title>Import Kindle library</title></svelte:head>

<main>
	<h1>Import Kindle library</h1>
	<p><a href="/">Back to the list</a></p>

	<p>
		{#if data.importedAt}
			{data.count} owned books, imported {data.importedAt}.
		{:else}
			No Kindle library imported yet.
		{/if}
	</p>

	{#if form?.error}
		<p role="alert">Import failed: {form.error}</p>
	{:else if form?.imported !== undefined}
		<p>Imported {form.imported} books.</p>
	{/if}

	<form method="POST" enctype="multipart/form-data">
		<label>
			Kindle library CSV
			<input type="file" name="file" accept=".csv,text/csv" required />
		</label>
		<button type="submit">Import</button>
	</form>

	<p>
		Make the file with <code>scripts/kindle-export.js</code> on the Kindle library page. The
		import replaces the whole owned list.
	</p>
</main>
