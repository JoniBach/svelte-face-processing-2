<script context="module">
	export const ssr = false; // Disable SSR to prevent navigator issues
</script>

<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { createThreeDScene } from '$lib/ThreeDScene.js';
	import { addImageToScene } from '$lib/ImageHandler.js';
	import FileUploader from '../lib/components/FileUploader.svelte';
	import PredictionPreview from '../lib/components/PredictionPreview.svelte';
	import { addOverlaysToScene, clearScene } from '$lib/handlePredictionPreview.js';

	const config = {
		pointSize: 3,
		pointColor: 'purple',
		outerRingColor: 'orange',
		outerRingWidth: 3,
		triangulationColor: 'cyan',
		triangulationWidth: 1.5
	};

	let canvas;
	let imageFile = null;
	let imageUrl = '';
	let mainScene;
	let imageInScene = false;
	let visualizations = {};
	let stage = 'upload'; // Controls which stage is displayed: 'upload' or 'prediction'

	// Initialize the 3D scene on mount
	onMount(() => {
		mainScene = createThreeDScene({
			canvas,
			width: window.innerWidth * 0.8,
			height: window.innerHeight,
			backgroundColor: 0x202020
		});
	});

	// Handle file upload
	function handleImageUpload(event) {
		imageFile = event.detail.file;
		imageUrl = URL.createObjectURL(imageFile);
		imageInScene = false; // Reset image status in scene
		stage = 'preview'; // Move to preview stage after upload
	}

	// Add image to the Three.js canvas
	async function handleAddToCanvas() {
		if (mainScene && imageFile) {
			try {
				const success = await addImageToScene(mainScene, imageFile);
				imageInScene = success;
				console.log('Image successfully added to canvas.');
			} catch (error) {
				console.error('Error adding image to canvas:', error);
			}
		} else {
			console.warn('No image file or scene available to add to canvas.');
		}
	}

	// Create predictions and generate overlay images
	async function createPredictions() {
		if (!imageUrl) return;

		const { handlePredictions } = await import('$lib/handlePredictions.js');
		visualizations = await handlePredictions(imageUrl, config);
		stage = 'prediction'; // Switch to prediction preview stage after processing
	}

	// Add overlays as textures to the Three.js canvas based on user selections
	async function addOverlays(event) {
		const { showKeypoints, showOuterRing, showTriangulation } = event.detail;
		const img = new Image();
		img.src = imageUrl;

		img.onload = async () => {
			const imageAspectRatio = img.width / img.height;
			const baseHeight = 10; // Set the base height for the plane

			await addOverlaysToScene(
				mainScene,
				visualizations,
				showTriangulation,
				showOuterRing,
				showKeypoints,
				imageAspectRatio,
				baseHeight
			);
		};
	}

	// Clear all overlays from the Three.js scene
	function clearOverlays() {
		clearScene(mainScene);
		imageInScene = false;
		stage = 'upload'; // Reset to upload stage
	}

	function handleFileSubmit() {
		stage = 'prediction';
		handleAddToCanvas();
		createPredictions();
	}
</script>

<div class="container">
	<div class="sidebar">
		<h1>Face Map Studio</h1>

		<!-- Display FileUploader for file selection and preview -->
		{#if stage === 'upload' || stage === 'preview'}
			<FileUploader {imageUrl} on:imageUpload={handleImageUpload} on:submit={handleFileSubmit} />

			<!-- PredictionPreview for toggling overlays and adding to canvas -->
		{:else if stage === 'prediction'}
			<PredictionPreview
				{imageUrl}
				{visualizations}
				on:addToCanvas={addOverlays}
				on:clearOverlays={clearOverlays}
			/>
		{/if}
	</div>

	<!-- Bind the canvas for 3D scene rendering -->
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
	}

	.container {
		display: flex;
		width: 100vw;
		height: 100vh;
	}

	.sidebar {
		width: 20vw;
		flex-shrink: 0;
		background-color: #333;
		color: white;
		padding: 20px;
		box-sizing: border-box;
		max-height: 100vh; /* Set maximum height to the viewport height */
		overflow-y: auto; /* Enable vertical scrolling */
	}

	canvas {
		width: 80vw;
		height: 100vh;
		display: block;
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
