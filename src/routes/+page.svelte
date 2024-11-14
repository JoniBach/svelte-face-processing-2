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
	import { add3DObjectsToScene, generateUVTexturedFace } from '$lib/handle3DObjects.js';

	let canvas;
	let imageFile = null;
	let imageUrl = '';
	let mainScene;
	let imageInScene = false;
	let visualizations = {};
	let stage = 'upload';
	let loadingStage = false;
	let errorMessage = '';

	let isUvFaceInScene = false;
	let isWireframeInScene = false;
	let uvFaceMesh = null;
	let wireframeMesh = null;

	let config = {
		pointSize: 3,
		pointColor: 'purple',
		outerRingColor: 'orange',
		outerRingWidth: 3,
		triangulationColor: 'cyan',
		triangulationWidth: 2,
		invertDepth: true,
		scaleFactor: 1,
		baseElevation: 5
	};

	const targetSceneWidth = 10;

	onMount(() => {
		try {
			mainScene = createThreeDScene({
				canvas,
				width: window.innerWidth * 0.8,
				height: window.innerHeight,
				backgroundColor: 0x202020
			});
		} catch (error) {
			console.error('Error initializing 3D scene:', error);
			errorMessage = 'Failed to initialize the 3D scene.';
		}
	});

	async function loadImage(url) {
		try {
			return await new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = 'Anonymous';
				img.src = url;
				img.onload = () => resolve(img);
				img.onerror = (error) => {
					console.error(`Failed to load image from URL: ${url}`, error);
					reject(error);
				};
			});
		} catch (error) {
			errorMessage = 'Failed to load image.';
			throw error;
		}
	}

	function handleImageUpload(event) {
		imageFile = event.detail.file;
		imageUrl = URL.createObjectURL(imageFile);
		imageInScene = false;
		stage = 'preview';
		handleAddToCanvas();
	}

	async function handleAddToCanvas() {
		if (!mainScene || !imageFile) {
			errorMessage = 'Image or scene is missing.';
			console.warn('No image file or scene available to add to canvas.');
			return;
		}

		try {
			const success = await addImageToScene(mainScene, imageFile);
			if (success) {
				imageInScene = true;
				const img = await loadImage(imageUrl);
				config.scaleFactor = targetSceneWidth / img.width;
			}
		} catch (error) {
			console.error('Error adding image to canvas:', error);
			errorMessage = 'Failed to add image to canvas.';
		}
	}

	async function createPredictions() {
		loadingStage = true;
		errorMessage = '';
		if (!imageUrl) {
			errorMessage = 'No image URL provided for predictions.';
			return;
		}

		try {
			const { handlePredictions } = await import('$lib/handlePredictions.js');
			visualizations = await handlePredictions(imageUrl, config);

			if (!visualizations.vertices || !visualizations.indices) {
				console.warn('Predictions did not return vertices or indices for 3D rendering.');
				errorMessage = 'Prediction data is incomplete for 3D rendering.';
			} else {
				console.log('Predictions data for 3D:', visualizations);
				stage = 'prediction';
			}
		} catch (error) {
			console.error('Error generating predictions:', error);
			errorMessage = 'Failed to generate predictions.';
		} finally {
			loadingStage = false;
			addOverlays();
		}
	}

	async function addOverlays(event) {
		const { showKeypoints, showOuterRing, showTriangulation } = event?.detail || {
			showKeypoints: true,
			showOuterRing: true,
			showTriangulation: true
		};
		try {
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
		} catch (error) {
			console.error('Error adding overlays to scene:', error);
			errorMessage = 'Failed to add overlays.';
		}
	}

	function clearOverlays() {
		try {
			clearScene(mainScene);
			imageInScene = false;
			stage = 'upload';
		} catch (error) {
			console.error('Error clearing overlays:', error);
			errorMessage = 'Failed to clear overlays.';
		}
	}

	function handleAdd3DObjects() {
		stage = '3d';
		add3DObjects();
		addTexturedFace();
	}

	async function add3DObjects() {
		if (!visualizations.vertices || !visualizations.indices) {
			errorMessage = 'No vertices or indices available for 3D objects.';
			return;
		}

		if (!imageUrl) {
			errorMessage = 'No valid image URL for loading 3D objects.';
			return;
		}

		try {
			const img = await loadImage(imageUrl);
			const imageWidth = img.width;
			const imageHeight = img.height;
			wireframeMesh = add3DObjectsToScene(
				mainScene,
				visualizations,
				config,
				imageWidth,
				imageHeight
			);
			isWireframeInScene = true;
			console.log('3D Wireframe added to the canvas.');
		} catch (error) {
			console.error('Error adding 3D objects:', error);
			errorMessage = 'Failed to add 3D objects.';
		}
	}

	async function addTexturedFace() {
		if (!visualizations.vertices || !visualizations.indices) {
			errorMessage = 'No vertices or indices available for the textured face model.';
			return;
		}

		if (!imageUrl) {
			errorMessage = 'No valid image URL for loading 3D texture.';
			return;
		}

		try {
			const img = await loadImage(imageUrl);
			uvFaceMesh = generateUVTexturedFace(mainScene, visualizations, img, config);
			isUvFaceInScene = true;
			console.log('Textured 3D Face Model added to the scene.');
		} catch (error) {
			console.error('Error adding textured 3D face model:', error);
			errorMessage = 'Failed to add textured 3D face model.';
		}
	}

	function toggleUvFaceInScene() {
		if (!isUvFaceInScene) {
			addTexturedFace();
		} else if (uvFaceMesh) {
			mainScene.remove(uvFaceMesh);
			uvFaceMesh.geometry.dispose();
			uvFaceMesh.material.dispose();
			uvFaceMesh = null;
			isUvFaceInScene = false;
			console.log('UV Textured Face removed from the scene.');
		}
	}

	function toggleWireframeInScene() {
		if (!isWireframeInScene) {
			add3DObjects();
		} else if (wireframeMesh) {
			mainScene.remove(wireframeMesh);
			wireframeMesh.geometry.dispose();
			wireframeMesh.material.dispose();
			wireframeMesh = null;
			isWireframeInScene = false;
			console.log('Wireframe removed from the scene.');
		}
	}

	function handleFileSubmit() {
		stage = 'prediction';
		createPredictions();
	}
</script>

<div class="sidebar">
	<h1>Image to Mesh 3D</h1>
	<p>Upload a portrait to get started</p>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}

	{#if stage === 'upload' || stage === 'preview'}
		{#if loadingStage}
			<p>Loading... {stage}</p>
		{:else}
			<FileUploader {imageUrl} on:imageUpload={handleImageUpload} on:submit={handleFileSubmit} />
		{/if}
	{:else if stage === 'prediction'}
		{#if loadingStage}
			<p>Loading... {stage}</p>
		{:else}
			<PredictionPreview
				{imageUrl}
				{visualizations}
				on:addToCanvas={handleAdd3DObjects}
				on:clearOverlays={clearOverlays}
			/>
		{/if}
	{:else if stage === '3d'}
		{#if loadingStage}
			<p>Loading... {stage}</p>
		{:else}
			<button on:click={toggleUvFaceInScene}>
				{isUvFaceInScene ? 'Remove UV Textured Face' : 'Add UV Textured Face'}
			</button>
			<button on:click={toggleWireframeInScene}>
				{isWireframeInScene ? 'Remove Wireframe' : 'Add Wireframe'}
			</button>
		{/if}
	{/if}
</div>

<canvas bind:this={canvas}></canvas>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
	}

	.canvas-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		z-index: 1;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
		background-color: #202020;
		position: absolute;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		max-width: clamp(200px, 50vw, 50vw);
		color: white;
		padding: 20px;
		box-sizing: border-box;
		overflow-y: auto;
		z-index: 10;
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

	.error {
		color: red;
		margin-bottom: 10px;
	}
</style>
