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
	import { handleDepthEstimation } from '$lib/handleDepthEstimation.js';
	import JSZip from 'jszip';
	import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

	let canvas;
	let imageFile = null;
	let imageUrl = '';
	let mainScene;
	let imageInScene = false;
	let visualizations = {};
	let stage = 'upload';
	let loadingStage = false;
	let errorMessage = '';
	let depthMapImage = '';

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
		baseElevation: 5,
		minDepth: 0, // Minimum depth value
		maxDepth: 1, // Maximum depth value
		outputDepthRange: [0, 1], // Normalize depth output between 0 and 1
		invertDepthMap: false,
		depthMapFormat: 'image/png'
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

	async function initiateDepthMapStage() {
		loadingStage = true;
		stage = 'depth';
		const depthMapRes = await handleDepthEstimation(imageFile, config);
		console.log(depthMapRes);
		depthMapImage = depthMapRes;
		loadingStage = false;
	}

	function handleFileSubmit() {
		stage = 'prediction';
		createPredictions();
	}

	async function addDe() {
		if (!mainScene || !imageFile) {
			errorMessage = 'Image or scene is missing.';
			console.warn('No image file or scene available to add to canvas.');
			return;
		}

		try {
			// Ensure depth map is generated
			if (!depthMapImage) {
				console.log('Generating depth map...');
				await initiateDepthMapStage();
			}

			// Load the original image
			const img = await loadImage(imageUrl);

			// Check if vertices and indices are available for UV mapping
			if (visualizations.vertices && visualizations.indices) {
				console.log('Applying UV face with displacement to canvas...');
				// Apply UV face with displacement to the canvas
				const displacedFaceMesh = await applyDisplacementToUVFace(
					mainScene,
					visualizations,
					img,
					depthMapImage, // Use the generated depth map blob
					{
						scaleFactor: config.scaleFactor,
						baseElevation: config.baseElevation,
						invertDepth: config.invertDepth
					}
				);

				if (displacedFaceMesh) {
					imageInScene = true;
					console.log('Displacement applied and UV face added to canvas.');
				} else {
					console.error('Failed to add UV face with displacement to canvas.');
					errorMessage = 'Failed to add UV face with displacement.';
				}
			} else {
				console.warn('No UV data available, adding plain image instead.');
				// Fall back to adding a plain image to the canvas
				const success = await addImageToScene(mainScene, imageFile);
				if (success) {
					imageInScene = true;
					console.log('Plain image added to canvas.');
				}
			}
		} catch (error) {
			console.error('Error adding to canvas:', error);
			errorMessage = 'Failed to add to canvas.';
		}
	}
	export async function applyDisplacementToUVFace(
		scene,
		visualizations,
		textureImage,
		depthMapBlob,
		config
	) {
		const { vertices, indices } = visualizations;

		if (!vertices || !indices) {
			console.error('Vertices or indices missing for UV mapping.');
			return;
		}

		// Convert depth map blob to a texture
		const depthMapUrl = URL.createObjectURL(depthMapBlob);
		const depthMapTexture = await new THREE.TextureLoader().loadAsync(depthMapUrl);

		// Adjust geometry scale based on config
		const adjustedVertices = vertices.map(
			(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
		);

		// Create indexed geometry
		const faceGeometry = new THREE.BufferGeometry();
		faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		faceGeometry.setIndex(indices);

		// Generate UV mapping for the texture
		const uvs = [];
		for (let i = 0; i < vertices.length; i += 3) {
			const x = (vertices[i] + 0.5) / textureImage.width;
			const y = (vertices[i + 1] + 0.5) / textureImage.height;
			uvs.push(x, y);
		}
		faceGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

		// Compute smooth normals
		faceGeometry.computeVertexNormals();

		// Load the original texture
		const uvTexture = new THREE.Texture(textureImage);
		uvTexture.needsUpdate = true;

		// Create the material
		const faceMaterial = new THREE.MeshStandardMaterial({
			map: uvTexture,
			displacementMap: depthMapTexture,
			displacementScale: config.scaleFactor * 0.1, // Adjust as needed
			displacementBias: 0, // Align displacement properly
			side: THREE.DoubleSide
		});

		// Create the mesh and apply displacement
		const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
		faceMesh.rotation.x = -Math.PI / 2; // Align the mesh
		faceMesh.position.y = config.baseElevation;

		// Debugging: Log geometry attributes
		console.log('Displacement applied:', {
			vertices: faceGeometry.attributes.position.array,
			uvs: faceGeometry.attributes.uv.array
		});

		// Add the mesh to the scene
		scene.add(faceMesh);
		console.log('Displacement successfully applied to the 3D face model.');
		return faceMesh; // Return the mesh for further manipulation if needed
	}

	async function handleApplyDisplacement() {
		try {
			loadingStage = true;
			const img = await loadImage(imageUrl);

			const displacedFaceMesh = await applyDisplacementToUVFace(
				mainScene,
				visualizations,
				img,
				depthMapImage,
				{
					scaleFactor: config.scaleFactor,
					baseElevation: config.baseElevation,
					invertDepth: config.invertDepth
				}
			);

			if (displacedFaceMesh) {
				console.log('Displacement successfully applied to the 3D model.');
			} else {
				console.error('Failed to apply displacement.');
			}
			loadingStage = false;
			stage = 'downloads';
		} catch (error) {
			console.error('Error applying displacement:', error);
			errorMessage = 'An error occurred while applying displacement.';
		}
	}

	async function downloadAssets() {
		try {
			const zip = new JSZip();
			const assetsFolder = zip.folder('downloads');

			// Prepare a list of promises for all files to be added
			const promises = [];

			// Add base image
			if (imageFile) {
				promises.push(
					fetch(imageUrl)
						.then((res) => res.blob())
						.then((blob) => assetsFolder.file('base-image.png', blob))
				);
			}

			// Add displacement map
			if (depthMapImage) {
				const depthMapBlobUrl = URL.createObjectURL(depthMapImage);
				promises.push(
					fetch(depthMapBlobUrl)
						.then((res) => res.blob())
						.then((blob) => assetsFolder.file('displacement-map.png', blob))
				);
			}

			// Add textures
			if (visualizations.combinedImage) {
				promises.push(
					fetch(visualizations.combinedImage)
						.then((res) => res.blob())
						.then((blob) => assetsFolder.file('texture-combined.png', blob))
				);
			}

			// Add overlays (keypoints, triangulation, etc.)
			const overlayTypes = ['keypointsImage', 'triangulationImage', 'outerRingImage'];
			overlayTypes.forEach((overlay) => {
				if (visualizations[overlay]) {
					promises.push(
						fetch(visualizations[overlay])
							.then((res) => res.blob())
							.then((blob) => assetsFolder.file(`${overlay}.png`, blob))
					);
				}
			});

			// Add 3D model (GLTF format)
			if (uvFaceMesh) {
				promises.push(
					new Promise((resolve, reject) => {
						const exporter = new GLTFExporter();
						exporter.parse(
							uvFaceMesh,
							(result) => {
								const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
								assetsFolder.file('3d-model.glb', blob);
								resolve();
							},
							{ binary: true }
						);
					})
				);
			}

			// Wait for all assets to be added
			await Promise.all(promises);

			// Generate the ZIP file
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(zipBlob);
			link.download = 'downloads.zip';
			link.click();

			console.log('Assets successfully downloaded!');
		} catch (error) {
			console.error('Error while downloading assets:', error);
			errorMessage = 'Failed to download assets.';
		}
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
			<button on:click={initiateDepthMapStage}> Produce Depth Map </button>
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
			<!-- <button on:click={handleApplyDisplacement}>Add to Canvas</button> -->
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
		opacity: 0.4; /* Adjust opacity to make it subtle in the background */
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
