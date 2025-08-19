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
// Objetos da Cena (Labirinto)
// ======================================================

// Chão
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- LÓGICA DO LABIRINTO ---
const wallSize = 2.0;
const wallHeight = 3.0;
const playerRadius = 0.25; // NOVO: "Largura" do jogador para colisões

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

// --- NOVA FUNÇÃO DE COLISÃO ---
function isWallAt(x, z) {
    // Converte a coordenada do mundo 3D para o índice do array do mapa
    const mapX = Math.floor((x + wallSize / 2) / wallSize + map[0].length / 2);
    const mapZ = Math.floor((z + wallSize / 2) / wallSize + map.length / 2);

    // Verifica se está fora dos limites do mapa
    if (mapX < 0 || mapX >= map[0].length || mapZ < 0 || mapZ >= map.length) {
        return true; // Considera fora do mapa como uma parede
    }
    // Retorna true se a célula do mapa for 1 (parede)
    return map[mapZ][mapX] === 1;
}

// ======================================================
// Controles
// ======================================================
const playerSpeed = 0.1;
const keyboardState = {};

window.addEventListener('keydown', (event) => { keyboardState[event.code] = true; });
window.addEventListener('keyup', (event) => { keyboardState[event.code] = false; });

document.body.addEventListener('click', () => { document.body.requestPointerLock(); });
document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

// --- FUNÇÃO DE MOVIMENTO ATUALIZADA COM COLISÃO ---
function updatePlayerMovement() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Pega a direção para onde a câmera está olhando

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize(); // Pega o vetor para a direita

    let moved = false;
    let moveX = 0;
    let moveZ = 0;

    if (keyboardState['KeyW']) {
        moveX += direction.x;
        moveZ += direction.z;
        moved = true;
    }
    if (keyboardState['KeyS']) {
        moveX -= direction.x;
        moveZ -= direction.z;
        moved = true;
    }
    if (keyboardState['KeyA']) {
        moveX += right.x;
        moveZ += right.z;
        moved = true;
    }
    if (keyboardState['KeyD']) {
        moveX -= right.x;
        moveZ -= right.z;
        moved = true;
    }

    if (moved) {
        // Normaliza o vetor de movimento para evitar velocidade maior na diagonal
        const moveVector = new THREE.Vector2(moveX, moveZ).normalize().multiplyScalar(playerSpeed);
        
        // Calcula a próxima posição
        const nextX = camera.position.x - moveVector.x;
        const nextZ = camera.position.z - moveVector.y; // Usamos y do Vector2 para o z do mundo 3D

        // Verifica colisão na direção X
        if (!isWallAt(nextX, camera.position.z)) {
            camera.position.x = nextX;
        }

        // Verifica colisão na direção Z
        if (!isWallAt(camera.position.x, nextZ)) {
            camera.position.z = nextZ;
        }
    }
}

// ======================================================
// Loop de Animação
// ======================================================
function animate() {
    requestAnimationFrame(animate);
    updatePlayerMovement();
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
