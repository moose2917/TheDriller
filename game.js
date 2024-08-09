// 獲取畫布和繪圖上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 調整遊戲畫布的大小以適應不同裝置
canvas.width = Math.min(window.innerWidth - 20, 320);  // 調整為窄但長型
canvas.height = Math.min(window.innerHeight - 20, 480);  // 調整為窄但長型

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
const brickRowCount = 4;  // 增加到4行
const brickColumnCount = 5;
const brickWidth = (canvas.width - 2 * 20) / brickColumnCount - 10; // 平衡居中放置磚塊
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 50;
const brickOffsetLeft = 20; // 增加一點左右邊距

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// 遊戲狀態
let gameStarted = false;
let score = 0;
let timeElapsed = 0;
let timerInterval;

// 圖像資源
const ballImage = new Image();
ballImage.src = 'drill.png'; // 替換為電鑽的圖像
const brickImage = new Image();
brickImage.src = 'brick.png'; // 替換為磚塊的圖像

// 旋轉圖片 (順時針轉 90 度)
function drawRotatedImage(image, x, y, width, height, angle) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
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
document.addEventListener("keydown", startGameHandler, false);
canvas.addEventListener("touchstart", startGameHandler, false);

function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

function startGameHandler(e) {
    if (!gameStarted && (e.key === " " || e.type === "touchstart")) {
        gameStarted = true;
        timerInterval = setInterval(function () {
            timeElapsed++;
            drawScoreAndTime();
        }, 1000);
        document.removeEventListener("keydown", startGameHandler);
        canvas.removeEventListener("touchstart", startGameHandler);
        draw(); // 開始遊戲循環
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
    drawRotatedImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2, Math.PI / 2);  // 旋轉90度
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft + (r % 2) * (brickWidth / 2); // 交錯排列
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
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
                    score += 10;
                    drawScoreAndTime();
                }
            }
        }
    }

    // 如果所有磚塊都被打完，顯示勝利訊息
    if (bricksRemaining == 0) {
        gameWinSound.play();
        setTimeout(function () {
            showMessage("主委加碼！", true);
        }, 100);
        return true;
    }
    return false;
}

// 繪製分數和時間
function drawScoreAndTime() {
    ctx.clearRect(0, 0, canvas.width, 40); // 清除之前繪製的分數和時間
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("分數: " + score, 8, 20);
    ctx.fillText("時間: " + timeElapsed + "秒", canvas.width - 100, 20);
}

// 顯示訊息並控制遊戲暫停
function showMessage(message, isWin) {
    clearInterval(timerInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#0095DD";
    ctx.fillText("再玩一局嗎？點擊此處開始", canvas.width / 2, canvas.height / 2 + 20);
    canvas.addEventListener("click", function () {
        document.location.reload();
    });
}

// 主繪製函數
function draw() {
    ctx.clearRect(0, 40, canvas.width, canvas.height - 40);
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
                showMessage("得罪了！", false);
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

// 顯示開始遊戲提示
function showStartMessage() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("按空白鍵開始遊戲", canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("或碰一下螢幕", canvas.width / 2, canvas.height / 2 + 20);
}

// 初始化
drawScoreAndTime();
showStartMessage();
