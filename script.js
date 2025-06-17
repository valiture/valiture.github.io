//initialize
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//player character and keys/movement
const player = {
    x: (canvas.clientWidth / 2), y: (canvas.clientHeight / 2),
    width: 30, height: 30,
    color: 'blue',
    speed: 3,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
};

const keys = {
    ArrowUp: false, ArrowDown: false,
    ArrowLeft: false, ArrowRight: false
};
document.addEventListener('keydown', (e) => { keys[e.key] = true })
document.addEventListener('keyup', (e) => { keys[e.key] = false })

function updatePlayer() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;

    if (player.x + player.width < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = -player.width;
    }
    if (player.y + player.height < 0) {
        player.y = canvas.height;
    } else if (player.y > canvas.height) {
        player.y = -player.height;
    }

}

//create enemy - spawn enemy ever 2 seconds - add collision
function createEnemy() {
    const size = 30;
    const buffer = 20; // so they dont spawn immediately at the border
    let x, y

    //make them spawn in any side
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: //left
            x = -buffer;
            y = Math.random() * canvas.height;
            break;
        case 1: //right
            x = canvas.width + buffer;
            y = Math.random() * canvas.height;
            break;
        case 2: //up
            x = Math.random() * canvas.width;
            y = -buffer;
            break;
        case 3: //down
            x = Math.random() * canvas.width;
            y = canvas.height + buffer;
    }

    return {
        x,
        y,
        width: size,
        height: size,
        color: "black",
        speed: 2.5,
        health: 50
    };
}

//enemy array will probably use to make a counter for number of enemies
const enemies = [];

/*create enemy ever 2 seconds 
TODO: Make enemy spawns double every minute*/
setInterval(() => {
    if(!isPaused && !isGameOver) {
        enemies.push(createEnemy());
    }
}, 2000);

function updateEnemy() {
    for (const enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (distance !== 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }

        //remove health if touch player
        if (isColliding(enemy, player)) {
            player.health -= 1;
        }
    }
}

function isColliding(a, b) {
    return (
        //check if their coordinates allign in any way
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function resolveEnemyCollisions() {
    //compare all enemies 
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            const a = enemies[i];
            const b = enemies[j];

            if (isColliding(a, b)) {
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                let dist = Math.hypot(dx, dy);

                //fallback for when theyre touching > equals 0 > divide by zero > NaN > game freezes
                if (dist === 0) {
                    //move them in a random location
                    dx = Math.random() - 0.5;
                    dy = Math.random() - 0.5;
                    dist = Math.hypot(dx, dy);
                }

                //calculate the overlap and how much the cubes need to be pushed
                const minDist = (a.width + b.width) / 2;
                const overlap = minDist - dist;

                const pushX = (dx / dist) * (overlap / 2);
                const pushY = (dy / dist) * (overlap / 2);

                a.x -= pushX;
                a.y -= pushY;
                b.x += pushX;
                b.y += pushY;
            }
        }
    }
}

function createXP(x, y, amount) {
    return {
        x,
        y,
        width: 20,
        height: 30,
        color: "green",
        amount,
        speed: 1.5
    }
}
const xpOrbs = [];

function updateXpOrbs() {
    for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const orb = xpOrbs[i];
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 100) {
            orb.x += (dx / dist) * orb.speed;
            orb.y += (dy / dist) * orb.speed;
        }

        if (isColliding(orb, player)) {
            player.xp += orb.amount;
            xpOrbs.splice(i, 1);

            if (player.xp >= player.xpToNextLevel) {
                player.xp -= player.xpToNextLevel;
                player.level += 1;
                player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.25);
                //xp bonus here
            }
        }
    }
}
//bullet array
const bullets = [];

function fireBullet() {
    if (enemies.length == 0) return;

    //find nearest enemy
    let nearest = 0;
    let shortestDist = Infinity;

    for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < shortestDist) {
            shortestDist = dist;
            nearest = enemy;
        }
    }

    if (nearest) {
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        const dist = Math.hypot(dx, dy);

        bullets.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 5,
            height: 5,
            color: "red",
            speed: 6,
            dx: (dx / dist),
            dy: (dy / dist)

        });
    }
}
setInterval(() => {
    fireBullet();
}, 500);

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;

        //remove offscreen bullets
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (isColliding(b, e)) {
                e.health -= 20;
                bullets.splice(i, 1);
                if (e.health <= 0) {
                    enemies.splice(j, 1);
                    enemiesKilled += 1;

                    xpOrbs.push(createXP(e.x + e.width / 2, e.y + e.height / 2, 25));
                }
                break;
            }
        }
    }
}
function drawHealthBar(x, y, width, height, health, maxHealth) {
    const ratio = Math.max(health / maxHealth, 0); // avoid negative

    // Background (red)
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, width, height);

    // Foreground (green)
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(x, y, width * ratio, height);
}
function drawXPBar() {
    const barWidth = 200;
    const barHeight = 12;
    const x = 10;
    const y = canvas.height - barHeight - 10;
    const ratio = player.xp / player.xpToNextLevel;

    // Background
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Fill
    ctx.fillStyle = 'cyan';
    ctx.fillRect(x, y, barWidth * ratio, barHeight);

    // Text
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.fillText(`Level ${player.level}`, x + 5, y + barHeight - 2);
}

let isPaused = false;
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'Escape') {
        isPaused = !isPaused;
        togglePauseMenu(isPaused);
    }
});
function togglePauseMenu(show) {
    const menu = document.getElementById("pauseMenu");
    menu.style.display = show ? "block" : "none";
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    drawHealthBar(player.x, player.y - 10, player.width, 6, player.health, 100);
    drawXPBar();

    for (const enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        drawHealthBar(enemy.x, enemy.y - 6, enemy.width, 4, enemy.health, 50);
    }
    for (const b of bullets) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    for (const orb of xpOrbs) {
        ctx.fillStyle = orb.color;
        ctx.fillRect(orb.x, orb.y, orb.width, orb.height);
    }
}

let enemiesKilled = 0;
let startTime = Date.now();
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateStatsDisplay() {
    const statsDiv = document.getElementById("gameStats");
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    statsDiv.innerHTML = `
      <strong>Player Stats</strong><br>
        Health: ${player.health} / 100<br>
        Speed: ${player.speed}<br>
        Bullet Damage: 50<br>
        Health Regen: (coming soon)<br>
        Enemies Killed: ${enemiesKilled}<br>
        Time Elapsed: ${formatTime(elapsedTime)}
    `;
}

let isGameOver = false;

function loop() {
    let elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    if (isGameOver) return;

    if (!isPaused) {
        updateEnemy();
        updateBullets();
        updatePlayer();
        updateXpOrbs();
        resolveEnemyCollisions();
        draw();
        updateStatsDisplay();


        if (player.health == 0) {
            alert("Game Over!");
            isGameOver = true;
            document.getElementById("restartButton").style.display = "inline-block";
            return;
        }
    }
        requestAnimationFrame(loop);
    }


document.getElementById("restartButton").addEventListener("click", () => {
    // Reset player
    player.health = 100;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Reset game state
    enemies.length = 0;
    bullets.length = 0;
    enemiesKilled = 0;
    isGameOver = false;

    // Hide restart button
    document.getElementById("restartButton").style.display = "none";

    // Restart game loop
    requestAnimationFrame(loop);
});


loop();

/*TODO:
Make enemies drop XP 
> Add upgrades / XP gauge
Make player weapons
Make menu and pause
Stat display (enemy kills, enemy num, xp gauge)

Make multiple players
Make more diverse enemies
Add textures

*/ 
