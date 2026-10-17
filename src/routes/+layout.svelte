<script lang="ts">
	// Imported here so the build gives the stylesheet a hashed name and a deploy never serves a stale copy.
	import "../app.css";

	let { children } = $props();
</script>

{@render children()}
