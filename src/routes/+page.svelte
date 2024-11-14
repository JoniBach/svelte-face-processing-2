<script context="module">
	export const ssr = false; // Disable SSR to prevent navigator issues
</script>

<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { createThreeDScene } from '$lib/ThreeDScene.js';
	import { addImageToScene } from '$lib/ImageHandler.js';
	import FileUploader from '../lib/components/FileUploader.svelte';

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

	let showOriginalInSidebar = true;
	let showKeypoints = true;
	let showOuterRing = true;
	let showTriangulation = true;

	// Initialize the 3D scene on mount
	onMount(() => {
		mainScene = createThreeDScene({
			canvas,
			width: window.innerWidth * 0.8,
			height: window.innerHeight,
			backgroundColor: 0x202020
		});
	});

	// Event handler for predictions
	async function createPredictions() {
		console.log('Creating predictions');
		if (!imageUrl) {
			console.warn('No image uploaded.');
			return;
		}

		const { handlePredictions } = await import('$lib/handlePredictions.js');
		visualizations = await handlePredictions(imageUrl, config);
	}

	// Event handler for image upload
	function handleImageUpload(event) {
		imageFile = event.detail.file;
		imageUrl = URL.createObjectURL(imageFile);
	}

	// Event handler for adding image to canvas
	async function handleAddToCanvas() {
		if (mainScene && imageFile) {
			addImageToScene(mainScene, imageFile).then((success) => {
				imageInScene = success;
			});
		} else {
			console.warn('No image file or scene available to add to canvas.');
		}
	}

	// Event handler for removing the image from the canvas
	function removeImageFromCanvas() {
		if (mainScene) {
			mainScene.children = mainScene.children.filter(
				(child) => !(child.isMesh && child.material.map)
			);
			imageInScene = false;
		}
	}

	// Function to add overlays as textures in the Three.js canvas
	function addOverlaysToScene() {
		if (!mainScene || !imageUrl) return;

		const loader = new THREE.TextureLoader();

		// Load the image to determine its dimensions
		const img = new Image();
		img.src = imageUrl;
		img.onload = () => {
			const imageAspectRatio = img.width / img.height;
			const baseHeight = 10; // Set the base height for the plane
			const baseWidth = baseHeight * imageAspectRatio; // Calculate width to match aspect ratio

			// Ensure the overlay order: Triangulation (bottom), Outer Ring (middle), Keypoints (top)
			if (showTriangulation && visualizations.triangulationImage) {
				loader.load(visualizations.triangulationImage, (texture) => {
					const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
					const plane = new THREE.Mesh(new THREE.PlaneGeometry(baseWidth, baseHeight), material);
					plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
					plane.position.set(0, 0.01, 0); // Slightly above the original image
					mainScene.add(plane);
				});
			}

			if (showOuterRing && visualizations.outerRingImage) {
				loader.load(visualizations.outerRingImage, (texture) => {
					const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
					const plane = new THREE.Mesh(new THREE.PlaneGeometry(baseWidth, baseHeight), material);
					plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
					plane.position.set(0, 0.015, 0); // Middle layer
					mainScene.add(plane);
				});
			}

			if (showKeypoints && visualizations.keypointsImage) {
				loader.load(visualizations.keypointsImage, (texture) => {
					const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
					const plane = new THREE.Mesh(new THREE.PlaneGeometry(baseWidth, baseHeight), material);
					plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
					plane.position.set(0, 0.02, 0); // Top layer
					mainScene.add(plane);
				});
			}
		};
	}
</script>

<div class="container">
	<div class="sidebar">
		<h1>Face Map Studio</h1>
		<p>Upload a headshot to get started</p>

		<!-- Conditional UI based on whether an image is present in the scene -->
		{#if imageInScene}
			<p>An image is currently loaded in the scene.</p>
			<button on:click={createPredictions}>Create Predictions</button>
			<button on:click={removeImageFromCanvas}>Remove Image</button>
		{:else}
			<FileUploader
				on:imageUpload={handleImageUpload}
				on:addToCanvas={handleAddToCanvas}
				{imageUrl}
			/>
		{/if}

		<!-- Toggle overlay visibility and add overlay button -->
		{#if visualizations.keypointsImage}
			<h2>Visualizations</h2>
			<div class="image-box">
				{#if showOriginalInSidebar}
					<img src={imageUrl} alt="Original" class="original-image" />
				{/if}
				{#if showKeypoints}
					<img src={visualizations.keypointsImage} alt="Keypoints" class="overlay" />
				{/if}
				{#if showOuterRing}
					<img src={visualizations.outerRingImage} alt="Outer Ring" class="overlay" />
				{/if}
				{#if showTriangulation}
					<img src={visualizations.triangulationImage} alt="Triangulation" class="overlay" />
				{/if}
			</div>

			<div class="overlay-controls">
				<button on:click={() => (showOriginalInSidebar = !showOriginalInSidebar)}>
					{showOriginalInSidebar ? 'Hide' : 'Show'} Original
				</button>
				<button on:click={() => (showKeypoints = !showKeypoints)}>
					{showKeypoints ? 'Hide' : 'Show'} Keypoints
				</button>
				<button on:click={() => (showOuterRing = !showOuterRing)}>
					{showOuterRing ? 'Hide' : 'Show'} Outer Ring
				</button>
				<button on:click={() => (showTriangulation = !showTriangulation)}>
					{showTriangulation ? 'Hide' : 'Show'} Triangulation
				</button>
				<button on:click={addOverlaysToScene}>Add to Canvas</button>
			</div>
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

	h1 {
		text-align: center;
	}

	h2 {
		margin-top: 20px;
		font-size: 1.2em;
		text-align: center;
	}

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

	.overlay-controls button {
		margin-top: 10px;
		width: 100%;
	}
</style>
