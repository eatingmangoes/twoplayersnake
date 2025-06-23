document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreP1Display = document.getElementById('score-p1');
    const scoreP2Display = document.getElementById('score-p2');
    const resultTitle = document.getElementById('result-title');
    const resultDetails = document.getElementById('result-details');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const uiOverlay = document.getElementById('ui-overlay');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    const TILE_SIZE = 20;
    const TILE_COUNT = 30;
    canvas.width = canvas.height = TILE_SIZE * TILE_COUNT;

    const P1_COLOR = '#00f5d4';
    const P1_HEAD_COLOR = '#99ffee';
    const P2_COLOR = '#ff006e';
    const P2_HEAD_COLOR = '#ff99c5';
    const FOOD_COLOR = '#f0f0f0';

    let players, food, gameInterval;

    const createPlayer = (id, x, y, velX, color, headColor, controls) => ({
        id,
        snake: [{ x, y }],
        velocity: { x: velX, y: 0 },
        nextVelocity: { x: velX, y: 0 },
        score: 0,
        isGameOver: false,
        color,
        headColor,
        controls,
    });

    function resetState() {
        players = [
            createPlayer(1, 5, 15, 1, P1_COLOR, P1_HEAD_COLOR, { 'w': {x:0, y:-1}, 's': {x:0, y:1}, 'a': {x:-1, y:0}, 'd': {x:1, y:0} }),
            createPlayer(2, TILE_COUNT - 6, 15, -1, P2_COLOR, P2_HEAD_COLOR, { 'ArrowUp': {x:0, y:-1}, 'ArrowDown': {x:0, y:1}, 'ArrowLeft': {x:-1, y:0}, 'ArrowRight': {x:1, y:0} })
        ];
        generateFood();
        updateScoreDisplays();
    }

    function gameLoop() {
        if (update()) {
            clearInterval(gameInterval);
            return;
        }
        draw();
    }

    function update() {
        let p1Crashed = false, p2Crashed = false;

        players.forEach(player => {
            player.velocity = player.nextVelocity;
            const head = { x: player.snake[0].x + player.velocity.x, y: player.snake[0].y + player.velocity.y };
            player.snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                player.score++;
                generateFood(); 
            } else {
                player.snake.pop();
            }
        });

        players.forEach((player, index) => {
            const head = player.snake[0];
            const opponent = players[1 - index];
            
            if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
                player.isGameOver = true;
            }
            for (let i = 1; i < player.snake.length; i++) {
                if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
                    player.isGameOver = true;
                    break;
                }
            }
            for (let i = 0; i < opponent.snake.length; i++) {
                if(i === 0 && head.x === opponent.snake[0].x && head.y === opponent.snake[0].y) {
                    player.isGameOver = true;
                    opponent.isGameOver = true;
                    break;
                }
                if (head.x === opponent.snake[i].x && head.y === opponent.snake[i].y) {
                    player.isGameOver = true;
                    break;
                }
            }
        });
        
        p1Crashed = players[0].isGameOver;
        p2Crashed = players[1].isGameOver;

        if (p1Crashed || p2Crashed) {
            let winner = null;
            if (p1Crashed && p2Crashed) winner = 'draw';
            else if (p1Crashed) winner = players[1];
            else winner = players[0];
            
            endGame(winner);
            return true;
        }

        updateScoreDisplays();
        return false;
    }

    function draw() {
        ctx.fillStyle = '#1a1a1d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = FOOD_COLOR;
        ctx.shadowColor = FOOD_COLOR;
        ctx.shadowBlur = 10;
        ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.shadowBlur = 0;
        players.forEach(player => {
            player.snake.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? player.headColor : player.color;
                ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
            });
        });
    }
    function updateScoreDisplays() {
        scoreP1Display.textContent = `P1: ${players[0].score}`;
        scoreP2Display.textContent = `P2: ${players[1].score}`;
    }

    function generateFood() {
        while (true) {
            food = {
                x: Math.floor(Math.random() * TILE_COUNT),
                y: Math.floor(Math.random() * TILE_COUNT)
            };
            let onSnake = players.some(p => p.snake.some(seg => seg.x === food.x && seg.y === food.y));
            if (!onSnake) break;
        }
    }

    function startGame() {
        if (gameInterval) clearInterval(gameInterval);
        resetState();
        uiOverlay.classList.add('hidden');
        gameInterval = setInterval(gameLoop, 100);
    }

    function endGame(winner) {
        if (winner === 'draw') {
            resultTitle.textContent = 'DRAW!';
            resultTitle.className = 'draw';
            resultDetails.textContent = `A head-on collision! Final scores: P1: ${players[0].score}, P2: ${players[1].score}`;
        } else {
            resultTitle.textContent = `PLAYER ${winner.id} WINS!`;
            resultTitle.className = `p${winner.id}-win`;
            resultDetails.textContent = `Final scores: P1: ${players[0].score}, P2: ${players[1].score}`;
        }
        gameOverScreen.classList.add('active');
        startScreen.classList.remove('active');
        uiOverlay.classList.remove('hidden');
    }

    function handleKeyPress(e) {
        players.forEach(player => {
            if (player.controls[e.key]) {
                const newVelocity = player.controls[e.key];
                if (newVelocity.x !== -player.velocity.x || newVelocity.y !== -player.velocity.y) {
                    player.nextVelocity = newVelocity;
                }
            }
        });
    }

    document.addEventListener('keydown', handleKeyPress);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    resetState();
    draw();
});