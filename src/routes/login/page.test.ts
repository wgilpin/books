import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const page = (form: object | null) => render(Page, { props: { data: {}, form } as never }).body;

describe('/login page', () => {
	it('has a labelled password field that posts the form', () => {
		const body = page(null);
		expect(body).toMatch(/<form[^>]*method="POST"/);
		expect(body).not.toMatch(/method="GET"/i);
		expect(body).toMatch(/<label[^>]*>[^<]*Password[\s\S]*<input[^>]*type="password"[^>]*name="password"/);
		expect(body).toMatch(/autocomplete="current-password"/);
		expect(body).toMatch(/<button class="button button--primary" type="submit">Log in<\/button>/);
	});

	it('shows the error with an empty password field after a failure', () => {
		const body = page({ error: 'Wrong password' });
		expect(body).toMatch(/<p class="notice notice--error" role="alert">Wrong password<\/p>/);
		expect(body).not.toMatch(/<input[^>]*type="password"[^>]*value=/);
	});
});
