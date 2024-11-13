<script>
	import { createEventDispatcher } from 'svelte';

	export let imageUrl;

	const dispatch = createEventDispatcher();

	// Function to handle file selection and dispatch a custom event
	function handleFileUpload(event) {
		imageUrl = '';
		const file = event.target.files[0];
		if (file) {
			dispatch('imageUpload', { file });
		}
	}

	// Dispatch custom event for adding image to canvas
	function handleAddToCanvas() {
		dispatch('addToCanvas');
	}
</script>

<div>
	<!-- Display uploaded image if it exists -->
	{#if imageUrl}
		<div class="image-box">
			<img src={imageUrl} alt="Uploaded Image" />
		</div>

		<!-- Action buttons -->
		<button on:click={handleAddToCanvas}>Add to Canvas</button>
		<!-- Change Image button reuses file input for upload -->
		<label class="upload-button">
			<input type="file" accept="image/*" on:change={handleFileUpload} />
			Change Image
		</label>
	{:else}
		<!-- Image upload input styled as a button -->
		<label class="upload-button">
			<input type="file" accept="image/*" on:change={handleFileUpload} />
			Upload Image
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
