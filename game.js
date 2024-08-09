// 獲取畫布和繪圖上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 調整遊戲畫布的大小以適應不同裝置
canvas.width = Math.min(window.innerWidth - 20, 480);
canvas.height = Math.min(window.innerHeight - 20, 320);

// 球拍屬性
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

// 小球屬性
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

// 磚塊屬性
const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// 音效
const brickHitSound = new Audio('brick-hit.mp3'); // 磚塊音效
const gameOverSound = new Audio('game-over.mp3'); // 遊戲結束音效
const gameWinSound = new Audio('game-win.mp3'); // 遊戲勝利音效

// 鍵盤控制
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

// 觸控控制
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

// 繪製球拍
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#FF0000";  // 紅色
    ctx.fill();
    ctx.closePath();
}

// 繪製小球
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";  // 小球顏色
    ctx.fill();
    ctx.closePath();
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "#0095DD";  // 磚塊顏色
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 碰撞檢測
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
                }
            }
        }
    }

    // 如果所有磚塊都被打完，顯示勝利訊息
    if (bricksRemaining == 0) {
        gameWinSound.play();
        setTimeout(function () {
            alert("主委加碼！");
            if (confirm("再玩一局嗎？")) {
                document.location.reload();
            }
        }, 100);
        return true;
    }
    return false;
}

// 主繪製函數
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    
    if (collisionDetection()) {
        return; // 停止繪製以暫停遊戲
    }

    // 更新小球的位置
    x += dx;
    y += dy;

    // 檢查小球與牆壁的碰撞
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            // 小球落到畫布底部，遊戲結束
            gameOverSound.play();
            setTimeout(function () {
                alert("得罪了！");
                if (confirm("再玩一局嗎？")) {
                    document.location.reload();
                }
            }, 100);
            return; // 停止繪製以暫停遊戲
        }
    }

    // 鍵盤控制球拍移動
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    requestAnimationFrame(draw);
}

draw();  // 啟動遊戲循環
