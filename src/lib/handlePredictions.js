import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import TRIANGULATION from './TRIANGULATION.json';
import OUTERRING from './OUTERRING.json';

/**
 * Initialize the face landmarks detector
 * @returns {Promise<Object>} - A promise that resolves to the face detector model
 */
async function initializeDetector() {
	return await faceLandmarksDetection.createDetector(
		faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
		{
			runtime: 'tfjs',
			maxFaces: 1
		}
	);
}
/**
 * Perform facial landmark detection on an image and generate visualization data.
 * @param {string} imageUrl - The URL of the image to process
 * @param {Object} [config={}] - Configuration options for visual customization
 * @returns {Promise<Object>} - An object with visualization images as data URLs, vertices, and indices
 */
export async function handlePredictions(imageUrl, config = {}) {
	const image = await loadImage(imageUrl);
	const width = image.width;
	const height = image.height;

	const detector = await initializeDetector();
	const predictions = await detector.estimateFaces(image, {
		flipHorizontal: false
	});

	if (!predictions.length) {
		console.log('No faces detected.');
		return;
	}

	const keypoints = predictions[0].keypoints;
	const { vertices, indices } = calculateVerticesAndIndices(keypoints, width, height);

	// Generate 2D visualizations on separate canvases
	const keypointsCanvas = createCanvas(width, height);
	const outerRingCanvas = createCanvas(width, height);
	const triangulationCanvas = createCanvas(width, height);
	const combinedCanvas = createCanvas(width, height);

	// Draw visualizations using the config options
	drawKeypoints(
		keypointsCanvas.getContext('2d'),
		keypoints,
		config.pointSize || 2,
		config.pointColor || 'red'
	);
	drawOuterRing(
		outerRingCanvas.getContext('2d'),
		keypoints,
		config.outerRingColor || 'blue',
		config.outerRingWidth || 2
	);
	drawTriangulation(
		triangulationCanvas.getContext('2d'),
		keypoints,
		config.triangulationColor || 'green',
		config.triangulationWidth || 1
	);
	drawCombinedOverlay(combinedCanvas.getContext('2d'), keypoints, config);

	// Return visualization images, vertices, and indices for 3D rendering
	return {
		keypointsImage: keypointsCanvas.toDataURL(),
		outerRingImage: outerRingCanvas.toDataURL(),
		triangulationImage: triangulationCanvas.toDataURL(),
		combinedImage: combinedCanvas.toDataURL(),
		vertices,
		indices
	};
}

/**
 * Calculate 3D vertices and indices from keypoints
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @returns {Object} - An object containing vertices and indices for 3D rendering
 */
function calculateVerticesAndIndices(keypoints, width, height) {
	const vertices = [];
	keypoints.forEach(({ x, y, z }) => {
		vertices.push(x - width / 2, -(y - height / 2), z || 0); // Center and flip y
	});

	const indices = [];
	for (let i = 0; i < TRIANGULATION.length; i += 3) {
		indices.push(TRIANGULATION[i], TRIANGULATION[i + 1], TRIANGULATION[i + 2]);
	}

	return { vertices, indices };
}

/**
 * Utility function to create and configure a new canvas
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @returns {HTMLCanvasElement} - The created canvas
 */
function createCanvas(width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

/**
 * Utility function to load an image from a URL
 * @param {string} url - The URL of the image to load
 * @returns {Promise<HTMLImageElement>} - A promise that resolves to the loaded image
 */
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = url;
		img.onload = () => resolve(img);
		img.onerror = reject;
	});
}

/**
 * Draw keypoints on the given canvas context
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {number} [pointSize=2] - Radius of the keypoints
 * @param {string} [pointColor='red'] - Color of the keypoints
 */
function drawKeypoints(ctx, keypoints, pointSize = 2, pointColor = 'red') {
	ctx.fillStyle = pointColor;
	keypoints.forEach(({ x, y }) => {
		ctx.beginPath();
		ctx.arc(x, y, pointSize, 0, 2 * Math.PI); // Draw circles using pointSize as the radius
		ctx.fill();
	});
}

/**
 * Draw the outer ring around the face
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {string} [outerRingColor='blue'] - Color of the outer ring
 * @param {number} [outerRingWidth=2] - Width of the outer ring lines
 */
function drawOuterRing(ctx, keypoints, outerRingColor = 'blue', outerRingWidth = 2) {
	if (!OUTERRING || !Array.isArray(OUTERRING)) {
		console.error('OUTERRING is not defined or is not an array.');
		return;
	}

	ctx.strokeStyle = outerRingColor;
	ctx.lineWidth = outerRingWidth;
	ctx.beginPath();

	OUTERRING.forEach((index, i) => {
		const { x, y } = keypoints[index];
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});

	ctx.closePath();
	ctx.stroke();
}

/**
 * Draw triangulation lines connecting keypoints
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {string} [triangulationColor='green'] - Color of the triangulation lines
 * @param {number} [triangulationWidth=1] - Width of the triangulation lines
 */
function drawTriangulation(ctx, keypoints, triangulationColor = 'green', triangulationWidth = 1) {
	ctx.strokeStyle = triangulationColor;
	ctx.lineWidth = triangulationWidth;

	for (let i = 0; i < TRIANGULATION.length; i += 3) {
		const [i1, i2, i3] = [TRIANGULATION[i], TRIANGULATION[i + 1], TRIANGULATION[i + 2]];
		const p1 = keypoints[i1];
		const p2 = keypoints[i2];
		const p3 = keypoints[i3];

		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.lineTo(p3.x, p3.y);
		ctx.closePath();
		ctx.stroke();
	}
}

/**
 * Draw a combined overlay with keypoints, outer ring, and triangulation
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Array<Object>} keypoints - Array of facial keypoints
 * @param {Object} config - Configuration options for visual customization
 */
function drawCombinedOverlay(ctx, keypoints, config) {
	drawTriangulation(
		ctx,
		keypoints,
		config.triangulationColor || 'green',
		config.triangulationWidth || 1
	);
	drawOuterRing(ctx, keypoints, config.outerRingColor || 'blue', config.outerRingWidth || 2);
	drawKeypoints(ctx, keypoints, config.pointSize || 2, config.pointColor || 'red');
}
