// ======================================================
// Configuração da Cena, Câmera e Renderizador
// ======================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);

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
let gameWon = false; // NOVA variável para controlar o estado do jogo

// Chão
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Labirinto
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
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1], // Ponto de chegada será na linha 8, coluna 8 (índice)
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
camera.position.set(-8, 1.7, -6); // Posição inicial no corredor map[2][1]

function isWallAt(x, z) {
    const mapX = Math.floor((x + wallSize / 2) / wallSize + map[0].length / 2);
    const mapZ = Math.floor((z + wallSize / 2) / wallSize + map.length / 2);
    if (mapX < 0 || mapX >= map[0].length || mapZ < 0 || mapZ >= map.length) {
        return true;
    }
    return map[mapZ][mapX] === 1;
}

// --- NOVO: OBJETO DE VITÓRIA ---
const goalGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
const goalMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00, // Amarelo
    emissive: 0xaaaa00 // Faz o material emitir luz, parecendo brilhar
});
const goal = new THREE.Mesh(goalGeometry, goalMaterial);
// Posiciona o objetivo no mundo 3D (correspondente ao map[8][8])
goal.position.set(
    (8 - map[0].length / 2) * wallSize,
    1.0,
    (8 - map.length / 2) * wallSize
);
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

function updatePlayerMovement() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    let moved = false;
    let moveX = 0;
    let moveZ = 0;

    if (keyboardState['KeyW']) { moveX += direction.x; moveZ += direction.z; moved = true; }
    if (keyboardState['KeyS']) { moveX -= direction.x; moveZ -= direction.z; moved = true; }
    if (keyboardState['KeyA']) { moveX += right.x; moveZ += right.z; moved = true; }
    if (keyboardState['KeyD']) { moveX -= right.x; moveZ -= right.z; moved = true; }

    if (moved) {
        const moveVector = new THREE.Vector2(moveX, moveZ).normalize().multiplyScalar(playerSpeed);
        const nextX = camera.position.x - moveVector.x;
        const nextZ = camera.position.z - moveVector.y;
        if (!isWallAt(nextX, camera.position.z)) { camera.position.x = nextX; }
        if (!isWallAt(camera.position.x, nextZ)) { camera.position.z = nextZ; }
    }
}

// --- NOVA FUNÇÃO DE VITÓRIA ---
function checkWinCondition() {
    if (gameWon) return; // Se já ganhou, não faz nada

    const distance = camera.position.distanceTo(goal.position);
    if (distance < 1.0) { // Se a distância for menor que 1 unidade
        gameWon = true;
        document.getElementById('win-screen').style.display = 'block';
        document.exitPointerLock(); // Libera o cursor do mouse
    }
}

// ======================================================
// Loop de Animação
// ======================================================
function animate() {
    requestAnimationFrame(animate);

    if (!gameWon) { // Só atualiza o jogo se não tiver vencido
        updatePlayerMovement();
        goal.rotation.y += 0.01; // Faz o objetivo girar para chamar atenção
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
