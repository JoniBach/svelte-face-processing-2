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

	// Scaling factor to fit objects within the canvas
	const scale = 0.01;
	const offsetY = 0.1; // Slightly raise the objects above the image plane

	// Adjust point size to be smaller
	const adjustedPointSize = config.pointSize * 0.1;

	// Optionally invert depth based on config
	const adjustedVertices = vertices.map((v, i) =>
		i % 3 === 2 && config.invertDepth ? -v * scale : v * scale
	);

	// 3D Point Cloud
	try {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		const material = new THREE.PointsMaterial({
			color: config.pointColor,
			size: adjustedPointSize
		});
		const points = new THREE.Points(geometry, material);

		// Rotate to lay flat on the image plane and slightly lift above
		points.rotation.x = -Math.PI / 2;
		points.position.y += offsetY;

		scene.add(points);
		console.log('3D Point Cloud added');
	} catch (error) {
		console.error('Error adding point cloud:', error);
	}

	// 3D Wireframe Mesh
	try {
		const meshGeometry = new THREE.BufferGeometry();
		meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(adjustedVertices, 3));
		meshGeometry.setIndex(indices);
		const meshMaterial = new THREE.MeshBasicMaterial({
			color: config.triangulationColor,
			wireframe: true
		});
		const mesh = new THREE.Mesh(meshGeometry, meshMaterial);

		// Rotate and position above the image plane
		mesh.rotation.x = -Math.PI / 2;
		mesh.position.y += offsetY;

		scene.add(mesh);
		console.log('3D Wireframe Mesh added');
	} catch (error) {
		console.error('Error adding wireframe mesh:', error);
	}
}
