import * as THREE from 'three';

/**
 * Adds an uploaded image as a textured plane to the 3D scene at the origin
 * with its original aspect ratio.
 * @param {THREE.Scene} scene - The main 3D scene
 * @param {File} imageFile - The uploaded image file
 * @returns {Promise<boolean>} - Resolves to true if image loads successfully, false otherwise
 */
export function addImageToScene(scene, imageFile) {
	return new Promise((resolve) => {
		const reader = new FileReader();

		reader.onload = function (event) {
			const imageUrl = event.target.result;
			const textureLoader = new THREE.TextureLoader();

			const img = new Image();
			img.src = imageUrl;

			img.onload = function () {
				const aspectRatio = img.width / img.height;
				const width = 10; // Define a base width
				const height = width / aspectRatio;

				textureLoader.load(
					imageUrl,
					(texture) => {
						const geometry = new THREE.PlaneGeometry(width, height);
						const material = new THREE.MeshBasicMaterial({
							map: texture,
							side: THREE.DoubleSide,
							transparent: true
						});
						const plane = new THREE.Mesh(geometry, material);

						plane.position.set(0, 0, 0);
						plane.rotation.x = -Math.PI / 2;
						scene.add(plane);

						console.log('Plane added to scene with original aspect ratio');
						resolve(true); // Image loaded successfully
					},
					undefined,
					(error) => {
						console.error('Error loading image texture:', error);
						resolve(false); // Image loading failed
					}
				);
			};
		};

		if (imageFile) {
			reader.readAsDataURL(imageFile);
		} else {
			console.warn('No image file provided');
			resolve(false);
		}
	});
}
