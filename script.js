// ======================================================
// Configuração da Cena, Câmera e Renderizador
// ======================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

scene.fog = new THREE.Fog(0x111111, 0, 20);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);

// CORREÇÃO 1: Evita que a câmera fique "torta" ao olhar para cima/baixo e para os lados.
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================================================
// Iluminação
// ======================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

// ======================================================
// Objetos da Cena (Labirinto e Objetivo)
// ======================================================
let gameWon = false;

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallSize = 2.0;
const wallHeight = 3.0;
const wallGeometry = new THREE.BoxGeometry(wallSize, wallHeight, wallSize);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function buildMaze() {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.x = (j - map[i].length / 2) * wallSize;
                wall.position.y = wallHeight / 2;
                wall.position.z = (i - map.length / 2) * wallSize;
                scene.add(wall);
            }
        }
    }
}
buildMaze();
camera.position.set(-8, 1.7, -6);

function isWallAt(x, z) {
    const mapX = Math.floor((x + wallSize / 2) / wallSize + map[0].length / 2);
    const mapZ = Math.floor((z + wallSize / 2) / wallSize + map.length / 2);
    if (mapX < 0 || mapX >= map[0].length || mapZ < 0 || mapZ >= map.length) {
        return true;
    }
    return map[mapZ][mapX] === 1;
}

const goalGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
const goal = new THREE.Mesh(goalGeometry, goalMaterial);
goal.position.set((8 - map[0].length / 2) * wallSize, 1.0, (8 - map.length / 2) * wallSize);
scene.add(goal);

// ======================================================
// Controles
// ======================================================
const playerSpeed = 0.1;
const keyboardState = {};
window.addEventListener('keydown', (event) => { keyboardState[event.code] = true; });
window.addEventListener('keyup', (event) => { keyboardState[event.code] = false; });
document.body.addEventListener('click', () => { if (!gameWon) document.body.requestPointerLock(); });
document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

// CORREÇÃO 2: Lógica de movimento reescrita para ser mais intuitiva e corrigir a inversão.
function updatePlayerMovement() {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up); // Calcula o vetor "direita" real

    let moveX = 0;
    let moveZ = 0;

    if (keyboardState['KeyW']) {
        moveX += forward.x;
        moveZ += forward.z;
    }
    if (keyboardState['KeyS']) {
        moveX -= forward.x;
        moveZ -= forward.z;
    }
    if (keyboardState['KeyA']) {
        moveX -= right.x;
        moveZ -= right.z;
    }
    if (keyboardState['KeyD']) {
        moveX += right.x;
        moveZ += right.z;
    }

    if (moveX !== 0 || moveZ !== 0) {
        const moveVector = new THREE.Vector2(moveX, moveZ).normalize().multiplyScalar(playerSpeed);
        
        const nextX = camera.position.x + moveVector.x;
        const nextZ = camera.position.z + moveVector.y;

        if (!isWallAt(nextX, camera.position.z)) {
            camera.position.x = nextX;
        }
        if (!isWallAt(camera.position.x, nextZ)) {
            camera.position.z = nextZ;
        }
    }
}

function checkWinCondition() {
    if (gameWon) return;
    const distance = camera.position.distanceTo(goal.position);
    if (distance < 1.0) {
        gameWon = true;
        document.getElementById('win-screen').style.display = 'block';
        document.exitPointerLock();
    }
}

// ======================================================
// Loop de Animação
// ======================================================
function animate() {
    requestAnimationFrame(animate);
    if (!gameWon) {
        updatePlayerMovement();
        goal.rotation.y += 0.01;
        goal.rotation.x += 0.01;
    }
    checkWinCondition();
    renderer.render(scene, camera);
}
animate();

// ======================================================
// Redimensionamento da Janela
// ======================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
