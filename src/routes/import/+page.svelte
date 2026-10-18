<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';

	let { data, form } = $props();
	const meta = $derived(
		data.importedAt ? `${data.count} owned books, imported ${data.importedAt}.` : 'No Kindle library imported yet.'
	);
	const snippet = `(async () => {
	const selector = '[id^="title-"]';
	let last = 0, still = 0;
	while (still < 5) {
		const items = document.querySelectorAll(selector);
		items[items.length - 1]?.scrollIntoView();
		await new Promise((r) => setTimeout(r, 1500));
		const n = document.querySelectorAll(selector).length;
		still = n === last ? still + 1 : 0;
		last = n;
		console.log(\`loaded \${n}\`);
	}
	const quote = (s) => \`"\${(s ?? '').replace(/"/g, '""')}"\`;
	const rows = [...document.querySelectorAll(selector)].map((el) => {
		const asin = el.id.slice('title-'.length);
		return [asin, el.innerText.trim(), document.getElementById(\`author-\${asin}\`)?.innerText.trim() ?? ''];
	});
	const csv = ['asin,title,author', ...rows.map((r) => r.map(quote).join(','))].join('\\n');
	if (typeof copy === 'function') copy(csv);
	const a = Object.assign(document.createElement('a'), {
		href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
		download: 'kindle_books.csv'
	});
	document.body.append(a);
	a.click();
	a.remove();
	console.log(\`\${rows.length} books exported\`);
})();`;
</script>

<svelte:head><title>Import Kindle library</title></svelte:head>

<main>
	<PageHeader title="Import Kindle library" {meta}>
		<a class="tab" href="/">Back to the list</a>
		<a class="tab" href="/queue">Queue <span class="count">{data.queueCount ?? 0}</span></a>
	</PageHeader>

	{#if form?.error}
		<p class="notice notice--error" role="alert">Import failed: {form.error}</p>
	{:else if form?.imported !== undefined}
		<p class="notice">Imported {form.imported} books.</p>
	{/if}

	<form class="panel" method="POST" enctype="multipart/form-data">
		<label class="picker">
			Kindle library CSV
			<input type="file" name="file" accept=".csv,text/csv" required />
		</label>
		<div><button class="button button--primary" type="submit">Import</button></div>
	</form>

	<section class="panel instructions" aria-labelledby="how-to-export">
		<h2 id="how-to-export">How to export your Kindle library</h2>
		<ol class="steps">
			<li>
				On a computer, open
				<a href="https://read.amazon.co.uk/kindle-library" target="_blank" rel="noreferrer"
					>read.amazon.co.uk/kindle-library<span class="sr-only"> (opens in a new tab)</span></a
				>
				and sign in to your Amazon account.
			</li>
			<li>
				Open the browser developer console (<strong>Cmd+Option+J</strong> in Chrome on Mac,
				<strong>Cmd+Option+C</strong> in Safari, or <strong>F12</strong> on Windows).
			</li>
			<li>
				Paste the script below into the console and press <strong>Enter</strong>. Leave the tab open while it scrolls to
				the bottom of your library:
				<pre class="code"><code>{snippet}</code></pre>
			</li>
			<li>
				When it finishes, it downloads <code>kindle_books.csv</code> (and copies the CSV to your clipboard — if your
				browser blocks the download, run <code>pbpaste &gt; kindle_books.csv</code> in Terminal or paste into a text file
				saved as <code>kindle_books.csv</code>).
			</li>
			<li>Choose <code>kindle_books.csv</code> above and press <strong>Import</strong>. This replaces your owned list.</li>
		</ol>
	</section>
</main>
