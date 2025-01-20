<script context="module">
	import { facely } from './../lib';
	export const ssr = false;
</script>

<script>
	import { onMount } from 'svelte';
	import { createThreeDScene } from '$lib/ThreeDScene.js';

	let canvas;
	let mainScene;

	// Individual state variables
	let imageUrl = '';
	let stage = 'upload';
	let loadingStage = false;
	let progress = null;
	let errorMessage = '';

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

	async function handleImageUpload(imageFile) {
		const progressEvent = (e) => (progress = e);
		const res = await facely(imageFile, canvas, progressEvent);
		facelyRes = res;
		console.log(res);
	}

	function handleFileUpload(event) {
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			imageUrl = e.target.result;
		};
		reader.readAsDataURL(file);
		if (file) {
			handleImageUpload(file);
		}
	}
</script>

<div class="sidebar">
	<h1>Image to Mesh 3D</h1>

	{#if progress}
		<p>{progress.stage} {progress.message}</p>
		<div class="progress-bar">
			<div class="progress" style="width: {progress.percent}%"></div>
		</div>
	{:else}
		<p>Upload a portrait to get started</p>
		<p>Note: some browsers are not currently supported</p>
	{/if}
	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}

	{#if loadingStage}
		<p>Loading... {stage}</p>
	{:else}
		<!-- <FileUploader {imageUrl} on:imageUpload={handleImageUpload} on:submit={handleFileSubmit} /> -->
		<div class="image-box">
			<img
				src={imageUrl
					? imageUrl
					: 'https://static.vecteezy.com/system/resources/thumbnails/004/511/281/small_2x/default-avatar-photo-placeholder-profile-picture-vector.jpg'}
				alt="Uploaded Image"
			/>
		</div>
		<label class="upload-button">
			<input type="file" accept="image/*" on:change={handleFileUpload} />
			Upload Image
		</label>
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

	.progress-bar {
		width: 100%;
		background-color: #ddd;
		border-radius: 4px;
		overflow: hidden;
		margin-top: 10px;
	}

	.progress {
		height: 10px;
		background-color: #007bff;
		width: 0;
		transition: width 0.4s ease;
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

	.upload-button {
		display: inline-block;
		margin-top: 10px;
		padding: 8px 12px;
		background-color: #007bff;
		color: white;
		border-radius: 4px;
		cursor: pointer;
		text-align: center;
	}

	.upload-button input[type='file'] {
		display: none;
	}

	.image-box {
		width: 100%;
		padding-top: 100%;
		position: relative;
		margin-top: 10px;
		overflow: hidden;
		background-color: #444;
		border-radius: 4px;
	}

	.image-box img {
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
