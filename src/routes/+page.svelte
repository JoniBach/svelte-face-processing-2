<script>
	import { onMount } from 'svelte';
	import { createThreeDScene } from '$lib/ThreeDScene.js';
	import { addImageToScene } from '$lib/ImageHandler.js';
	import FileUploader from './../lib/components/FileUploader.svelte';

	let canvas;
	let imageFile = null;
	let imageUrl = '';
	let mainScene; // Reference to the main 3D scene
	let imageInScene = false; // Reactive boolean to indicate image presence

	// Initialize the 3D scene on mount
	onMount(() => {
		mainScene = createThreeDScene({
			canvas,
			width: window.innerWidth * 0.8,
			height: window.innerHeight,
			backgroundColor: 0x202020
		});
	});

	// Event handler for image upload
	function handleImageUpload(event) {
		imageFile = event.detail.file;
		imageUrl = URL.createObjectURL(imageFile);
	}

	// Event handler for adding image to canvas
	function handleAddToCanvas() {
		if (mainScene && imageFile) {
			addImageToScene(mainScene, imageFile).then((success) => {
				imageInScene = success; // Update imageInScene based on success
			});
		} else {
			console.warn('No image file or scene available to add to canvas.');
		}
	}

	// Event handler for removing the image from the canvas
	function removeImageFromCanvas() {
		if (mainScene) {
			// Remove all image meshes from the scene
			mainScene.children = mainScene.children.filter(
				(child) => !(child.isMesh && child.material.map)
			);
			imageInScene = false; // Set imageInScene to false after removal
		}
	}
</script>

<div class="container">
	<div class="sidebar">
		<h1>Face Map Studio</h1>
		<p>Upload a headshot to get started</p>

		{#if imageInScene}
			<p>An image is currently loaded in the scene.</p>
			<button on:click={removeImageFromCanvas}>Remove Image</button>
		{:else}
			<FileUploader
				on:imageUpload={handleImageUpload}
				on:addToCanvas={handleAddToCanvas}
				{imageUrl}
			/>
		{/if}
	</div>
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
		background-color: #333;
		color: white;
		padding: 20px;
		box-sizing: border-box;
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
