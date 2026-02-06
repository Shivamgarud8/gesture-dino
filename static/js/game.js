// DOM Elements
const video = document.getElementById("camera");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");
const game = document.getElementById("game");
const ctx = game.getContext("2d");

// UI Elements
const scoreDisplay = document.getElementById("scoreDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const timeDisplay = document.getElementById("timeDisplay");
const gestureText = document.getElementById("gestureText");

// Setup camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            overlay.width = video.videoWidth;
            overlay.height = video.videoHeight;
        };
    })
    .catch(err => {
        console.error("Camera error:", err);
        gestureText.textContent = "❌ Camera Error";
    });

// Game canvas setup
function resizeCanvas() {
    const container = game.getBoundingClientRect();
    game.width = container.width;
    game.height = container.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Constants
const GROUND_HEIGHT = 80;
const DINO_SIZE = 55;
const DINO_X = 80;
const GRAVITY = 0.5; // Reduced gravity for smoother jump
const JUMP_STRENGTH = -12; // Lower jump power
const GAME_SPEED = 3.5; // SLOWER SPEED - more playable!
const CACTUS_MIN_GAP = 450; // Bigger gaps for slower speed
const CACTUS_MAX_GAP = 950; // More space between obstacles

// Game State
let gameState = {
    dinoY: 0,
    velocity: 0,
    jumping: false,
    lives: 5,
    score: 0,
    bestScore: parseInt(localStorage.getItem('bestScore')) || 0,
    gameTime: 0,
    gameRunning: false,
    gameOver: false,
    lastCactusX: 0,
    invincible: false,
    invincibleTimer: 0
};

// Game Objects
let cacti = [];
let birds = [];
let clouds = [];
let snowflakes = []; // Christmas snow!
let groundOffset = 0;

// Emojis
const DINO_EMOJI = "🦖";
const DINO_DUCK = "🦕";
const CACTUS_EMOJIS = ["🌵", "🌴", "🎄"]; // Added Christmas tree!
const BIRD_EMOJIS = ["🦅", "🦆", "🦉", "🕊️", "🦜"];
const CLOUD_EMOJIS = ["☁️"];
const CHRISTMAS_EMOJIS = ["🎅", "⛄", "🎁", "🔔", "⭐"]; // Christmas decorations
const HEART_FULL = "❤️";
const HEART_EMPTY = "🖤";

// Initialize ground position
gameState.dinoY = game.height - GROUND_HEIGHT - DINO_SIZE;

// Christmas Snowflake System - LIGHTER SNOW
function spawnSnowflake() {
    if (Math.random() < 0.02) { // Reduced to 2% chance
        snowflakes.push({
            x: Math.random() * game.width,
            y: -10,
            size: Math.random() * 12 + 8,
            speed: Math.random() * 0.6 + 0.3, // Slower falling
            drift: Math.random() * 0.3 - 0.15, // Less drift
            emoji: "❄️"
        });
    }
}

// Cloud Generation - VERY RARE AND MINIMAL
function spawnCloud() {
    if (Math.random() < 0.01) { // Slightly increased for atmosphere
        clouds.push({
            x: game.width + Math.random() * 600,
            y: Math.random() * (game.height * 0.15) + 15,
            emoji: CLOUD_EMOJIS[0],
            speed: Math.random() * 0.15 + 0.1, // Slower clouds
            size: Math.random() * 10 + 20
        });
    }
}

// Bird Generation - VERY VERY RARE!
function spawnBird() {
    if (gameState.gameRunning && Math.random() < 0.001) { // EXTREMELY RARE - 0.1% chance only!
        const heights = [
            game.height * 0.12,
            game.height * 0.20,
            game.height * 0.28
        ];
        birds.push({
            x: game.width + Math.random() * 900,
            y: heights[Math.floor(Math.random() * heights.length)],
            emoji: BIRD_EMOJIS[Math.floor(Math.random() * BIRD_EMOJIS.length)],
            speed: Math.random() * 0.8 + 1.5, // Slower bird speed
            size: 25,
            amplitude: Math.random() * 4 + 2,
            frequency: Math.random() * 0.02 + 0.008,
            offset: Math.random() * Math.PI * 2,
            decorative: true
        });
    }
}

// IMPROVED CACTUS GENERATION - TRULY RANDOM LIKE DINO GAME!
function spawnCactus() {
    if (!gameState.gameRunning) return;
    
    // Only spawn when there are no recent cacti
    const lastCactus = cacti[cacti.length - 1];
    const canSpawn = !lastCactus || (game.width - lastCactus.x) > CACTUS_MIN_GAP;
    
    if (!canSpawn) return;
    
    // RANDOM spawn chance - THIS MAKES IT RANDOM!
    const spawnChance = Math.random();
    if (spawnChance > 0.015) return; // Only 1.5% chance per frame = slower spawning!
    
    // Decide on cactus pattern randomly
    const patternRoll = Math.random();
    let groupSize = 1;
    let spacing = 60;
    
    // Random patterns
    if (patternRoll < 0.60) {
        // 60% chance: Single cactus
        groupSize = 1;
    } else if (patternRoll < 0.85) {
        // 25% chance: Double cactus
        groupSize = 2;
        spacing = Math.random() * 30 + 55; // Variable spacing 55-85px
    } else {
        // 15% chance: Triple cactus (harder!)
        groupSize = 3;
        spacing = Math.random() * 20 + 50; // Variable spacing 50-70px
    }
    
    const baseX = game.width + 50;
    
    // Random cactus type for each group (or Christmas tree!)
    const useChristmasTree = Math.random() < 0.25; // 25% chance of Christmas tree
    const cactusType = useChristmasTree ? 2 : Math.floor(Math.random() * 2); // Index 2 is 🎄
    
    for (let i = 0; i < groupSize; i++) {
        const cactusEmoji = CACTUS_EMOJIS[cactusType];
        const isChristmas = cactusEmoji === "🎄";
        
        cacti.push({
            x: baseX + i * spacing,
            y: game.height - GROUND_HEIGHT,
            emoji: cactusEmoji,
            size: Math.random() * 15 + (isChristmas ? 60 : 55),
            width: isChristmas ? 45 : 40,
            height: isChristmas ? 65 : 60,
            isChristmas: isChristmas
        });
    }
}

// Christmas Decoration Spawner
let christmasDecorations = [];
function spawnChristmasDecoration() {
    if (Math.random() < 0.0005) { // SUPER RARE - 0.05% chance!
        christmasDecorations.push({
            x: game.width + Math.random() * 600,
            y: Math.random() * (game.height * 0.25) + 25,
            emoji: CHRISTMAS_EMOJIS[Math.floor(Math.random() * CHRISTMAS_EMOJIS.length)],
            speed: Math.random() * 0.3 + 0.2, // Slower movement
            size: Math.random() * 12 + 22,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03 // Slower rotation
        });
    }
}

// Gesture Detection
let lastGestureState = false;

function sendFrame() {
    if (!video.videoWidth) return;

    const temp = document.createElement("canvas");
    temp.width = video.videoWidth;
    temp.height = video.videoHeight;
    const tempCtx = temp.getContext("2d");
    tempCtx.drawImage(video, 0, 0);

    fetch("/process_frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: temp.toDataURL("image/jpeg", 0.7) })
    })
        .then(res => res.json())
        .then(data => {
            // Clear overlay
            octx.clearRect(0, 0, overlay.width, overlay.height);

            // Draw landmarks
            if (data.landmarks && data.landmarks.length > 0) {
                octx.fillStyle = "#00ff00";
                octx.strokeStyle = "#00ff00";
                octx.lineWidth = 2;

                // Draw hand skeleton
                const connections = [
                    [0,1],[1,2],[2,3],[3,4],
                    [0,5],[5,6],[6,7],[7,8],
                    [0,9],[9,10],[10,11],[11,12],
                    [0,13],[13,14],[14,15],[15,16],
                    [0,17],[17,18],[18,19],[19,20],
                    [5,9],[9,13],[13,17]
                ];

                connections.forEach(([start, end]) => {
                    if (data.landmarks[start] && data.landmarks[end]) {
                        octx.beginPath();
                        octx.moveTo(data.landmarks[start].x, data.landmarks[start].y);
                        octx.lineTo(data.landmarks[end].x, data.landmarks[end].y);
                        octx.stroke();
                    }
                });

                // Draw points
                data.landmarks.forEach(p => {
                    octx.fillStyle = data.jump ? "#ff0000" : "#00ff00";
                    octx.beginPath();
                    octx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    octx.fill();
                });
            }

            // Update gesture indicator
            if (data.jump) {
                gestureText.textContent = "✊ FIST - JUMP!";
                gestureText.style.color = "#ffff00";
            } else {
                gestureText.textContent = "🖐️ Open Hand";
                gestureText.style.color = "#fff";
            }

            // Handle jump - only when on ground
            if (data.jump && !lastGestureState && gameState.gameRunning && !gameState.jumping) {
                gameState.velocity = JUMP_STRENGTH;
                gameState.jumping = true;
            }

            lastGestureState = data.jump;
        })
        .catch(err => {
            console.error("Frame processing error:", err);
        });
}

// Send frames at 5 FPS for gesture detection
setInterval(sendFrame, 200);

// Collision Detection - MORE FORGIVING HITBOXES
function checkCollision(obj) {
    const dinoLeft = DINO_X + 8; // More forgiving hitbox
    const dinoRight = DINO_X + DINO_SIZE - 8;
    const dinoTop = gameState.dinoY + 8;
    const dinoBottom = gameState.dinoY + DINO_SIZE - 8;

    const objLeft = obj.x + 10; // More forgiving cactus hitbox
    const objRight = obj.x + (obj.width || obj.size) - 10;
    const objTop = obj.y - (obj.height || obj.size) + 10;
    const objBottom = obj.y - 10;

    return dinoRight > objLeft &&
           dinoLeft < objRight &&
           dinoBottom > objTop &&
           dinoTop < objBottom;
}

// Update Game State
function update(deltaTime) {
    if (!gameState.gameRunning || gameState.gameOver) return;

    // Update time
    gameState.gameTime += deltaTime;
    timeDisplay.textContent = Math.floor(gameState.gameTime / 1000) + "s";

    // Physics
    gameState.velocity += GRAVITY;
    gameState.dinoY += gameState.velocity;

    // Ground collision
    if (gameState.dinoY >= game.height - GROUND_HEIGHT - DINO_SIZE) {
        gameState.dinoY = game.height - GROUND_HEIGHT - DINO_SIZE;
        gameState.jumping = false;
        gameState.velocity = 0;
    }

    // Update ground scroll
    groundOffset = (groundOffset + GAME_SPEED) % 40;

    // Spawn obstacles and decorations
    spawnCactus();
    spawnBird();
    spawnCloud();
    spawnSnowflake();
    spawnChristmasDecoration();

    // Update invincibility
    if (gameState.invincible) {
        gameState.invincibleTimer -= deltaTime;
        if (gameState.invincibleTimer <= 0) {
            gameState.invincible = false;
        }
    }

    // Update snowflakes
    snowflakes = snowflakes.filter(snow => {
        snow.y += snow.speed;
        snow.x += snow.drift;
        return snow.y < game.height;
    });

    // Update Christmas decorations
    christmasDecorations = christmasDecorations.filter(deco => {
        deco.x -= deco.speed;
        deco.rotation += deco.rotationSpeed;
        return deco.x > -100;
    });

    // Update clouds
    clouds = clouds.filter(cloud => {
        cloud.x -= cloud.speed;
        return cloud.x > -100;
    });

    // Update birds
    birds = birds.filter(bird => {
        bird.x -= bird.speed;
        bird.y += Math.sin(bird.x * bird.frequency + bird.offset) * bird.amplitude * 0.1;
        return bird.x > -100;
    });

    // Update and check cacti
    cacti = cacti.filter(cactus => {
        cactus.x -= GAME_SPEED;

        // Collision with cactus
        if (!gameState.invincible && checkCollision(cactus)) {
            loseLife();
            return false;
        }

        // Score when passing
        if (cactus.x + cactus.width < DINO_X && !cactus.scored) {
            cactus.scored = true;
            gameState.score++;
            scoreDisplay.textContent = gameState.score;
        }

        return cactus.x > -cactus.width;
    });
}

// Lose Life
function loseLife() {
    gameState.lives--;
    updateLivesDisplay();

    // Invincibility period
    gameState.invincible = true;
    gameState.invincibleTimer = 1500;

    if (gameState.lives <= 0) {
        endGame();
    }
}

// Update Lives Display
function updateLivesDisplay() {
    let heartsStr = "";
    for (let i = 0; i < 5; i++) {
        heartsStr += i < gameState.lives ? HEART_FULL : HEART_EMPTY;
    }
    livesDisplay.textContent = heartsStr;
}

// End Game
function endGame() {
    gameState.gameOver = true;
    gameState.gameRunning = false;

    // Update best score
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('bestScore', gameState.bestScore);
        bestDisplay.textContent = gameState.bestScore;
    }
}

// Reset Game
function resetGame() {
    gameState = {
        dinoY: game.height - GROUND_HEIGHT - DINO_SIZE,
        velocity: 0,
        jumping: false,
        lives: 5,
        score: 0,
        bestScore: gameState.bestScore,
        gameTime: 0,
        gameRunning: true,
        gameOver: false,
        lastCactusX: 0,
        invincible: false,
        invincibleTimer: 0
    };

    cacti = [];
    birds = [];
    clouds = [];
    snowflakes = [];
    christmasDecorations = [];
    groundOffset = 0;

    scoreDisplay.textContent = "0";
    timeDisplay.textContent = "0s";
    updateLivesDisplay();
}

// Draw Game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, game.width, game.height);

    // Draw sky gradient (winter theme)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, game.height);
    skyGradient.addColorStop(0, "#87ceeb");
    skyGradient.addColorStop(1, "#b0e0e6"); // Lighter blue for winter
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Draw snowflakes
    snowflakes.forEach(snow => {
        ctx.font = `${snow.size}px Arial`;
        ctx.fillText(snow.emoji, snow.x, snow.y);
    });

    // Draw Christmas decorations
    christmasDecorations.forEach(deco => {
        ctx.save();
        ctx.translate(deco.x + deco.size / 2, deco.y + deco.size / 2);
        ctx.rotate(deco.rotation);
        ctx.font = `${deco.size}px Arial`;
        ctx.fillText(deco.emoji, -deco.size / 2, deco.size / 2);
        ctx.restore();
    });

    // Draw clouds
    clouds.forEach(cloud => {
        ctx.font = `${cloud.size}px Arial`;
        ctx.fillText(cloud.emoji, cloud.x, cloud.y);
    });

    // Draw ground (snowy ground)
    ctx.fillStyle = "#f0f0f0"; // White-ish for snow
    ctx.fillRect(0, game.height - GROUND_HEIGHT, game.width, GROUND_HEIGHT);

    // Draw ground pattern
    ctx.strokeStyle = "#d3d3d3";
    ctx.lineWidth = 2;
    for (let i = -40; i < game.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i + groundOffset, game.height - GROUND_HEIGHT);
        ctx.lineTo(i + groundOffset, game.height);
        ctx.stroke();
    }

    // Draw ground line
    ctx.strokeStyle = "#a9a9a9";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, game.height - GROUND_HEIGHT);
    ctx.lineTo(game.width, game.height - GROUND_HEIGHT);
    ctx.stroke();

    // Draw dino with invincibility effect
    if (gameState.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    ctx.font = `${DINO_SIZE}px Arial`;
    ctx.fillText(DINO_EMOJI, DINO_X, gameState.dinoY + DINO_SIZE);
    ctx.globalAlpha = 1;

    // Draw cacti (with Christmas trees!)
    cacti.forEach(cactus => {
        ctx.font = `${cactus.size}px Arial`;
        ctx.fillText(cactus.emoji, cactus.x, cactus.y);
        
        // Add sparkle to Christmas trees
        if (cactus.isChristmas && Math.random() < 0.1) {
            ctx.font = "15px Arial";
            ctx.fillText("✨", cactus.x + Math.random() * 30, cactus.y - Math.random() * 40);
        }
    });

    // Draw birds
    birds.forEach(bird => {
        ctx.font = `${bird.size}px Arial`;
        ctx.fillText(bird.emoji, bird.x, bird.y + bird.size);
    });

    // Draw start screen
    if (!gameState.gameRunning && !gameState.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, game.width, game.height);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.fillText("🎄 CHRISTMAS DINO 🎄", game.width / 2, game.height / 2 - 80);
        
        ctx.font = "24px 'Righteous', cursive";
        ctx.fillText("Make a FIST ✊ to JUMP!", game.width / 2, game.height / 2 + 20);
        ctx.fillText("Click to Start", game.width / 2, game.height / 2 + 60);
        ctx.textAlign = "left";
    }

    // Draw game over screen
    if (gameState.gameOver) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        ctx.fillRect(0, 0, game.width, game.height);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 60px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER 💀", game.width / 2, game.height / 2 - 60);

        ctx.font = "32px 'Righteous', cursive";
        ctx.fillText(`Final Score: ${gameState.score}`, game.width / 2, game.height / 2 + 20);
        ctx.fillText(`Best: ${gameState.bestScore}`, game.width / 2, game.height / 2 + 60);

        ctx.font = "24px 'Righteous', cursive";
        ctx.fillText("Click to Restart", game.width / 2, game.height / 2 + 100);
        ctx.textAlign = "left";
    }
}

// Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start game on click
game.addEventListener('click', () => {
    if (!gameState.gameRunning) {
        resetGame();
    }
});

// Initialize
bestDisplay.textContent = gameState.bestScore;
updateLivesDisplay();
requestAnimationFrame(gameLoop);

