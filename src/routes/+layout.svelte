<script lang="ts">
	import '$lib/main.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>SourceRuns Schedule</title>
</svelte:head>

{@render children()}
