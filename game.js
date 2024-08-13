// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to 320x480
canvas.width = 320;
canvas.height = 480;

// Paddle properties
const paddleHeight = 10;
const normalPaddleWidth = 75;
let paddleWidth = normalPaddleWidth;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleResizeTimeout = null;

// Ball properties
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

// Brick properties
const brickRowCount = 2; // 2 rows
const brickColumnCount = 12; // 12 bricks per row
const brickWidth = canvas.width / brickColumnCount; // Adjusted for 12 bricks per row
const brickHeight = 20;
const brickOffsetTop = 80;
const brickOffsetLeft = 0; // Align to left edge

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// Roof properties
const roofHeight = 40; // The height of the roof area

// Coin properties
let coins = [];
const coinRadius = 14;
const coinDropChance = 0.5;
let collectedCoins = 0;

// Game state
let gameStarted = false;
let score = 0;
let timeElapsed = 0;
let timerInterval;

// Image resources
const ballImage = new Image();
ballImage.src = 'drill.png';
const brickImage = new Image();
brickImage.src = 'brick.png';
const coinImage = new Image();
coinImage.src = 'coin.png';
const backgroundImage = new Image();
backgroundImage.src = 'background.png';

// Sound resources
let brickHitSound, gameOverSound, gameWinSound, coinCollectSound;
function loadSounds() {
    brickHitSound = new Audio('brick-hit.mp3');
    gameOverSound = new Audio('game-over.mp3');
    gameWinSound = new Audio('game-win.mp3');
    coinCollectSound = new Audio('coin-collect.mp3');
}

// Keyboard controls
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function startGameHandler() {
    if (!gameStarted) {
        loadSounds();
        gameStarted = true;
        timerInterval = setInterval(function () {
            timeElapsed += 0.01;
            drawScoreAndTime();
        }, 10);
        draw();
    }
}

// Touch controls
let isTouching = false;

canvas.addEventListener("touchstart", touchStartHandler, false);
canvas.addEventListener("touchmove", touchMoveHandler, false);
canvas.addEventListener("touchend", touchEndHandler, false);

function touchStartHandler(e) {
    isTouching = true;
}

function touchMoveHandler(e) {
    if (isTouching) {
        const touch = e.touches[0];
        const relativeX = touch.clientX - canvas.offsetLeft;
        if (relativeX - paddleWidth / 2 > 0 && relativeX + paddleWidth / 2 < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
        }
    }
    e.preventDefault();
}

function touchEndHandler(e) {
    isTouching = false;
}

// Drawing functions
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
}

function drawBall() {
    ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
}

function drawCoins() {
    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            ctx.drawImage(coinImage, coins[i].x - coinRadius, coins[i].y - coinRadius, coinRadius * 2, coinRadius * 2);
        }
    }
}

function updateCoins() {
    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            coins[i].y += 2;
            if (coins[i].y + coinRadius > canvas.height - paddleHeight &&
                coins[i].x > paddleX - 10 && coins[i].x < paddleX + paddleWidth + 10) { // Increased tolerance by 10 pixels
                coins[i].active = false;
                collectedCoins += 1;
                coinCollectSound.play();
                handlePaddleResize();
            }
            if (coins[i].y > canvas.height) {
                coins[i].active = false;
            }
        }
    }
}

function handlePaddleResize() {
    if (paddleResizeTimeout) return; // If the paddle is already resized, do nothing

    const random = Math.random();
    if (random < 0.2) {
        paddleWidth = normalPaddleWidth * 2; // Double the size
    } else if (random < 0.4) {
        paddleWidth = normalPaddleWidth / 2; // Halve the size
    }

    // Set a timeout to reset the paddle size after 5 seconds
    paddleResizeTimeout = setTimeout(() => {
        paddleWidth = normalPaddleWidth;
        paddleResizeTimeout = null; // Clear the timeout
    }, 5000);
}

function drawBricks() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            if (bricks[c][r].status == 1) {
                const brickX = c * brickWidth;
                const brickY = r * brickHeight + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
            }
        }
    }
}

// Collision detection
function collisionDetection() {
    let bricksRemaining = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status == 1) {
                bricksRemaining++;
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    brickHitSound.play();
                    score += 10;
                    drawScoreAndTime();
                    if (Math.random() < coinDropChance) {
                        coins.push({
                            x: b.x + brickWidth / 2,
                            y: b.y,
                            active: true
                        });
                    }
                }
            }
        }
    }

    if (bricksRemaining == 0) {
        gameWinSound.play();
        setTimeout(function () {
            showMessage("主委加碼！", true);
        }, 100);
        return true;
    }
    return false;
}

// Draw score and time, including roof
function drawScoreAndTime() {
    ctx.clearRect(0, 0, canvas.width, roofHeight);
    ctx.fillStyle = "#000"; // Draw the roof
    ctx.fillRect(0, 0, canvas.width, roofHeight);

    if (gameStarted) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.textAlign = "center";
        ctx.fillText("硬幣: " + collectedCoins, canvas.width / 4, 30);
        ctx.fillText("時間: " + timeElapsed.toFixed(2) + " 秒", (canvas.width / 4) * 3, 30);
    }
}

// Show message and pause game
function showMessage(message, isWin) {
    clearInterval(timerInterval);
    gameStarted = false;

    ctx.font = "20px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);

    const restartBtn = document.createElement('button');
    restartBtn.innerText = "重新挑戰";
    restartBtn.style.position = 'absolute';
    restartBtn.style.top = '50%';
    restartBtn.style.left = '50%';
    restartBtn.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(restartBtn);

    restartBtn.addEventListener('click', function () {
        document.body.removeChild(restartBtn);
        resetGame();  // Reset the game and restart immediately
    });
}

function resetGame() {
    // Reset all game variables
    gameStarted = false;
    score = 0;
    timeElapsed = 0;
    collectedCoins = 0;
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2;
    dy = -2;

    // Reset bricks
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    // Clear coins
    coins = [];

    // Reset paddle size
    paddleWidth = normalPaddleWidth;
    if (paddleResizeTimeout) {
        clearTimeout(paddleResizeTimeout);
        paddleResizeTimeout = null;
    }

    // Start the game immediately
    gameStarted = true;
    timerInterval = setInterval(function () {
        timeElapsed += 0.01;
        drawScoreAndTime();
    }, 10);
    draw();
}

// Main draw function
function draw() {
    ctx.clearRect(0, 40, canvas.width, canvas.height - 40);
    drawBackground();
    drawBricks();
    drawBall();
    drawCoins();
    drawPaddle();
    drawScoreAndTime();

    updateCoins();

    if (collisionDetection()) {
        return;
    }

    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius - paddleHeight) {
        if (x > paddleX - 10 && x < paddleX + paddleWidth + 10) { // Increased tolerance by 10 pixels
            let relativeX = x - paddleX;
            let offset = relativeX / paddleWidth - 0.5;
            dx = offset * 8; // Decreased speed slightly when hitting the edge
            dy = -dy;
        } else {
            gameOverSound.play();
            setTimeout(function () {
                showMessage("得罪了！", false);
            }, 100);
            return;
        }
    }

    // Reflect the ball off the roof
    if (y - ballRadius < roofHeight) {
        dy = -dy;
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    requestAnimationFrame(draw);
}

// Show start message and "開始遊戲" button only after login
function showStartMessage() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("操作方式", canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText("電腦: 左右鍵", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("手機: 移動反擊板", canvas.width / 2, canvas.height / 2);

    // Add "開始遊戲" button
    const startBtn = document.createElement('button');
    startBtn.innerText = "開始遊戲";
    startBtn.style.position = 'absolute';
    startBtn.style.top = canvas.offsetTop + canvas.height / 2 + 30 + 'px';
    startBtn.style.left = canvas.offsetLeft + canvas.width / 2 + 'px';
    startBtn.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(startBtn);

    startBtn.addEventListener('click', function () {
        // Hide the start message and button
        ctx.clearRect(0, canvas.height / 2 - 80, canvas.width, 160);
        document.body.removeChild(startBtn);
        startGameHandler();
    });
}

// Initialize the game page
function initializeGame() {
    showStartMessage();
}

// Call the initialization function when the user submits their name and the game page is shown
document.getElementById('submitBtn').addEventListener('click', () => {
    const playerName = document.getElementById('playerName').value;
    if (playerName) {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('gamePage').classList.remove('hidden');
        initializeGame(); // Initialize the game after switching to the game page
    }
});
