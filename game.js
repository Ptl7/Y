// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Orbit controls for better camera movement
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

// Load high-quality texture
const loader = new THREE.TextureLoader();
const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg', () => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
});

// Function to create a terrain with height map
function createTerrain(width, height, x, z) {
    const geometry = new THREE.PlaneGeometry(width, height, 128, 128);
    const material = new THREE.MeshStandardMaterial({ map: texture });
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

    return terrain;
}

// Create multiple terrains
const terrainSize = 100;
const terrains = [];
const gridSize = 5;

for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const x = i * terrainSize - (gridSize * terrainSize) / 2;
        const z = j * terrainSize - (gridSize * terrainSize) / 2;
        const terrain = createTerrain(terrainSize, terrainSize, x, z);
        terrains.push(terrain);
    }
}

// Character setup using GLTF loader
const gltfLoader = new THREE.GLTFLoader();
let character, characterBody;

gltfLoader.load('path/to/gltf/model.gltf', (gltf) => {
    character = gltf.scene;
    character.scale.set(1, 1, 1);
    character.traverse(node => {
        if (node.isMesh) {
            node.castShadow = true;
        }
    });
    scene.add(character);

    // Add physics to character
    const characterShape = new CANNON.Box(new CANNON.Vec3(1, 2, 1));
    characterBody = new CANNON.Body({ mass: 1 });
    characterBody.addShape(characterShape);
    characterBody.position.set(0, 5, 0);
    world.addBody(characterBody);
});

// Camera positioning
camera.position.set(0, 20, -30);
camera.lookAt(0, 0, 0);

// Post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.21;
bloomPass.strength = 1.2;
bloomPass.radius = 0.55;
composer.addPass(bloomPass);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update physics
    world.step(1 / 60);

    // Sync character position if loaded
    if (character && characterBody) {
        character.position.copy(characterBody.position);
        character.quaternion.copy(characterBody.quaternion);
    }

    controls.update();
    composer.render();
}
animate();

// Character movement controls
document.addEventListener('keydown', (event) => {
    const force = 200;
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

// Mobile controls
const controlsUI = {
    up: document.getElementById('up'),
    down: document.getElementById('down'),
    left: document.getElementById('left'),
    right: document.getElementById('right')
};

controlsUI.up.addEventListener('touchstart', () => {
    characterBody.applyLocalForce(new CANNON.Vec3(0, 0, -200), new CANNON.Vec3(0, 0, 0));
});
controlsUI.down.addEventListener('touchstart', () => {
    characterBody.applyLocalForce(new CANNON.Vec3(0, 0, 200), new CANNON.Vec3(0, 0, 0));
});
controlsUI.left.addEventListener('touchstart', () => {
    characterBody.applyLocalForce(new CANNON.Vec3(-200, 0, 0), new CANNON.Vec3(0, 0, 0));
});
controlsUI.right.addEventListener('touchstart', () => {
    characterBody.applyLocalForce(new CANNON.Vec3(200, 0, 0), new CANNON.Vec3(0, 0, 0));
});

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Add challenges - simple obstacles
function createObstacle(x, z) {
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(x, 2.5, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);

    // Add physics to obstacle
    const shape = new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, 2.5, z);
    world.addBody(body);

    return obstacle;
}

// Add obstacles to the scene
const obstacles = [];
for (let i = 0; i < 20; i++) {
    const x = Math.random() * gridSize * terrainSize - (gridSize * terrainSize) / 2;
    const z = Math.random() * gridSize * terrainSize - (gridSize * terrainSize) / 2;
    const obstacle = createObstacle(x, z);
    obstacles.push(obstacle);
}

// Add NPCs (non-player characters)
function createNPC(x, z, message) {
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const npc = new THREE.Mesh(geometry, material);
    npc.position.set(x, 2, z);
    npc.castShadow = true;
    npc.receiveShadow = true;
    scene.add(npc);

    // Interaction logic
    const npcShape = new CANNON.Box(new CANNON.Vec3(1, 2, 1));
    const npcBody = new CANNON.Body({ mass: 0 });
    npcBody.addShape(npcShape);
    npcBody.position.set(x, 2, z);
    world.addBody(npcBody);

    npc.userData = { message };

    return npc;
}

// Add NPCs to the scene
const npcs = [];
npcs.push(createNPC(10, 10, "Welcome to the village! Find the elder to get your first clue."));
npcs.push(createNPC(-20, -20, "Watch out for the traps in the forest!"));

function checkInteractions() {
    if (character && characterBody) {
        npcs.forEach(npc => {
            if (npc.position.distanceTo(character.position) < 5) {
                document.getElementById('story').innerText = npc.userData.message;
            }
        });
    }
}

// Add tasks and goals
function createTask(x, z, description) {
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const task = new THREE.Mesh(geometry, material);
    task.position.set(x, 1.5, z);
    task.castShadow = true;
    task.receiveShadow = true;
    scene.add(task);

    // Interaction logic
    const taskShape = new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 1.5));
    const taskBody = new CANNON.Body({ mass: 0 });
    taskBody.addShape(taskShape);
    taskBody.position.set(x, 1.5, z);
    world.addBody(taskBody);

    task.userData = { description };

    return task;
}

// Add tasks to the scene
const tasks = [];
tasks.push(createTask(15, 15, "Find the hidden key in the forest."));
tasks.push(createTask(-25, -25, "Solve the puzzle to open the cave entrance."));

function checkTasks() {
    if (character && characterBody) {
        tasks.forEach(task => {
            if (task.position.distanceTo(character.position) < 5) {
                document.getElementById('story').innerText = task.userData.description;
            }
        });
    }
}

// Main game loop
function gameLoop() {
    checkInteractions();
    checkTasks();
    requestAnimationFrame(gameLoop);
}
gameLoop();
