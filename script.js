// ======================================================
// Configuração da Cena, Câmera e Renderizador
// ======================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Um fundo mais escuro para o labirinto

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================================================
// NOVA SEÇÃO: Iluminação
// ======================================================
// Uma luz ambiente ilumina todos os objetos da cena igualmente.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Cor branca, intensidade média
scene.add(ambientLight);

// Uma luz direcional simula a luz do sol.
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 10, 0); // Vindo de cima
scene.add(directionalLight);


// ======================================================
// Objetos da Cena (Labirinto)
// ======================================================

// Chão
const floorGeometry = new THREE.PlaneGeometry(100, 100);
// NOVO: Usando MeshStandardMaterial para reagir à luz
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); 
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- INÍCIO DA LÓGICA DO LABIRINTO ---

const wallSize = 2.0; // Tamanho de cada bloco da parede
const wallHeight = 3.0; // Altura das paredes

// NOVO: Geometria e Material reutilizáveis para as paredes (melhora o desempenho)
const wallGeometry = new THREE.BoxGeometry(wallSize, wallHeight, wallSize);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

// NOVO: O Mapa do Labirinto
// 1 = Parede, 0 = Caminho livre
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

// NOVO: Função para construir o labirinto a partir do mapa
function buildMaze() {
    // Percorre as linhas do mapa
    for (let i = 0; i < map.length; i++) {
        // Percorre as colunas do mapa
        for (let j = 0; j < map[i].length; j++) {
            // Se o valor no mapa for 1, cria uma parede
            if (map[i][j] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                
                // Calcula a posição da parede no mundo 3D
                wall.position.x = (j - map[i].length / 2) * wallSize;
                wall.position.y = wallHeight / 2;
                wall.position.z = (i - map.length / 2) * wallSize;
                
                scene.add(wall);
            }
        }
    }
}

buildMaze(); // Chama a função para construir o labirinto

// AJUSTE: Mudar a posição inicial da câmera para dentro do labirinto
camera.position.set(-8, 1.7, -6); // Posição (x, y, z) que corresponde a um corredor (map[2][1])

// --- FIM DA LÓGICA DO LABIRINTO ---


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

function updatePlayerMovement() {
    if (keyboardState['KeyW']) {
        camera.position.z -= Math.cos(camera.rotation.y) * playerSpeed;
        camera.position.x -= Math.sin(camera.rotation.y) * playerSpeed;
    }
    if (keyboardState['KeyS']) {
        camera.position.z += Math.cos(camera.rotation.y) * playerSpeed;
        camera.position.x += Math.sin(camera.rotation.y) * playerSpeed;
    }
    if (keyboardState['KeyA']) {
        camera.position.z -= Math.cos(camera.rotation.y + Math.PI / 2) * playerSpeed;
        camera.position.x -= Math.sin(camera.rotation.y + Math.PI / 2) * playerSpeed;
    }
    if (keyboardState['KeyD']) {
        camera.position.z += Math.cos(camera.rotation.y + Math.PI / 2) * playerSpeed;
        camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * playerSpeed;
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
