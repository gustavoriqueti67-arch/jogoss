// ======================================================
// Configuração da Cena, Câmera e Renderizador
// ======================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x111111, 0, 25);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);
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
// GERAÇÃO PROCEDURAL DO LABIRINTO (A GRANDE NOVIDADE!)
// ======================================================

// Defina o tamanho do labirinto aqui! (Use números ímpares para melhores resultados)
const mazeWidth = 31;
const mazeHeight = 31;

function generateMaze(width, height) {
    // Cria um grid cheio de paredes
    const maze = Array.from({ length: height }, () => Array(width).fill(1));

    const stack = [];
    const startX = 1, startY = 1; // Ponto de partida fixo

    maze[startY][startX] = 0; // Carve o ponto inicial
    stack.push([startX, startY]);

    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];

        // Verifica os vizinhos (2 células de distância para criar paredes entre os caminhos)
        for (const [dx, dy] of [[0, 2], [0, -2], [2, 0], [-2, 0]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
                neighbors.push([nx, ny]);
            }
        }

        if (neighbors.length > 0) {
            const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
            // Remove a parede entre a célula atual e a vizinha
            maze[ny][nx] = 0;
            maze[cy + (ny - cy) / 2][cx + (nx - cx) / 2] = 0;
            stack.push([nx, ny]);
        } else {
            // Backtrack
            stack.pop();
        }
    }
    return maze;
}

const map = generateMaze(mazeWidth, mazeHeight);

// ======================================================
// Construção do Mundo 3D (baseado no mapa gerado)
// ======================================================
let gameWon = false;

const floorGeometry = new THREE.PlaneGeometry(200, 200);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallSize = 2.0;
const wallHeight = 3.0;
const wallGeometry = new THREE.BoxGeometry(wallSize, wallHeight, wallSize);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

function buildMaze3D() {
    for (let i = 0; i < mazeHeight; i++) {
        for (let j = 0; j < mazeWidth; j++) {
            if (map[i][j] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.x = (j - mazeWidth / 2) * wallSize;
                wall.position.y = wallHeight / 2;
                wall.position.z = (i - mazeHeight / 2) * wallSize;
                scene.add(wall);
            }
        }
    }
}
buildMaze3D();

// Posiciona o jogador no início do labirinto
camera.position.set(
    (1 - mazeWidth / 2) * wallSize,
    1.7,
    (1 - mazeHeight / 2) * wallSize
);

function isWallAt(x, z) {
    const mapX = Math.floor((x / wallSize) + mazeWidth / 2);
    const mapZ = Math.floor((z / wallSize) + mazeHeight / 2);
    if (mapX < 0 || mapX >= mazeWidth || mapZ < 0 || mapZ >= mazeHeight) return true;
    return map[mapZ][mapX] === 1;
}

const goalGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
const goal = new THREE.Mesh(goalGeometry, goalMaterial);
// Posiciona o objetivo no final do labirinto (canto oposto)
goal.position.set(
    (mazeWidth - 2 - mazeWidth / 2) * wallSize,
    1.0,
    (mazeHeight - 2 - mazeHeight / 2) * wallSize
);
scene.add(goal);

// ======================================================
// Controles (FINAMENTE CORRIGIDOS!)
// ======================================================
const playerSpeed = 0.1;
const keyboardState = {};
window.addEventListener('keydown', (event) => { keyboardState[event.code] = true; });
window.addEventListener('keyup', (event) => { keyboardState[event.code] = false; });
document.body.addEventListener('click', () => { if (!gameWon) document.body.requestPointerLock(); });

document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        // CORREÇÃO: Remove a rotação para cima/baixo (eixo X)
        camera.rotation.y -= event.movementX / 500;
    }
});

// CORREÇÃO: Lógica de movimento totalmente refeita para ser precisa.
function updatePlayerMovement() {
    const velocity = new THREE.Vector3();

    if (keyboardState['KeyW']) {
        velocity.z -= 1;
    }
    if (keyboardState['KeyS']) {
        velocity.z += 1;
    }
    if (keyboardState['KeyA']) {
        velocity.x -= 1;
    }
    if (keyboardState['KeyD']) {
        velocity.x += 1;
    }
    
    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(playerSpeed);
        // Aplica a rotação da câmera ao vetor de velocidade
        velocity.applyEuler(camera.rotation);
        
        const nextX = camera.position.x + velocity.x;
        const nextZ = camera.position.z + velocity.z;

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
