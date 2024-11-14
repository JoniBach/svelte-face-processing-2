<script>
	import { createEventDispatcher } from 'svelte';

	export let imageUrl;
	export let visualizations;

	let showKeypoints = true;
	let showOuterRing = true;
	let showTriangulation = true;
	let showOriginalImage = true;

	const dispatch = createEventDispatcher();

	// Toggle visibility of overlays and dispatch addToCanvas
	function handleAddToCanvas() {
		dispatch('addToCanvas');
	}

	// Clear overlays
	function handleClearOverlays() {
		dispatch('clearOverlays');
	}
</script>

<div>
	<h2>Overlay Preview</h2>
	<div class="image-box">
		{#if imageUrl && showOriginalImage}
			<img src={imageUrl} alt="Original Image" class="original-image" />
		{/if}

		{#if showKeypoints && visualizations.keypointsImage}
			<img src={visualizations.keypointsImage} alt="Keypoints" class="overlay" />
		{/if}
		{#if showOuterRing && visualizations.outerRingImage}
			<img src={visualizations.outerRingImage} alt="Outer Ring" class="overlay" />
		{/if}
		{#if showTriangulation && visualizations.triangulationImage}
			<img src={visualizations.triangulationImage} alt="Triangulation" class="overlay" />
		{/if}
	</div>

	<!-- Toggle buttons for each overlay type -->
	<!-- {#if imageUrl}
		<button on:click={() => (showOriginalImage = !showOriginalImage)}>
			{showOriginalImage ? 'Hide' : 'Show'} Original Image
		</button>
	{/if}
	{#if showKeypoints && visualizations.keypointsImage}
		<button on:click={() => (showKeypoints = !showKeypoints)}>
			{showKeypoints ? 'Hide' : 'Show'} Keypoints
		</button>
	{/if}
	{#if showOuterRing && visualizations.outerRingImage}
		<button on:click={() => (showOuterRing = !showOuterRing)}>
			{showOuterRing ? 'Hide' : 'Show'} Outer Ring
		</button>
	{/if}
	{#if showTriangulation && visualizations.triangulationImage}
		<button on:click={() => (showTriangulation = !showTriangulation)}>
			{showTriangulation ? 'Hide' : 'Show'} Triangulation
		</button>
	{/if} -->

	<!-- Action buttons to add overlays to canvas or clear them -->
	<!-- <button on:click={handleAddToCanvas}>Add to Canvas</button> -->
	<button on:click={handleClearOverlays}>Clear Predictions</button>
	<button on:click={handleAddToCanvas}>Generate 3D Wireframe</button>
</div>

<style>
	.image-box {
		width: 100%;
		padding-top: 100%;
		position: relative;
		margin-top: 10px;
		background-color: #444;
		border-radius: 4px;
		overflow: hidden;
	}

	.original-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.4; /* Adjust opacity to make it subtle in the background */
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	button {
		margin-top: 10px;
		padding: 8px 12px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		width: 100%;
	}

	button:hover {
		background-color: #0056b3;
	}
</style>
