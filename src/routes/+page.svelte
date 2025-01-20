<script context="module">
	import { facely } from './../lib';
	import { pipeline } from './../lib/pipeline.js';
	export const ssr = false;
</script>

<script>
	import { onMount } from 'svelte';
	import { createThreeDScene } from '$lib/ThreeDScene.js';
	import { addImageToScene, loadImage } from '$lib/ImageHandler.js';
	import FileUploader from '../lib/components/FileUploader.svelte';
	import PredictionPreview from '../lib/components/PredictionPreview.svelte';
	import { addOverlaysToScene, clearScene } from '$lib/handlePredictionPreview.js';
	import { add3DObjectsToScene, generateUVTexturedFace } from '$lib/handle3DObjects.js';
	import { handleDepthEstimation } from '$lib/handleDepthEstimation.js';
	import { processDownloadAssets } from '$lib/handleDownloads.js';

	let canvas;
	let mainScene;

	// Configuration object
	const config = {
		pointSize: 3,
		pointColor: 'purple',
		outerRingColor: 'orange',
		outerRingWidth: 3,
		triangulationColor: 'cyan',
		triangulationWidth: 2,
		invertDepth: true,
		scaleFactor: 1,
		baseElevation: 5,
		minDepth: 0,
		maxDepth: 1,
		outputDepthRange: [0, 1],
		invertDepthMap: false,
		depthMapFormat: 'image/png'
	};
	const targetSceneWidth = 10;

	// Individual state variables
	let imageFile = null;
	let imageUrl = '';
	let imageInScene = false;
	let visualizations = {};
	let stage = 'upload';
	let loadingStage = false;
	let errorMessage = '';
	let depthMapImage = null;
	let isUvFaceInScene = false;
	let isWireframeInScene = false;
	let uvFaceMesh = null;
	let wireframeMesh = null;

	let facelyRes = null;

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

	// Event Handlers

	async function handleImageUpload(event) {
		// Handler function that assigns state variables
		// const result = await processImageUpload(event);
		// if (result.error) {
		// 	errorMessage = result.error;
		// } else {
		// 	imageFile = result.imageFile;
		// 	imageUrl = result.imageUrl;
		// 	imageInScene = result.imageInScene;
		// 	stage = result.stage;
		// 	config.scaleFactor = result.scaleFactor;
		// }

		const imageFile = event.detail.file;
		const progressEvent = (e) => console.log(e)
		const res = await facely(imageFile, canvas, progressEvent)
		facelyRes = res
		console.log(res)
	}

	async function handleFileSubmit() {
		const result = await processFileSubmit(imageUrl);
		if (result.error) {
			errorMessage = result.error;
		} else {
			visualizations = result.visualizations;
			stage = result.stage;
			await addOverlaysToScenePure(visualizations, imageUrl);
		}
	}

	async function handleAdd3DObjects() {
		const result = await processAdd3DObjects(visualizations, imageUrl);
		if (result.error) {
			errorMessage = result.error;
		} else {
			wireframeMesh = result.wireframeMesh;
			isWireframeInScene = result.isWireframeInScene;
			uvFaceMesh = result.uvFaceMesh;
			isUvFaceInScene = result.isUvFaceInScene;
			stage = result.stage;
		}
	}

	async function toggleUvFaceInScene() {
		const result = await processToggleUvFaceInScene(
			isUvFaceInScene,
			uvFaceMesh,
			visualizations,
			imageUrl
		);
		if (result.error) {
			errorMessage = result.error;
		} else {
			uvFaceMesh = result.uvFaceMesh;
			isUvFaceInScene = result.isUvFaceInScene;
		}
	}

	async function toggleWireframeInScene() {
		const result = await processToggleWireframeInScene(
			isWireframeInScene,
			wireframeMesh,
			visualizations,
			imageUrl
		);
		if (result.error) {
			errorMessage = result.error;
		} else {
			wireframeMesh = result.wireframeMesh;
			isWireframeInScene = result.isWireframeInScene;
		}
	}

	async function initiateDepthMapStage() {
		loadingStage = true;
		stage = 'depth';
		const result = await handleDepthEstimation(imageFile, config);
		if (result.error) {
			errorMessage = result.error;
		} else {
			depthMapImage = result;
			console.log('Depth map generated.');
		}
		loadingStage = false;
	}

	// Add textures and overlays
	const overlayTypes = ['combinedImage', 'keypointsImage', 'triangulationImage', 'outerRingImage'];

	async function downloadAssets() {
		const result = await processDownloadAssets(
			imageFile,
			imageUrl,
			depthMapImage,
			visualizations,
			uvFaceMesh,
			overlayTypes
		);
		if (result.error) {
			errorMessage = result.error;
		} else {
			console.log('Assets successfully downloaded!');
		}
	}

	function clearOverlays() {
		clearScene(mainScene);
		imageInScene = false;
		stage = 'upload';
		visualizations = {};
		isUvFaceInScene = false;
		isWireframeInScene = false;
		uvFaceMesh = null;
		wireframeMesh = null;
	}

	// Processing Functions (Pure Functions)

	async function processImageUpload(event) {
		// Pure function that processes the event and returns the result
		const imageFile = event.detail.file;
		const imageUrl = URL.createObjectURL(imageFile);
		const stage = 'preview';

		const addResult = await processAddToCanvas(imageFile, imageUrl);
		if (addResult.error) {
			return { error: addResult.error };
		} else {
			const { imageInScene, scaleFactor } = addResult;
			return { imageFile, imageUrl, imageInScene, stage, scaleFactor };
		}
	}

	async function processAddToCanvas(imageFile, imageUrl) {
		if (!mainScene || !imageFile) {
			console.warn('No image file or scene available to add to canvas.');
			return { error: 'Image or scene is missing.' };
		}

		try {
			const success = await addImageToScene(mainScene, imageFile);
			if (success) {
				const img = await loadImage(imageUrl);
				const scaleFactor = targetSceneWidth / img.width;
				return { imageInScene: true, scaleFactor };
			} else {
				return { error: 'Failed to add image to canvas.' };
			}
		} catch (error) {
			console.error('Error adding image to canvas:', error);
			return { error: 'Failed to add image to canvas.' };
		}
	}

	async function processFileSubmit(imageUrl) {
		if (!imageUrl) {
			return { error: 'No image URL provided for predictions.' };
		}

		try {
			const { handlePredictions } = await import('$lib/handlePredictions.js');
			const visualizations = await handlePredictions(imageUrl, config);

			if (!visualizations.vertices || !visualizations.indices) {
				console.warn('Predictions did not return vertices or indices for 3D rendering.');
				return { error: 'Prediction data is incomplete for 3D rendering.' };
			} else {
				const stage = 'prediction';
				return { visualizations, stage };
			}
		} catch (error) {
			console.error('Error generating predictions:', error);
			return { error: 'Failed to generate predictions.' };
		}
	}

	async function addOverlaysToScenePure(visualizations, imageUrl) {
		try {
			const img = await loadImage(imageUrl);
			const imageAspectRatio = img.width / img.height;
			const baseHeight = 10;

			await addOverlaysToScene(
				mainScene,
				visualizations,
				true, // showTriangulation
				true, // showOuterRing
				true, // showKeypoints
				imageAspectRatio,
				baseHeight
			);
		} catch (error) {
			console.error('Error adding overlays to scene:', error);
			errorMessage = 'Failed to add overlays.';
		}
	}

	async function processAdd3DObjects(visualizations, imageUrl) {
		if (!visualizations.vertices || !visualizations.indices) {
			return { error: 'No vertices or indices available for 3D objects.' };
		}

		if (!imageUrl) {
			return { error: 'No valid image URL for loading 3D objects.' };
		}

		try {
			const img = await loadImage(imageUrl);
			const imageWidth = img.width;
			const imageHeight = img.height;

			const wireframeMesh = add3DObjectsToScene(
				mainScene,
				visualizations,
				config,
				imageWidth,
				imageHeight
			);
			const isWireframeInScene = true;
			console.log('3D Wireframe added to the canvas.');

			const uvFaceMesh = generateUVTexturedFace(mainScene, visualizations, img, config);
			const isUvFaceInScene = true;
			console.log('Textured 3D Face Model added to the scene.');

			const stage = '3d';

			return { wireframeMesh, isWireframeInScene, uvFaceMesh, isUvFaceInScene, stage };
		} catch (error) {
			console.error('Error adding 3D objects:', error);
			return { error: 'Failed to add 3D objects.' };
		}
	}

	async function processToggleUvFaceInScene(isUvFaceInScene, uvFaceMesh, visualizations, imageUrl) {
		if (!isUvFaceInScene) {
			try {
				const img = await loadImage(imageUrl);
				uvFaceMesh = generateUVTexturedFace(mainScene, visualizations, img, config);
				isUvFaceInScene = true;
				console.log('UV Textured Face added to the scene.');
			} catch (error) {
				console.error('Error adding textured 3D face model:', error);
				return { error: 'Failed to add textured 3D face model.' };
			}
		} else if (uvFaceMesh) {
			mainScene.remove(uvFaceMesh);
			uvFaceMesh.geometry.dispose();
			uvFaceMesh.material.dispose();
			uvFaceMesh = null;
			isUvFaceInScene = false;
			console.log('UV Textured Face removed from the scene.');
		}
		return { uvFaceMesh, isUvFaceInScene };
	}

	async function processToggleWireframeInScene(
		isWireframeInScene,
		wireframeMesh,
		visualizations,
		imageUrl
	) {
		if (!isWireframeInScene) {
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
				console.log('Wireframe added to the scene.');
			} catch (error) {
				console.error('Error adding wireframe:', error);
				return { error: 'Failed to add wireframe.' };
			}
		} else if (wireframeMesh) {
			mainScene.remove(wireframeMesh);
			wireframeMesh.geometry.dispose();
			wireframeMesh.material.dispose();
			wireframeMesh = null;
			isWireframeInScene = false;
			console.log('Wireframe removed from the scene.');
		}
		return { wireframeMesh, isWireframeInScene };
	}
</script>

<div class="sidebar">
	<h1>Image to Mesh 3D</h1>
	<p>Upload a portrait to get started</p>
	<p>Note: some browsers are not currently supported</p>
	Stage: {stage}
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
			<button on:click={initiateDepthMapStage}>Produce Depth Map</button>
		{/if}
	{:else if stage === 'depth'}
		{#if loadingStage}
			<p>Loading... {stage}</p>
		{:else}
			<p>Depth Preview</p>
			<div class="image-box">
				<img
					src={URL.createObjectURL(depthMapImage)}
					alt="Depth Map Preview"
					class="original-image"
				/>
			</div>
			<button on:click={downloadAssets}>Download Assets</button>
		{/if}
	{:else if stage === 'downloads'}
		{#if loadingStage}
			<p>Loading... {stage}</p>
		{:else}
			<p>Complete!</p>
			<button on:click={downloadAssets}>Download Assets</button>
		{/if}
	{:else}
		<p>Unknown stage: {stage}</p>
	{/if}

	{#if facelyRes}
		<button on:click={() => facelyRes.add.image()}>Add Image</button>
		<button on:click={() => facelyRes.add.wireframe()}>Add Wireframe</button>
		<button on:click={() => facelyRes.add.edges()}>Add Edges</button>
		<button on:click={() => facelyRes.add.vertices()}>Add Vertices</button>
		<button on:click={() => facelyRes.add.faces()}>Add Faces</button>
		<button on:click={() => facelyRes.add.uvFace()}>Add UV Face</button>
		<button on:click={() => facelyRes.download()}>Download assets</button>
	{/if}
</div>

<canvas bind:this={canvas}></canvas>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
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
		opacity: 0.4;
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
		max-width: 200px;
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
