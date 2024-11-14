<script context="module">
	export const ssr = false;
</script>

<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { createThreeDScene } from '$lib/ThreeDScene.js';
	import { addImageToScene } from '$lib/ImageHandler.js';
	import FileUploader from '../lib/components/FileUploader.svelte';
	import PredictionPreview from '../lib/components/PredictionPreview.svelte';
	import { addOverlaysToScene, clearScene } from '$lib/handlePredictionPreview.js';
	import { add3DObjectsToScene } from '$lib/handle3DObjects.js';

	const config = {
		pointSize: 4,
		pointColor: 'purple',
		outerRingColor: 'orange',
		outerRingWidth: 4,
		triangulationColor: 'cyan',
		triangulationWidth: 2,
		invertDepth: true
	};

	let canvas;
	let imageFile = null;
	let imageUrl = '';
	let mainScene;
	let imageInScene = false;
	let visualizations = {};
	let stage = 'upload';
	let loadingStage = false;

	// Initialize the 3D scene on mount
	onMount(() => {
		mainScene = createThreeDScene({
			canvas,
			width: window.innerWidth * 0.8,
			height: window.innerHeight,
			backgroundColor: 0x202020
		});
	});

	/**
	 * Load an image from a given URL and return as an HTMLImageElement.
	 * @param {string} url - The URL of the image to load.
	 * @returns {Promise<HTMLImageElement>}
	 */
	async function loadImage(url) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.src = url;
			img.onload = () => resolve(img);
			img.onerror = (error) => {
				console.error(`Failed to load image from URL: ${url}`, error);
				reject(error);
			};
		});
	}

	function handleImageUpload(event) {
		imageFile = event.detail.file;
		imageUrl = URL.createObjectURL(imageFile);
		imageInScene = false;
		stage = 'preview';
		handleAddToCanvas();
	}

	async function handleAddToCanvas() {
		if (mainScene && imageFile) {
			try {
				const success = await addImageToScene(mainScene, imageFile);
				imageInScene = success;
			} catch (error) {
				console.error('Error adding image to canvas:', error);
			}
		} else {
			console.warn('No image file or scene available to add to canvas.');
		}
	}

	async function createPredictions() {
		loadingStage = true;
		if (!imageUrl) return;

		const { handlePredictions } = await import('$lib/handlePredictions.js');
		visualizations = await handlePredictions(imageUrl, config);

		if (visualizations.vertices && visualizations.indices) {
			console.log('Predictions data for 3D:', visualizations);
		} else {
			console.warn('Predictions did not return vertices or indices for 3D rendering.');
		}

		stage = 'prediction';
		loadingStage = false;
		addOverlays();
	}

	async function addOverlays(event) {
		const { showKeypoints, showOuterRing, showTriangulation } = event?.detail || {
			showKeypoints: true,
			showOuterRing: true,
			showTriangulation: true
		};
		const img = await loadImage(imageUrl);

		const imageAspectRatio = img.width / img.height;
		const baseHeight = 10;

		await addOverlaysToScene(
			mainScene,
			visualizations,
			showTriangulation,
			showOuterRing,
			showKeypoints,
			imageAspectRatio,
			baseHeight
		);
	}

	function clearOverlays() {
		clearScene(mainScene);
		imageInScene = false;
		stage = 'upload';
	}

	async function add3DObjects() {
		if (!visualizations.vertices || !visualizations.indices) {
			console.warn('No vertices or indices available in visualizations for 3D objects.');
			return;
		}

		if (!imageUrl) {
			console.warn('No valid imageUrl available for loading the 3D objects.');
			return;
		}

		try {
			const img = await loadImage(imageUrl);
			const imageWidth = img.width;
			const imageHeight = img.height;
			add3DObjectsToScene(mainScene, visualizations, config, imageWidth, imageHeight);
			console.log('3D Objects added to the canvas.');
		} catch (error) {
			console.error('Error adding 3D objects:', error);
		}
	}

	function handleFileSubmit() {
		stage = 'prediction';
		createPredictions();
	}
</script>

<div class="container">
	<div class="sidebar">
		<h1>Face Map Studio</h1>

		<!-- Display FileUploader for file selection and preview -->
		{#if stage === 'upload' || stage === 'preview'}
			{#if loadingStage}
				<p>Loading... {stage}</p>
			{:else}
				<FileUploader {imageUrl} on:imageUpload={handleImageUpload} on:submit={handleFileSubmit} />
			{/if}

			<!-- PredictionPreview for toggling overlays, adding to canvas, and adding 3D objects -->
		{:else if stage === 'prediction'}
			{#if loadingStage}
				<p>Loading... {stage}</p>
			{:else}
				<PredictionPreview
					{imageUrl}
					{visualizations}
					on:addToCanvas={add3DObjects}
					on:clearOverlays={clearOverlays}
				/>
			{/if}
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
		max-height: 100vh;
		overflow-y: auto;
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
