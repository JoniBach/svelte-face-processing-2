<script>
	import { createEventDispatcher } from 'svelte';

	export let imageUrl;

	const dispatch = createEventDispatcher();

	// Handle file upload and dispatch imageUpload event
	function handleFileUpload(event) {
		imageUrl = '';
		const file = event.target.files[0];
		if (file) {
			dispatch('imageUpload', { file });
		}
	}

	// Dispatch addToCanvas event to add the image to the canvas
	function handleAddToCanvas() {
		dispatch('addToCanvas');
	}

	// Dispatch processImage event to start processing the image for predictions
	function handleProcessImage() {
		dispatch('processImage');
	}

	function handleSubmit() {
		dispatch('submit');
	}
</script>

<div>
	{#if !imageUrl}
		<!-- Show file upload button initially -->
		<label class="upload-button">
			<input type="file" accept="image/*" on:change={handleFileUpload} />
			Upload Image
		</label>
	{:else}
		<!-- Display uploaded image preview with options to add or process -->
		<div class="image-box">
			<img src={imageUrl} alt="Uploaded Image" />
		</div>

		<!-- Action buttons for add to canvas and process image -->
		<!-- <button on:click={handleAddToCanvas}>Add to Canvas</button> -->
		<!-- <button on:click={handleProcessImage}>Process Image for Face Mapping</button> -->
		<button on:click={handleSubmit}>Analyze face</button>

		<!-- Option to change the image -->
		<label class="upload-button">
			<input type="file" accept="image/*" on:change={handleFileUpload} />
			Change Image
		</label>
	{/if}
</div>

<style>
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
