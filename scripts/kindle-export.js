// Kindle library export. Paste into the browser console on
// https://read.amazon.com/kindle-library (or read.amazon.co.uk), signed in.
// It scrolls until every book has loaded, then copies a CSV to the clipboard.
// Save it with:  pbpaste > data/kindle_books.csv   (with LANG=en_US.UTF-8 set)
// Then upload the file on /import.
(async () => {
	const selector = '[id^="title-"]';
	let last = 0;
	let still = 0;
	while (still < 5) {
		const items = document.querySelectorAll(selector);
		items[items.length - 1]?.scrollIntoView();
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const n = document.querySelectorAll(selector).length;
		still = n === last ? still + 1 : 0;
		last = n;
		console.log(`loaded ${n}`);
	}

	const quote = (s) => `"${(s ?? '').replace(/"/g, '""')}"`;
	const rows = [...document.querySelectorAll(selector)].map((el) => {
		const asin = el.id.slice('title-'.length);
		const title = el.innerText.trim();
		const author = document.getElementById(`author-${asin}`)?.innerText.trim() ?? '';
		return [asin, title, author];
	});
	const blank = rows.filter((row) => !row[1] || !row[2]).length;
	const csv = ['asin,title,author', ...rows.map((row) => row.map(quote).join(','))].join('\n');
	// Copy to clipboard (DevTools helper) and trigger a file download.
	if (typeof copy === 'function') copy(csv);
	const a = Object.assign(document.createElement('a'), {
		href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
		download: 'kindle_books.csv'
	});
	document.body.append(a);
	a.click();
	a.remove();
	console.log(`${rows.length} books exported (${blank} missing title or author)`);
})();
