// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Physics setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Skybox
const skyboxLoader = new THREE.CubeTextureLoader();
const skyboxTexture = skyboxLoader.load([
    'path/to/skybox/px.jpg', 'path/to/skybox/nx.jpg',
    'path/to/skybox/py.jpg', 'path/to/skybox/ny.jpg',
    'path/to/skybox/pz.jpg', 'path/to/skybox/nz.jpg',
]);
scene.background = skyboxTexture;

// Load texture for terrain
const loader = new THREE.TextureLoader();
const terrainTexture = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg', () => {
    terrainTexture.wrapS = terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(4, 4);
});

// Function to create terrain
function createTerrain(x, z) {
    const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: terrainTexture });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(x, 0, z);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Add physics to terrain
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, 0, z);
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(body);
}

// Generate a grid of terrains
const gridSize = 5; // 5x5 grid
for (let i = -gridSize / 2; i <= gridSize / 2; i++) {
    for (let j = -gridSize / 2; j <= gridSize / 2; j++) {
        createTerrain(i * 100, j * 100);
    }
}

// Character setup
const gltfLoader = new THREE.GLTFLoader();
let character, characterBody;

gltfLoader.load('path/to/gltf/model.gltf', (gltf) => {
    character = gltf.scene;
    character.scale.set(1, 1, 1);
    character.traverse((node) => {
        if (node.isMesh) node.castShadow = true;
    });
    scene.add(character);

    // Add physics to character
    const characterShape = new CANNON.Box(new CANNON.Vec3(1, 2, 1));
    characterBody = new CANNON.Body({ mass: 1 });
    characterBody.addShape(characterShape);
    characterBody.position.set(0, 5, 0);
    world.addBody(characterBody);
});

// Obstacles
function createObstacle(x, z) {
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(x, 2.5, z);
    obstacle.castShadow = true;
    scene.add(obstacle);

    const shape = new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, 2.5, z);
    world.addBody(body);
}

// Create 10 random obstacles
for (let i = 0; i < 10; i++) {
    const x = Math.random() * 500 - 250;
    const z = Math.random() * 500 - 250;
    createObstacle(x, z);
}

// NPCs
function createNPC(x, z, message) {
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const npc = new THREE.Mesh(geometry, material);
    npc.position.set(x, 2, z);
    npc.castShadow = true;
    scene.add(npc);

    npc.userData = { message };

    return npc;
}

const npcs = [];
const npcMessages = ["Welcome!", "Beware of the traps!", "Find the key to unlock the treasure."];
for (let i = 0; i < npcMessages.length; i++) {
    const x = Math.random() * 500 - 250;
    const z = Math.random() * 500 - 250;
    npcs.push(createNPC(x, z, npcMessages[i]));
}

// Tasks
function createTask(x, z, description) {
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const task = new THREE.Mesh(geometry, material);
    task.position.set(x, 3, z);
    task.castShadow = true;
    scene.add(task);

    task.userData = { description };

    return task;
}

const tasks = [];
const taskDescriptions = ["Find the key.", "Solve the puzzle.", "Defeat the boss!"];
for (let i = 0; i < taskDescriptions.length; i++) {
    const x = Math.random() * 500 - 250;
    const z = Math.random() * 500 - 250;
    tasks.push(createTask(x, z, taskDescriptions[i]));
}

// Interaction checking
function checkInteractions() {
    npcs.forEach((npc) => {
        if (character && characterBody && npc.position.distanceTo(character.position) < 10) {
            document.getElementById("story").innerText = npc.userData.message;
        }
    });

    tasks.forEach((task) => {
        if (character && characterBody && task.position.distanceTo(character.position) < 10) {
            document.getElementById("story").innerText = task.userData.description;
        }
    });
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Physics update
    world.step(1 / 60);

    // Character sync
    if (character && characterBody) {
        character.position.copy(characterBody.position);
        character.quaternion.copy(characterBody.quaternion);
    }

    controls.update();
    renderer.render(scene, camera);
    checkInteractions();
}

// Start game
camera.position.set(0, 50, 150);
camera.lookAt(0, 0, 0);
animate();
