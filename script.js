// ======================================================
// Parte 1: Configuração da Cena, Câmera e Renderizador
// ======================================================

// 1. A Cena: Nosso universo 3D
const scene = new THREE.Scene();
// Define uma cor de fundo para a cena (nosso "céu")
scene.background = new THREE.Color(0x87ceeb); // Um azul-céu

// 2. A Câmera: O olho do jogador
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visão (field of view)
    window.innerWidth / window.innerHeight, // Proporção da tela (aspect ratio)
    0.1, // Distância mínima de renderização (near clipping plane)
    1000 // Distância máxima de renderização (far clipping plane)
);
// Posição inicial da câmera
camera.position.set(0, 1.7, 5); // x, y (altura do jogador), z

// 3. O Renderizador: Desenha a cena na tela
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); // Tamanho da tela
document.body.appendChild(renderer.domElement); // Adiciona o canvas ao HTML

// ======================================================
// Parte 2: Adicionando Objetos à Cena
// ======================================================

// Criando um chão
const floorGeometry = new THREE.PlaneGeometry(100, 100); // Largura, Altura
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x4f7942 }); // Cor de grama
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotaciona o plano para ficar deitado
scene.add(floor);

// Criando um cubo para termos uma referência visual
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); // Largura, Altura, Profundidade
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Branco
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0.5, 0); // Posição do cubo (metade da altura para ficar sobre o chão)
scene.add(cube);

// ======================================================
// Parte 3: O Loop de Animação
// ======================================================

// Esta função será chamada repetidamente para criar a animação
function animate() {
    requestAnimationFrame(animate); // Agendador para a próxima atualização

    // Lógica do jogo (movimento, colisões, etc.) virá aqui no futuro

    // Renderiza a cena a partir da perspectiva da câmera
    renderer.render(scene, camera);
}

// Inicia o loop de animação
animate();


// ======================================================
// Parte 4: Lidando com o Redimensionamento da Janela
// ======================================================

window.addEventListener('resize', () => {
    // Atualiza a proporção da câmera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Atualiza o tamanho do renderizador
    renderer.setSize(window.innerWidth, window.innerHeight);
});
