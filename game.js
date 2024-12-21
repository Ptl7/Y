// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50).normalize();
scene.add(directionalLight);

// Load texture
const loader = new THREE.TextureLoader();
const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg');

// Function to create a terrain with height map
function createTerrain(width, height, x, z) {
    const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
    const material = new THREE.MeshLambertMaterial({ map: texture });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(x, 0, z);
    scene.add(terrain);

    // Add physics to terrain
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, 0, z);
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(body);

    return terrain;
}

// Create multiple terrains
const terrainSize = 50;
const terrains = [];
const gridSize = 10;

for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const x = i * terrainSize - (gridSize * terrainSize) / 2;
        const z = j * terrainSize - (gridSize * terrainSize) / 2;
        const terrain = createTerrain(terrainSize, terrainSize, x, z);
        terrains.push(terrain);
    }
}

// Character setup
const characterGeometry = new THREE.BoxGeometry(2, 4, 2);
const characterMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const character = new THREE.Mesh(characterGeometry, characterMaterial);
scene.add(character);

// Add physics to character
const characterShape = new CANNON.Box(new CANNON.Vec3(1, 2, 1));
const characterBody = new CANNON.Body({ mass: 1 });
characterBody.addShape(characterShape);
characterBody.position.set(0, 5, 0);
world.addBody(characterBody);

// Camera positioning
camera.position.set(0, 10, -20);
camera.lookAt(character.position);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update physics
    world.step(1 / 60);

    // Sync character position
    character.position.copy(characterBody.position);
    character.quaternion.copy(characterBody.quaternion);

    renderer.render(scene, camera);
}
animate();

// Character movement controls
document.addEventListener('keydown', (event) => {
    const force = 100;
    switch (event.code) {
        case 'ArrowUp':
            characterBody.applyLocalForce(new CANNON.Vec3(0, 0, -force), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowDown':
            characterBody.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowLeft':
            characterBody.applyLocalForce(new CANNON.Vec3(-force, 0, 0), new CANNON.Vec3(0, 0, 0));
            break;
        case 'ArrowRight':
            characterBody.applyLocalForce(new CANNON.Vec3(force, 0, 0), new CANNON.Vec3(0, 0, 0));
            break;
    }
});

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
