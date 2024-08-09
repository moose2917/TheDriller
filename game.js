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
const paddleSpeed = 7;  // 球拍定速

// 小球屬性
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;
const maxDx = 5;  // 球的最大水平速度

// 磚塊屬性
const brickRowCount = 4;  // 4行
const brickColumnCount = 5;
const brickWidth = (canvas.width - 2 * 20) / brickColumnCount - 10; // 平衡居中放置磚塊
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 100;  // 調整磚塊距離頂部的位置，以留出天花板的空間
const brickOffsetLeft = 20; // 增加一點左右邊距

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// 硬幣屬性
let coins = [];
const coinRadius = 7 * 2; // 硬幣大小增加至250%
const coinDropChance = 0.5; // 50% 的機率掉落硬幣
let collectedCoins = 0;

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
const coinImage = new Image();
coinImage.src = 'coin.png'; // 替換為硬幣的圖像
const backgroundImage = new Image();
backgroundImage.src = 'background.png'; // 新的背景圖像

// 旋轉圖片 (順時針轉 90 度)
function drawRotatedImage(image, x, y, width, height, angle) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
}

// 音效
let brickHitSound, gameOverSound, gameWinSound, coinCollectSound;
function loadSounds() {
    brickHitSound = new Audio('brick-hit.mp3'); // 磚塊音效
    gameOverSound = new Audio('game-over.mp3'); // 遊戲結束音效
    gameWinSound = new Audio('game-win.mp3'); // 遊戲勝利音效
    coinCollectSound = new Audio('coin-collect.mp3'); // 收集硬幣音效
}

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

function startGameHandler(e) {
    if (!gameStarted && (e.key === " " || e.type === "touchstart")) {
        loadSounds(); // 在首次交互後加載音效以便在手機上播放
        gameStarted = true;
        timerInterval = setInterval(function () {
            timeElapsed++;
            drawScoreAndTime();  // 確保每秒更新時間
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

// 繪製背景
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
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

// 繪製硬幣
function drawCoins() {
    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            ctx.drawImage(coinImage, coins[i].x - coinRadius, coins[i].y - coinRadius, coinRadius * 2, coinRadius * 2);
        }
    }
}

// 更新硬幣位置
function updateCoins() {
    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            coins[i].y += 2; // 硬幣下落速度
            // 檢查是否接住硬幣
            if (coins[i].y + coinRadius > canvas.height - paddleHeight &&
                coins[i].x > paddleX && coins[i].x < paddleX + paddleWidth) {
                coins[i].active = false;
                collectedCoins += 1; // 更新接住的硬幣數量
                coinCollectSound.play();
            }
            // 檢查是否超出畫面
            if (coins[i].y > canvas.height) {
                coins[i].active = false;
            }
        }
    }
}

// 磚塊排列
function drawBricks() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            if (r % 2 == 1 && c == brickColumnCount - 1) continue; // 偶數行跳過最後一個磚塊
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
                    drawScoreAndTime(); // 更新分數顯示

                    // 50% 機率掉落硬幣
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
    // 绘制天花板区域
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, 40);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("硬幣: " + collectedCoins, canvas.width / 4, 30); // 顯示收集到的硬幣數量
    ctx.fillText("時間: " + timeElapsed + "秒", (canvas.width / 4) * 3, 30); // 時間顯示在頂部靠右
}

// 在畫面的右下角處加上顯示版本號的功能
function drawFooter() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "right";
    ctx.fillText("V.002", canvas.width - 10, canvas.height - 10);
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
    drawBackground();  // 繪製背景
    drawBricks();
    drawBall();
    drawCoins();  // 繪製硬幣
    drawPaddle(); // 确保每次都绘制球拍
    drawScoreAndTime();  // 每一幀都確保硬幣數量和時間被正確顯示
    drawFooter();  // 在右下角顯示版本號

    updateCoins();  // 更新硬幣位置

    if (collisionDetection()) {
        return; // 停止繪製以暫停遊戲
    }

    // 更新小球的位置
    x += dx;
    y += dy;

    // 确保小球在画布内部
    if (x < ballRadius) {
        x = ballRadius;
    } else if (x > canvas.width - ballRadius) {
        x = canvas.width - ballRadius;
    }

    // 碰撞检测：顶部的红线处
    const ceilingLine = 40; // 天花板红线位置，大约是40px的位置
    if (y < ballRadius + ceilingLine) {
        y = ballRadius + ceilingLine;  // 防止小球卡在天花板处
        dy = -dy;  // 反弹
    }

    // 碰撞检测：左右边界
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    // 碰撞检测：底部（球拍处）
    if (y + dy > canvas.height - ballRadius - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            const hitPosition = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            dx = hitPosition * maxDx; // 根据击打位置调整水平速度
            dy = -Math.abs(dy); // 使球反弹向上
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
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
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
    drawFooter();  // 顯示版本號
}

// 初始化
drawScoreAndTime();
showStartMessage();
