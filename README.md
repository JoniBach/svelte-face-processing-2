# Image to Mesh 3D: A Svelte + Tensorflow + Three.js Project

Welcome to **Image to Mesh 3D**! This project allows users to upload a human portrait and visualize it in a 3D environment by transforming it into a mesh. The project combines **Svelte**, **Three.js**, and **TensorFlow\.js** to create a smooth and interactive 3D experience, empowering users with image-based 3D visualization and mesh rendering.

---

## 🛠️ Technologies and Packages Used

- **[Svelte](https://svelte.dev/)**: A framework for building reactive user interfaces with minimal boilerplate. It is used as the main front-end framework to build the UI.
- **[Three.js](https://threejs.org/)**: A JavaScript library used to create 3D graphics in the browser. Three.js powers the entire 3D visualization, from displaying the uploaded image as a textured plane to creating 3D meshes and point clouds.
- **[TensorFlow.js](https://www.tensorflow.org/js)**: A JavaScript library for machine learning. It is used here to detect face landmarks and generate data for 3D meshes using the **MediaPipe FaceMesh** model.
- **[@tensorflow-models/face-landmarks-detection](https://github.com/tensorflow/tfjs-models)**: A TensorFlow\.js model for detecting facial landmarks. It provides the facial keypoints and landmarks used for creating the 3D mesh visualization.
- **[OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)**: An extension of Three.js that provides intuitive orbit controls for navigating around the 3D scene.

---

## 📚 Project Overview

The **Image to Mesh 3D** project takes an uploaded image and transforms it into a 3D visualization by:

1. **Uploading and Previewing the Image**: The user uploads an image using the **FileUploader** component, which handles file selection and passes the image to the rest of the application.

2. **Setting Up the 3D Scene**: A Three.js scene is initialized using a canvas element, where lighting, grid helpers, and an adjustable camera are configured to create the desired environment for rendering.

3. **Image Integration into 3D Scene**: The uploaded image is rendered as a plane within the 3D scene, maintaining its original aspect ratio.

4. **Facial Landmarks Detection**: The **TensorFlow\.js MediaPipe FaceMesh** model detects facial landmarks on the uploaded image. The keypoints, which include face features like eyes, nose, and mouth, are used to create vertices for a 3D mesh.

5. **3D Mesh Generation**: A mesh is generated using the detected landmarks. The **add3DObjectsToScene** and **generateUVTexturedFace** functions are used to create and texture the mesh, including point clouds, wireframes, and UV-mapped textured surfaces.

6. **Interactivity and Controls**: The user can interact with the 3D model using **OrbitControls**, enabling panning, zooming, and rotation. Buttons are provided to toggle different visualization overlays like the textured UV face and wireframe mesh.

---

## 🚀 Getting Started

### 1. Installation

To run this project locally, make sure you have Node.js installed, then clone the repository and install the dependencies:

```bash
npm install
```

### 2. Running the Application

To start the development server:

```bash
npm run dev
```

Visit `http://localhost:5000` in your browser to view the application.

---

## 🧩 Project Structure

### Components and Files

- **ThreeDScene.js**: Sets up and configures the main Three.js scene, including camera, renderer, controls, and lighting.
- **ImageHandler.js**: Contains the **addImageToScene** function that adds an uploaded image to the 3D scene.
- **handlePredictions.js**: Manages facial landmark detection using TensorFlow\.js and generates visualization data, including vertices and indices for 3D rendering.
- **FileUploader.svelte**: A component that allows users to upload an image file and initiate the face detection and 3D transformation process.
- **PredictionPreview\.svelte**: Displays the prediction overlays, such as triangulation and outer rings, based on the detected facial features.
- **handle3DObjects.js**: Handles creating and managing the 3D objects, including point clouds, meshes, and textured UV face meshes.
- **handlePredictionPreview\.js**: Handles adding overlays to the scene, such as keypoints, outer rings, and triangulation lines.

---

## 🌀 General Approach

1. **Modular Development**: The project is divided into reusable modules to make the components and features easy to manage and extend.
2. **3D Visualization with Three.js**: The integration of **Three.js** allows us to build a sophisticated 3D experience directly in the browser. By using different types of 3D meshes, wireframes, and textured models, the project provides a rich and interactive visual experience.
3. **Machine Learning for Face Detection**: **TensorFlow\.js** was used to detect facial landmarks in the uploaded images, allowing us to generate the 3D vertices necessary for mesh creation. This combination of machine learning and 3D visualization is central to the project's core functionality.
4. **User Interaction**: **OrbitControls** and various Svelte components (e.g., buttons for toggling overlays) provide a rich set of user interactions, allowing users to control and visualize the scene as they desire.
5. **Error Handling**: The application includes error handling at several key points (e.g., failed image loading, failed 3D object addition) to enhance user experience and provide clear feedback in case something goes wrong.

---

## ⚠️ Important Notes

- **Browser Compatibility**: Some browsers may not support all features due to limitations in WebGL or TensorFlow\.js. It is recommended to use a modern browser like **Chrome** or **Firefox**.
- **Performance Considerations**: Running the facial landmark detection and rendering 3D meshes can be resource-intensive, especially on lower-end devices.

---

## 🤝 Contribution

Contributions are welcome! If you encounter any issues or have ideas for new features, feel free to open an issue or submit a pull request.

### Repository

**[GitHub Repo](https://github.com/your-repo-link)**

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🎉 Get Involved!

Try out the **Image to Mesh 3D** project by uploading a portrait and creating a 3D mesh from it. Feel free to experiment, contribute, and enhance this project to create more interactive and innovative visual experiences!

