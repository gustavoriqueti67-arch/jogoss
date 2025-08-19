// Configurações do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const screenWidth = 640;
const screenHeight = 480;
canvas.width = screenWidth;
canvas.height = screenHeight;

// Configurações do Jogo
const mapWidth = 20;
const mapHeight = 20;
const tileSize = 32;

// Variáveis do Jogador
let playerX = tileSize * 1.5;
let playerY = tileSize * 1.5;
let playerAngle = Math.PI / 4;
const playerSpeed = 2;
const playerRotationSpeed = 0.05;

// Variáveis do Monstro
let monsterX = tileSize * (mapWidth - 1.5);
let monsterY = tileSize * (mapHeight - 1.5);
const monsterSpeed = 1.5;

// Mapa do Labirinto (1 = parede, 0 = caminho)
let maze = [];

// Geração do Labirinto (Algoritmo Recursive Backtracker)
function generateMaze() {
    // Inicializa o labirinto com paredes
    for (let y = 0; y < mapHeight; y++) {
        maze[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            maze[y][x] = 1;
        }
    }

    const stack = [];
    const startX = 1;
    const startY = 1;
    let currentX = startX;
    let currentY = startY;

    maze[currentY][currentX] = 0;
    stack.push([currentX, currentY]);

    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];

        // Verifica os vizinhos
        if (cy - 2 >= 0 && maze[cy - 2][cx] === 1) neighbors.push([0, -2]); // Cima
        if (cy + 2 < mapHeight && maze[cy + 2][cx] === 1) neighbors.push([0, 2]); // Baixo
        if (cx - 2 >= 0 && maze[cy][cx - 2] === 1) neighbors.push([-2, 0]); // Esquerda
        if (cx + 2 < mapWidth && maze[cy][cx + 2] === 1) neighbors.push([2, 0]); // Direita

        if (neighbors.length > 0) {
            const [dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
            const nx = cx + dx;
            const ny = cy + dy;

            maze[ny][cx + dx / 2] = 0;
            maze[ny][cx] = 0;
            maze[ny][nx] = 0;
            maze[cy + dy / 2][cx] = 0;

            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }
}

// Controles do Jogador
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function handleInput() {
    if (keys['w']) {
        const newX = playerX + Math.cos(playerAngle) * playerSpeed;
        const newY = playerY + Math.sin(playerAngle) * playerSpeed;
        if (maze[Math.floor(newY / tileSize)][Math.floor(newX / tileSize)] === 0) {
            playerX = newX;
            playerY = newY;
        }
    }
    if (keys['s']) {
        const newX = playerX - Math.cos(playerAngle) * playerSpeed;
        const newY = playerY - Math.sin(playerAngle) * playerSpeed;
        if (maze[Math.floor(newY / tileSize)][Math.floor(newX / tileSize)] === 0) {
            playerX = newX;
            playerY = newY;
        }
    }
    if (keys['a']) playerAngle -= playerRotationSpeed;
    if (keys['d']) playerAngle += playerRotationSpeed;
}

// Lógica do Monstro
function moveMonster() {
    const angleToPlayer = Math.atan2(playerY - monsterY, playerX - monsterX);
    const newX = monsterX + Math.cos(angleToPlayer) * monsterSpeed;
    const newY = monsterY + Math.sin(angleToPlayer) * monsterSpeed;

    if (maze[Math.floor(newY / tileSize)][Math.floor(newX / tileSize)] === 0) {
        monsterX = newX;
        monsterY = newY;
    }
}

// Renderização (Raycasting)
function render() {
    // Céu e Chão
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);
    ctx.fillStyle = '#666';
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight);

    // Paredes
    for (let x = 0; x < screenWidth; x++) {
        const rayAngle = (playerAngle - Math.PI / 6) + (x / screenWidth) * (Math.PI / 3);
        let distanceToWall = 0;
        let hitWall = false;

        const eyeX = Math.cos(rayAngle);
        const eyeY = Math.sin(rayAngle);

        while (!hitWall && distanceToWall < 20 * tileSize) {
            distanceToWall += 0.5;
            const testX = Math.floor((playerX + eyeX * distanceToWall) / tileSize);
            const testY = Math.floor((playerY + eyeY * distanceToWall) / tileSize);

            if (maze[testY][testX] === 1) {
                hitWall = true;
            }
        }

        const wallHeight = (tileSize / distanceToWall) * 277;
        const wallTop = screenHeight / 2 - wallHeight / 2;
        const shade = 1 - Math.min(distanceToWall / (20 * tileSize), 1);
        ctx.fillStyle = `rgb(${150 * shade}, ${150 * shade}, ${150 * shade})`;
        ctx.fillRect(x, wallTop, 1, wallHeight);
    }
}

// Loop Principal do Jogo
function gameLoop() {
    handleInput();
    moveMonster();
    render();

    // Condição de Derrota
    const distToMonster = Math.sqrt(Math.pow(playerX - monsterX, 2) + Math.pow(playerY - monsterY, 2));
    if (distToMonster < tileSize / 2) {
        alert('Você foi pego!');
        generateMaze();
        playerX = tileSize * 1.5;
        playerY = tileSize * 1.5;
        monsterX = tileSize * (mapWidth - 1.5);
        monsterY = tileSize * (mapHeight - 1.5);
    }
    
    // Condição de Vitória (chegar ao final)
    if (Math.floor(playerX / tileSize) === mapWidth - 2 && Math.floor(playerY / tileSize) === mapHeight - 2) {
        alert('Você escapou!');
        generateMaze();
        playerX = tileSize * 1.5;
        playerY = tileSize * 1.5;
        monsterX = tileSize * (mapWidth - 1.5);
        monsterY = tileSize * (mapHeight - 1.5);
    }


    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
generateMaze();
gameLoop();
