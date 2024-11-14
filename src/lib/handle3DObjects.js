import * as THREE from 'three';

/**
 * Adds 3D objects (point cloud, mesh, outer ring) to the scene.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {Object} visualizations - Prediction data with vertices and indices.
 * @param {Object} config - Configuration for the 3D objects, including `invertDepth` to flip depth.
 */
export function add3DObjectsToScene(scene, visualizations, config) {
	const { vertices, indices } = visualizations;

	if (!vertices || !indices) {
		console.error('Vertices or indices missing in visualizations');
		return;
	}

	const offsetY = config.baseElevation;
	const adjustedPointSize = config.pointSize * 0.1 * config.scaleFactor;
	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	try {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		const material = new THREE.PointsMaterial({
			color: config.pointColor,
			size: adjustedPointSize
		});
		const points = new THREE.Points(geometry, material);
		points.rotation.x = -Math.PI / 2;
		points.position.y += offsetY;
		scene.add(points);
		console.log('3D Point Cloud added');
	} catch (error) {
		console.error('Error adding point cloud:', error);
	}

	try {
		const meshGeometry = new THREE.BufferGeometry();
		meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		meshGeometry.setIndex(indices);
		const meshMaterial = new THREE.MeshBasicMaterial({
			color: config.triangulationColor,
			wireframe: true
		});
		const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
		mesh.rotation.x = -Math.PI / 2;
		mesh.position.y += offsetY;
		scene.add(mesh);
		console.log('3D Wireframe Mesh added');
		return mesh; // Return the mesh so it can be toggled
	} catch (error) {
		console.error('Error adding wireframe mesh:', error);
	}
}
/**
 * Generates a fully UV-textured face model and adds it to the scene.
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} visualizations - Prediction data with vertices and indices
 * @param {HTMLImageElement} textureImage - The loaded image to use as a texture
 */
export function generateUVTexturedFace(scene, visualizations, textureImage, config) {
	const { vertices, indices } = visualizations;

	if (!vertices || !indices) {
		console.error('Vertices or indices missing for UV mapping.');
		return;
	}

	const adjustedVertices = vertices.map(
		(v, i) => (i % 3 === 2 && config.invertDepth ? -v : v) * config.scaleFactor
	);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
	geometry.setIndex(indices);

	const uvs = [];
	for (let i = 0; i < vertices.length; i += 3) {
		const x = vertices[i] / textureImage.width + 0.5;
		const y = vertices[i + 1] / textureImage.height + 0.5;
		uvs.push(x, y);
	}
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

	const texture = new THREE.Texture(textureImage);
	texture.needsUpdate = true;
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide
	});

	const faceMesh = new THREE.Mesh(geometry, material);
	faceMesh.rotation.x = -Math.PI / 2;
	faceMesh.position.y = config.baseElevation;
	scene.add(faceMesh);
	console.log('Textured UV-mapped 3D Face Model added to the scene.');
	return faceMesh; // Return the mesh so it can be toggled
}
