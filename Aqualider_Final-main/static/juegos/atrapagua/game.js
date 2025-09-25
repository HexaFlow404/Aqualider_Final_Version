// Espera a que el DOM esté completamente cargado para iniciar el juego.
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================== //
    //                          1. CONFIGURACIÓN INICIAL                           //
    // =========================================================================== //

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const SCREEN_WIDTH = canvas.width;
    const SCREEN_HEIGHT = canvas.height;
    const HIGH_SCORE_KEY = "high_scores_agua_limpia";

    // --- Colores ---
    const WHITE = "rgb(255, 255, 255)";
    const BLACK = "rgb(0, 0, 0)";
    const RED = "rgb(231, 76, 60)";
    const BLUE = "rgb(52, 152, 219)";
    const YELLOW = "rgb(241, 196, 15)";
    const SKY_LIGHT = "rgb(135, 206, 235)";
    const SKY_DARK = "rgb(0, 119, 190)";
    const CLOUD_COLOR_LIGHT = "rgb(240, 240, 240)";
    const GREY = "rgba(50, 50, 50, 0.7)";

    // --- Variables Globales del Juego ---
    let gameState = "LOADING";
    let selectedLevel = 0;
    let score = 0;
    let lives = 3;
    let currentSpeed = 3.0;
    let powerupActive = null;
    let powerupTimer = 0;
    const POWERUP_DURATION = 7 * 1000;

    let highScores = [0, 0, 0];
    let player;
    let fallingObjects = [];
    let effects = [];
    let keys = {};
    let mousePos = { x: 0, y: 0 };
    let lastObjectSpawn = 0;
    let spawnDelay = 1000;

    const LEVELS = [
        { name: "Fácil", initial_speed: 3.5, spawn_delay: 800 },
        { name: "Normal", initial_speed: 4.5, spawn_delay: 500 },
        { name: "Difícil", initial_speed: 6.5, spawn_delay: 300 },
    ];

    let clouds = [];
    const NUM_CLOUDS = 8;
    function createClouds() {
        for (let i = 0; i < NUM_CLOUDS; i++) {
            let cloud = {
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT * 0.7,
                size: 60 + Math.random() * 80,
                speed: 0.2 + Math.random() * 0.5,
                shape: []
            };
            const numSegments = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numSegments; j++) {
                cloud.shape.push({
                    dx: (Math.random() - 0.5) * cloud.size * 0.8,
                    dy: (Math.random() - 0.5) * cloud.size * 0.4,
                    radius: cloud.size * (0.4 + Math.random() * 0.4)
                });
            }
            clouds.push(cloud);
        }
    }


    // =========================================================================== //
    //                            2. CARGA DE RECURSOS                             //
    // =========================================================================== //

    const assets = {};
    // ... dentro de game.js
const assetSources = {
    images: {
        player: '/static/juegos/atrapagua/assets/bucket.png',
        player_2_lives: '/static/juegos/atrapagua/assets/bucket_2_lives.png',
        player_1_life: '/static/juegos/atrapagua/assets/bucket_1_life.png',
        water: '/static/juegos/atrapagua/assets/water_drop.png', 
        trash: '/static/juegos/atrapagua/assets/trash.png',
        splash: '/static/juegos/atrapagua/assets/splash_effect.png', 
        powerup_2x: '/static/juegos/atrapagua/assets/powerup_2x.png',
        powerup_slow: '/static/juegos/atrapagua/assets/powerup_slow.png', 
        powerup_shield: '/static/juegos/atrapagua/assets/powerup_shield.png',
    },
    sounds: {
        collect_water: '/static/juegos/atrapagua/assets/collect_water.wav', 
        lose_life: '/static/juegos/atrapagua/assets/lose_life.wav',
        game_over: '/static/juegos/atrapagua/assets/game_over.wav', 
        powerup: '/static/juegos/atrapagua/assets/powerup.wav',
        menu_select: '/static/juegos/atrapagua/assets/menu_select.wav',
        background_music: '/static/juegos/atrapagua/assets/musica_fondo.mp3'
    }
};
// ...

    function loadAssets() {
        let promises = [];
        for (const key in assetSources.images) {
            promises.push(new Promise((resolve) => {
                const img = new Image(); img.src = assetSources.images[key];
                img.onload = () => { assets[key] = img; resolve(); };
            }));
        }
        for (const key in assetSources.sounds) {
            promises.push(new Promise((resolve) => {
                const audio = new Audio(); audio.src = assetSources.sounds[key];
                audio.oncanplaythrough = () => { assets[key] = audio; resolve(); };
                audio.onerror = () => { console.warn(`Sound failed to load: ${assetSources.sounds[key]}`); resolve(); }
            }));
        }
        return Promise.all(promises);
    }
    
    function playSound(soundName) {
        if (assets[soundName]) {
            assets[soundName].currentTime = 0;
            assets[soundName].volume = 0.4;
            assets[soundName].play().catch(e => console.warn("Audio play failed", e));
        }
    }

    function playMusic(soundName) {
        if (assets[soundName]) {
            assets[soundName].loop = true;
            assets[soundName].volume = 0.7;
            assets[soundName].play().catch(e => console.warn("La música no pudo iniciarse", e));
        }
    }

    function stopMusic(soundName) {
        if (assets[soundName]) {
            assets[soundName].pause();
            assets[soundName].currentTime = 0;
        }
    }

    function loadHighScores() {
        const storedScores = localStorage.getItem(HIGH_SCORE_KEY);
        if (storedScores) { highScores = JSON.parse(storedScores); }
    }

    function saveHighScores() {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));
    }


    // =========================================================================== //
    //                            3. CLASES DEL JUEGO                              //
    // =========================================================================== //
    
    class Button {
        constructor(text, centerX, centerY, font, padding = {x: 25, y: 20}) {
            this.text = text; this.font = font; this.x = centerX; this.y = centerY;
            ctx.font = this.font;
            const textMetrics = ctx.measureText(this.text);
            const textHeight = parseInt(this.font, 10);
            this.width = textMetrics.width + 2 * padding.x;
            this.height = textHeight + 2 * padding.y;
            this.rect = { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
            this.isHovered = false;
        }
        draw(ctx, bgColor, hoverColor, textColor) {
            ctx.fillStyle = this.isHovered ? hoverColor : bgColor;
            ctx.beginPath();
            ctx.roundRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height, 10);
            ctx.fill();
            const textY = this.y + (parseInt(this.font, 10) / 3);
            drawText(this.text, this.x, textY, this.font, textColor, 'center');
        }
        checkHover(mousePosition) {
             this.isHovered = mousePosition.x >= this.rect.x && mousePosition.x <= this.rect.x + this.rect.width &&
                             mousePosition.y >= this.rect.y && mousePosition.y <= this.rect.y + this.rect.height;
        }
    }
    
    class Player {
        constructor() { this.width = 100; this.height = 100; this.x = (SCREEN_WIDTH / 2) - (this.width / 2); this.y = SCREEN_HEIGHT - this.height - 20; this.speed = 10; this.wobbleAngle = 0; this.wobbleSpeed = 15; this.angle = 0; this.shieldActive = false; }
        update() { let moved = false; if (keys['ArrowLeft'] || keys['a']) { this.x -= this.speed; this.wobbleAngle += this.wobbleSpeed; moved = true; } if (keys['ArrowRight'] || keys['d']) { this.x += this.speed; this.wobbleAngle -= this.wobbleSpeed; moved = true; } if (moved) { this.angle = Math.sin(this.wobbleAngle * Math.PI / 180) * 10; } else { this.wobbleAngle = 0; this.angle = 0; } this.x = Math.max(0, Math.min(this.x, SCREEN_WIDTH - this.width)); }
        
        // ⭐ MÉTODO DRAW ACTUALIZADO
        draw() {
            let currentBucketImage;
            if (lives >= 3) {
                currentBucketImage = assets.player;
            } else if (lives === 2) {
                currentBucketImage = assets.player_2_lives;
            } else {
                currentBucketImage = assets.player_1_life;
            }

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.drawImage(currentBucketImage, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();

            if (this.shieldActive) {
                const shieldSize = 120;
                ctx.drawImage(assets.powerup_shield, this.x + (this.width - shieldSize)/2, this.y + (this.height - shieldSize)/2, shieldSize, shieldSize);
            }
        }
        getHitbox() { return { x: this.x + 15, y: this.y + 15, width: this.width - 30, height: this.height - 30 }; }
    }
    class FallingObject {
        constructor(type) { this.type = type; this.width = 50; this.height = 50; this.x = Math.random() * (SCREEN_WIDTH - this.width); this.y = -this.height - Math.random() * 100; switch (type) { case 'water': this.image = assets.water; break; case 'trash': this.image = assets.trash; break; case '2x': this.image = assets.powerup_2x; break; case 'slow': this.image = assets.powerup_slow; break; case 'shield': this.image = assets.powerup_shield; break; } }
        update(speed) { this.y += speed; }
        draw() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
    }
    class SplashEffect {
        constructor(x, y) { this.x = x - 30; this.y = y - 30; this.width = 60; this.height = 60; this.lifetime = 10; }
        update() { this.lifetime--; }
        draw() { ctx.globalAlpha = this.lifetime / 10; ctx.drawImage(assets.splash, this.x, this.y, this.width, this.height); ctx.globalAlpha = 1.0; }
    }

    const resumeButton = new Button("Reanudar", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 80, "40px Roboto");
    const restartButton = new Button("Reiniciar", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "40px Roboto");
    const menuButton = new Button("Menú Principal", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 80, "40px Roboto");
    const pauseButtons = [resumeButton, restartButton, menuButton];
    
    const levelButtons = [];
    LEVELS.forEach((level, i) => {
        const button = new Button(level.name, SCREEN_WIDTH / 2, 250 + i * 110, "45px Roboto");
        levelButtons.push(button);
    });

    // =========================================================================== //
    //                          4. FUNCIONES PRINCIPALES                           //
    // =========================================================================== //

    function drawText(text, x, y, font, color, align = 'center') {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    }
    
    function checkCollision(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }

    function startGame(levelIndex) {
        selectedLevel = levelIndex;
        const level = LEVELS[selectedLevel];
        score = 0; lives = 3;
        currentSpeed = level.initial_speed;
        spawnDelay = level.spawn_delay;
        fallingObjects = []; effects = [];
        player = new Player();
        powerupActive = null;
        gameState = "PLAYING";
        playMusic('background_music');
    }

    function resetToMenu() {
        gameState = "LEVEL_SELECT";
        playSound('menu_select');
        stopMusic('background_music');
    }

    function updateGame(timestamp) {
        player.update();
        let effectiveSpeed = currentSpeed;
        if (powerupActive === 'slow') { effectiveSpeed *= 0.5; }
        fallingObjects.forEach(obj => obj.update(effectiveSpeed));
        fallingObjects = fallingObjects.filter(obj => obj.y < SCREEN_HEIGHT);
        effects.forEach(effect => effect.update());
        effects = effects.filter(effect => effect.lifetime > 0);

        if (timestamp - lastObjectSpawn > spawnDelay) {
            lastObjectSpawn = timestamp;
            const spawnRoll = Math.random();
            let newObjType;
            if (spawnRoll < 0.03) { newObjType = ['2x', 'slow', 'shield'][Math.floor(Math.random() * 3)]; } 
            else if (spawnRoll < 0.33) { newObjType = 'trash'; } 
            else { newObjType = 'water'; }
            fallingObjects.push(new FallingObject(newObjType));
        }

        const playerHitbox = player.getHitbox();
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];
            if (checkCollision(playerHitbox, obj)) {
                if (obj.type === 'water') {
                    score += (powerupActive === '2x' ? 2 : 1);
                    playSound('collect_water');
                    effects.push(new SplashEffect(obj.x + obj.width / 2, obj.y + obj.height / 2));
                } else if (obj.type === 'trash') {
                    if (player.shieldActive) { player.shieldActive = false; } 
                    else { lives--; playSound('lose_life'); }
                } else {
                    playSound('powerup');
                    if (obj.type === 'shield') { player.shieldActive = true; } 
                    else { powerupActive = obj.type; powerupTimer = timestamp + POWERUP_DURATION; }
                }
                fallingObjects.splice(i, 1);
            }
        }
        if (powerupActive && timestamp > powerupTimer) { powerupActive = null; }
        if (lives <= 0) {
            playSound('game_over');
            stopMusic('background_music');
            if (score > highScores[selectedLevel]) {
                highScores[selectedLevel] = score;
                saveHighScores();
            }
            gameState = "GAME_OVER";
        }
        
        clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > SCREEN_WIDTH + cloud.size * 2) {
                cloud.x = -cloud.size * 2;
                cloud.y = Math.random() * SCREEN_HEIGHT * 0.7;
            }
        });
    }

    function drawBackground() {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        skyGradient.addColorStop(0, SKY_LIGHT);
        skyGradient.addColorStop(1, SKY_DARK);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        clouds.forEach(cloud => {
            ctx.fillStyle = CLOUD_COLOR_LIGHT;
            ctx.beginPath();
            cloud.shape.forEach(segment => {
                ctx.moveTo(cloud.x + segment.dx, cloud.y + segment.dy);
                ctx.arc(cloud.x + segment.dx, cloud.y + segment.dy, segment.radius, 0, Math.PI * 2);
            });
            ctx.closePath();
            ctx.fill();
        });
    }
    
    function drawGame() { 
        player.draw(); 
        fallingObjects.forEach(obj => obj.draw()); 
        effects.forEach(effect => effect.draw()); 
        drawText(`Puntaje: ${score}`, 10, 50, "40px Roboto", WHITE, 'left'); 
        drawText(`Vidas: ${lives}`, SCREEN_WIDTH - 10, 50, "40px Roboto", RED, 'right'); 
        if (powerupActive) { const remainingTime = powerupTimer - performance.now(); const barWidth = 200; const fillWidth = (remainingTime / POWERUP_DURATION) * barWidth; const text = powerupActive === '2x' ? "¡DOBLE PUNTOS!" : "¡CÁMARA LENTA!"; drawText(text, SCREEN_WIDTH / 2, 40, "28px Roboto", YELLOW); ctx.strokeStyle = WHITE; ctx.strokeRect(SCREEN_WIDTH / 2 - barWidth / 2, 60, barWidth, 20); ctx.fillStyle = YELLOW; ctx.fillRect(SCREEN_WIDTH / 2 - barWidth / 2, 60, fillWidth, 20); } 
    }

    function drawMenu() {
        drawText("Selecciona un Nivel", SCREEN_WIDTH / 2, 100, "60px Roboto", WHITE);
        levelButtons.forEach((button, i) => {
            button.checkHover(mousePos);
            button.draw(ctx, BLUE, YELLOW, WHITE);
            const recordColor = button.isHovered ? YELLOW : WHITE;
            drawText(`Récord: ${highScores[i]}`, SCREEN_WIDTH / 2, button.y + 55, "30px Roboto", recordColor);
        });
        drawText("Haz clic en un nivel para empezar", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 100, "30px Roboto", WHITE);
    }
    
    function drawPauseScreen() {
        drawGame();
        ctx.fillStyle = GREY;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        drawText("PAUSA", SCREEN_WIDTH / 2, 150, "70px Roboto", WHITE);
        pauseButtons.forEach(button => {
            button.checkHover(mousePos);
            button.draw(ctx, BLUE, YELLOW, WHITE);
        });
    }
    
    function drawGameOverScreen() { 
        ctx.fillStyle = GREY;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        drawText("GAME OVER", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, "60px Roboto", RED); drawText(`Puntaje: ${score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "40px Roboto", WHITE); drawText(`Récord del Nivel: ${highScores[selectedLevel]}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50, "30px Roboto", YELLOW); drawText("Haz clic para continuar", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 150, "30px Roboto", WHITE); 
    }
    function drawLoadingScreen() { 
        ctx.fillStyle = SKY_LIGHT;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        drawText("Cargando...", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "40px Roboto", WHITE); 
    }


    // =========================================================================== //
    //                             5. BUCLE PRINCIPAL                              //
    // =========================================================================== //

    function gameLoop(timestamp) {
        drawBackground();
        switch(gameState) {
            case "LOADING": drawLoadingScreen(); break;
            case "LEVEL_SELECT": drawMenu(); break;
            case "PLAYING": updateGame(timestamp); drawGame(); break;
            case "PAUSED": drawPauseScreen(); break;
            case "GAME_OVER": drawGameOverScreen(); break;
        }
        requestAnimationFrame(gameLoop);
    }

    // --- Manejo de Eventos (Input) ---
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (gameState === "PLAYING" && (e.key === 'Escape' || e.key === 'p')) { gameState = "PAUSED"; playSound('menu_select'); } 
        else if (gameState === "PAUSED" && (e.key === 'Escape' || e.key === 'p')) { gameState = "PLAYING"; playSound('menu_select'); } 
        else if (gameState === "GAME_OVER" && e.key === 'Enter') { resetToMenu(); }
    });

    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (gameState === "LEVEL_SELECT") {
            levelButtons.forEach((button, i) => {
                if (button.isHovered) { playSound('menu_select'); startGame(i); }
            });
        } else if (gameState === "PAUSED") {
            if (resumeButton.isHovered) { gameState = "PLAYING"; playSound('menu_select'); }
            if (restartButton.isHovered) { startGame(selectedLevel); playSound('menu_select'); }
            if (menuButton.isHovered) { resetToMenu(); }
        } else if (gameState === "GAME_OVER") {
             resetToMenu();
        }
    });

    // --- Iniciar el Juego ---
    createClouds();
    loadHighScores();
    loadAssets().then(() => {
        gameState = "LEVEL_SELECT";
        requestAnimationFrame(gameLoop);
    });
});