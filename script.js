const celloSuite = new Audio("sfx/cello suite.mp3");

let animatonFrameId = 0;
//initialize
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let elapsedMinutes = 0;
let lastEnemySpawnTime = 0;
let enemyHealth = 50;

let playerDefaultSpeed = 3;
let playerDefaultHealth = 100;
let playerDefaultHealthRegen = 0.2;
let playerDefaultDamage = 20;
//player character and keys/movement
const player = {
    x: (canvas.clientWidth / 2), y: (canvas.clientHeight / 2),
    width: 30, height: 30,
    color: 'blue',
    speed: 3,
    health: 100,
    gold: 0,
    maxHealth: 100,
    healthRegen: 0.2,
    attackSpeed: 500,
    bulletDamage: 20
};
setInterval(() => {
    if (!isPaused && !isGameOver && player.health < player.maxHealth) {
        player.health = Math.min(player.health + player.healthRegen, player.maxHealth);
        player.health = Math.round(player.health * 10) / 10; // keep 1 decimal place
    }
}, 1000);



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
        health: enemyHealth
    };
}

//count minutes
setInterval(() => {
    if (!isPaused && !isGameOver) {
        elapsedMinutes++;
        if (enemyHealth < 250) {
            enemyHealth += 30;
        }
        console.log(enemyHealth);
    }
}, 60000); // 1 minute

//enemy array will probably use to make a counter for number of enemies
const enemies = [];
//create enemy every 2 seconds 
function updateEnemy() {
    for (const enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (distance !== 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
            /*
            dx/dist ensures that it works properly ex.:
            
            dx = 50
            dy = 30
            Math.hypot(dx, dy) = sqrt(50^2 + 30^2) = 58.31
            dx/dist = 50 / 58.31 = 0.857
            dy/dist = 30 / 58.31 = 0.514

            dx = 47
            dy = 28  ! change has to be roughly proportional
            sqrt(47^2 + 28^2) = 54.70
            dx/dist = 47 / 54.70 = 0.859    !roughly the same 
            dy/dist = 0.512

            if no dx/dist: 
            dx * gold.speed
            dx ≈ 0 => gold.speed ≈ 0
            */
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

//add collision between all enemies so they dont pile on top of eachother
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

                //fallback for when theyre touching: coordinate equals 0 = divide by zero = NaN = game freezes
                if (dist === 0) {
                    //move them in a random direction as a fix
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

function createGold(x, y) {
    return {
        x,
        y,
        width: 10,
        height: 20,
        color: "gold",
        speed: 1.5
    }
}
const goldCoins = [];
function updateGold() {
    for (let i = goldCoins.length - 1; i >= 0; i--) {
        const gold = goldCoins[i];
        const dx = player.x - gold.x;
        const dy = player.y - gold.y;
        const dist = Math.hypot(dx, dy);

        //magnet so they fly towards you when your close enough
        if (dist < 100) {
            gold.x += (dx / dist) * gold.speed;
            gold.y += (dy / dist) * gold.speed;
        }

        if (isColliding(gold, player)) {
            player.gold += 1;
            goldCoins.splice(i, 1);
        }

    }
}
const menuOpenAudio = new Audio("sfx/menuOpen.wav");
//add upgrade menu when m is pressed isUpgrading is declared to pause the game
let isUpgrading = false;
document.addEventListener('keydown', (e) => {
    if (e.key === "m" || e.key === "M") {
        const menu = document.getElementById("upgradeMenu");
        const isVisible = menu.style.display === "flex";
        toggleUpgradeMenu(!isVisible);
        menuOpenAudio.play();
        celloSuite.play();
    }
});

function toggleUpgradeMenu(show) {
    const menu = document.getElementById("upgradeMenu");
    //diplay either flex or none depending on show (true or false)
    menu.style.display = show ? "flex" : "none";
    isUpgrading = show;
}

//upgrade buttons in the menu
let upgradeHealth = document.getElementById("upgradeHealth");
let healthGoldRequired = 5;
let healthAdded = Math.ceil(player.maxHealth * 0.2);
document.getElementById("healthUpgradeInfo").innerHTML = `Gold Cost: ${healthGoldRequired} /
HP: ${player.maxHealth} => ${(player.maxHealth + healthAdded)}`;
function updateHealth() {
    if (player.gold >= healthGoldRequired) {
        player.gold -= healthGoldRequired;
        player.health += healthAdded;
        player.maxHealth += healthAdded;
        healthGoldRequired = Math.ceil(healthGoldRequired * 1.2);

        document.getElementById("healthUpgradeInfo").innerHTML = `Gold Cost: ${healthGoldRequired} /
        HP: ${player.maxHealth} => ${(player.maxHealth + healthAdded)}`;
    }
}

let upgradeAttack = document.getElementById("upgradeAttack");
let attackGoldRequired = 5;
let attackAdded = 10;
document.getElementById("attackUpgradeInfo").innerHTML = `Gold Cost: ${attackGoldRequired} /
Damage: ${player.bulletDamage} => ${(player.bulletDamage + attackAdded)}`;
function updateAttack() {
    if (player.gold >= attackGoldRequired) {
        player.gold -= attackGoldRequired;
        player.bulletDamage += attackAdded;
        attackGoldRequired = Math.ceil(attackGoldRequired * 1.2);

        document.getElementById("attackUpgradeInfo").innerHTML = `Gold Cost: ${attackGoldRequired} /
        Damage: ${player.bulletDamage} => ${((player.bulletDamage + attackAdded))}`;
    }
}

let upgradeSpeed = document.getElementById("upgradeSpeed");
let speedGoldRequired = 5;
let speedAdded = player.speed * 0.1;
let attackSpeedAdded = Math.ceil(player.attackSpeed * 0.1);
document.getElementById("speedUpgradeInfo").innerHTML = `Gold Cost: ${speedGoldRequired} /
Speed: ${player.speed.toFixed(1)} => ${(player.speed + speedAdded).toFixed(1)} / 
Attack Speed: ${(player.attackSpeed / 1000)}/s => ${((player.attackSpeed + attackSpeedAdded) / 1000)}/s`;
function updateSpeed() {
    if (player.gold >= speedGoldRequired) {
        player.gold -= speedGoldRequired;
        player.speed += speedAdded;
        player.attackSpeed -= attackSpeedAdded;
        speedGoldRequired = Math.ceil(speedGoldRequired * 1.2);

        document.getElementById("speedUpgradeInfo").innerHTML = `Gold Cost: ${speedGoldRequired} /
        Speed: ${player.speed.toFixed(1)} => ${(player.speed + speedAdded).toFixed(1)} / 
        Attack Speed: ${(player.attackSpeed / 1000)}/s => ${((player.attackSpeed + attackSpeedAdded) / 1000)}/s`;
    }
}

let upgradeHealthRegen = document.getElementById("upgradeHealthRegen");
let healthRegenGoldRequired = 5;
let healthRegenAdded = 0.1;
document.getElementById("healthRegenUpgradeInfo").innerHTML = `Gold Cost: ${healthRegenGoldRequired} /
Health Regen: ${player.healthRegen} => ${(player.healthRegen + healthRegenAdded).toFixed(1)}`;
function updateHealthRegen() {
    if (player.gold >= healthRegenGoldRequired) {
        player.gold -= healthRegenGoldRequired;
        player.healthRegen += healthRegenAdded;
        healthRegenGoldRequired = Math.ceil(health * 1.2);

        document.getElementById("healthRegenUpgradeInfo").innerHTML = `Gold Cost: ${healthRegenGoldRequired} /
        Health Regen: ${player.healthRegen} => ${(player.healthRegen + healthRegenAdded).toFixed(1)}`;
    }
}
//buttonevents
upgradeHealth.addEventListener('click', updateHealth);
upgradeAttack.addEventListener('click', updateAttack);
upgradeSpeed.addEventListener('click', updateSpeed);
upgradeHealthRegen.addEventListener('click', updateHealthRegen);


const bullets = [];
function fireBullet() {
    //dont shoot when there are no enemies
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
}, player.attackSpeed);

function updateBullets() {
    //get last object in array
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;

        //remove offscreen bullets
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        //hit enemy, do damage, remove enemy if killed, drop gold
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (isColliding(b, e)) {
                e.health -= player.bulletDamage;
                bullets.splice(i, 1);
                if (e.health <= 0) {
                    enemies.splice(j, 1);
                    enemiesKilled += 1;

                    goldCoins.push(createGold(e.x + e.width / 2, e.y + e.height / 2));
                }
                break;
            }
        }
    }
}
function drawHealthBar(x, y, width, height, health, maxHealth) {
    const ratio = Math.max(health / maxHealth, 0); // avoid negative

    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = 'limegreen';
    ctx.fillRect(x, y, width * ratio, height);
}


let isPaused = false;
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'Escape') {
        if (!isUpgrading) {
            document.getElementById("restartButton").style.display = 'inline-block';
            isPaused = !isPaused;
            togglePauseMenu(isPaused);
        }
    }
});
function togglePauseMenu(show) {
    const menu = document.getElementById("pauseMenu");
    menu.style.display = show ? "block" : "none";
}

celloSuite.onended = replaySong();
function replaySong() {
    celloSuite.play();
    console.log("song ended");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    drawHealthBar(player.x, player.y - 10, player.width, 6, player.health, player.maxHealth);
    statsDisplay();


    for (const enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        drawHealthBar(enemy.x, enemy.y - 6, enemy.width, 4, enemy.health, enemyHealth);
    }
    for (const b of bullets) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    for (const gold of goldCoins) {
        ctx.fillStyle = gold.color;
        ctx.fillRect(gold.x, gold.y, gold.width, gold.height);
    }

}

let enemiesKilled = 0;
let startTime = Date.now();
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function statsDisplay() {
    ctx.fillStyle = "black";
    ctx.font = "16px monospace"
    let x = 20;
    let y = 20;

    ctx.fillText(`Health: ${player.health} / ${player.maxHealth}`, x, y);
    ctx.fillText(`Speed: ${player.speed}`, x, y + 20);
    ctx.fillText(`Bullet Damage: ${player.bulletDamage || 50}`, x, y + 40);
    ctx.fillText(`Health Regen: ${player.healthRegen.toFixed(1)}/s`, x, y + 60)
    ctx.fillText(`Enemies Killed: ${enemiesKilled}`, x, y + 80);
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillText(`Time Elapsed: ${formatTime(elapsedTime)}`, x, y + 100);

    ctx.fillText(`Gold: ${player.gold}`, x, y + 120);

}

let isGameOver = false;

function loop() {
    let currentTime = Date.now();
    let elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    if (isGameOver) return;

    if (!isPaused && !isUpgrading) {
        const spawnDelay = Math.max(200, 2000 - (elapsedMinutes * 300));

        if (currentTime - lastEnemySpawnTime >= spawnDelay) {
            enemies.push(createEnemy());
            lastEnemySpawnTime = currentTime;
        }
        updateEnemy();
        updateBullets();
        updatePlayer();
        updateGold();
        resolveEnemyCollisions();
        draw();


        if (player.health <= 0) {
            document.getElementById("pauseMenuHeader").innerHTML = "Game Over!"
            document.getElementById("pauseMenuText").innerHTML = `Gold got: ${player.gold}`
            togglePauseMenu(true);
            isGameOver = true;
            return;
        } else {
            statsDisplay();
        }
    }
    animationFrameId = requestAnimationFrame(loop);
}


document.getElementById("restartButton").addEventListener("click", () => {
    // reset player
    player.health = 100;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.level = 1;
    player.gold = 0;
    player.bulletDamage = playerDefaultDamage;
    player.speed = playerDefaultSpeed;
    player.health = playerDefaultHealth;
    player.maxHealth = playerDefaultHealth;
    player.healthRegen = playerDefaultHealthRegen;
    startTime = Date.now();
    elapsedMinutes = 0;
    enemyHealth = 50;

    //reset game
    enemies.length = 0;
    bullets.length = 0;
    goldCoins.length = 0;
    enemiesKilled = 0;
    isGameOver = false;

    isPaused = false;
    document.getElementById("pauseMenu").style.display = 'none';
    document.getElementById("pauseMenuHeader").innerHTML = "Paused"
    document.getElementById("pauseMenuText").innerHTML = "Press ESC to resume"


    cancelAnimationFrame(animationFrameId);
    loop();
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
