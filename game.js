const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= SCREENS =================
const startScreen = document.getElementById("startScreen");
const difficultyScreen = document.getElementById("difficultyScreen");
const levelScreen = document.getElementById("levelScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const pauseScreen = document.getElementById("pauseScreen");
const retryScreen = document.getElementById("retryScreen");
const finalMessage = document.getElementById("finalMessage");

const playButton = document.getElementById("playButton");
const readyButton = document.getElementById("readyButton");
const retryButton = document.getElementById("retryButton");
const resumeButton = document.getElementById("resumeButton");
const exitButton = document.getElementById("exitButton");
const diffButtons = document.querySelectorAll(".diffBtn");
const levelButtons = document.getElementById("levelButtons");

// ================= IMÁGENES =================
const playerImg = new Image();
const nancyImg = new Image();
const heartImg = new Image();
const bombImg = new Image();
const cloudImg = new Image();
const bgImg = new Image();

playerImg.src = "chico.png";
nancyImg.src = "nancy.png";
heartImg.src = "corazon.png";
bombImg.src = "bomba.png";
cloudImg.src = "nube.png";
bgImg.src = "jardin.png";

let imagesLoaded = 0;
[playerImg, nancyImg, heartImg, bombImg, cloudImg, bgImg].forEach(img => img.onload = () => imagesLoaded++);

// ================= SONIDOS =================
const bgMusic = new Audio("musica.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;
const winSound = new Audio("win.mp3");

// ================= VARIABLES =================
let hearts = [];
let collected = 0;
let timeLeft = 45;
let playing = false;
let heartSpeed = 2;
let elevating = false;
let paused = false;
let level = 1;
let difficulty = "normal"; // fácil, normal, medio, difícil, impossible

let heartInterval = null;
let timeInterval = null;

// ================= JUGADOR & NUBE =================
const player = { x: 400, y: 500, w: 90, h: 90, speed: 9 }; // ↑ personaje más rápido
const cloud = { x: 300, y: 150, w: 300, h: 150 };

// ================= TECLAS =================
const keys = { left: false, right: false };

// ================= CONTROLES =================
document.addEventListener("keydown", e => {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space") togglePause();
});

document.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});

// ================= BOTONES =================
playButton.onclick = () => {
  startScreen.style.display = "none";
  difficultyScreen.style.display = "flex";
};

diffButtons.forEach(btn => {
  btn.onclick = () => {
    difficulty = btn.dataset.diff;
    heartSpeed = parseInt(btn.dataset.speed);
    difficultyScreen.style.display = "none";
    instructionsScreen.style.display = "flex";
  };
});

readyButton.onclick = () => {
  if (imagesLoaded < 6) {
    alert("Esperando a que se carguen las imágenes...");
    return;
  }
  instructionsScreen.style.display = "none";
  startLevel();
};

retryButton.onclick = () => {
  retryScreen.style.display = "none";
  difficultyScreen.style.display = "flex";
};

resumeButton.onclick = () => {
  pauseScreen.style.display = "none";
  paused = false;
  if (!elevating) requestAnimationFrame(draw);
};

exitButton.onclick = () => {
  pauseScreen.style.display = "none";
  playing = false;
  elevating = false;
  canvas.style.display = "none";
  bgMusic.pause();
  startScreen.style.display = "flex";
};

// ================= PAUSA =================
function togglePause() {
  paused = !paused;
  if (paused) pauseScreen.style.display = "flex";
  else {
    pauseScreen.style.display = "none";
    requestAnimationFrame(draw);
  }
}

// ================= NIVELES =================
function startLevel() {
  levelScreen.style.display = "flex";
  levelButtons.innerHTML = "";
  let maxLevel = 5;
  for (let i = 1; i <= maxLevel; i++) {
    let b = document.createElement("button");
    b.textContent = `Nivel ${i}`;
    b.onclick = () => {
      level = i;
      levelScreen.style.display = "none";
      canvas.style.display = "block";
      startGame();
    };
    levelButtons.appendChild(b);
  }
}

// ================= JUEGO =================
function startGame() {
  hearts = [];
  collected = 0;
  timeLeft = 45;
  playing = true;
  elevating = false;
  paused = false;

  clearInterval(heartInterval);
  clearInterval(timeInterval);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // música al iniciar
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});

  // Ajustes de velocidad y probabilidad de bombas
  let speedMultiplier = 1;
  let bombMultiplier = 0.1;
  switch (difficulty) {
    case "fácil": speedMultiplier = 0.9; bombMultiplier = 0.05; break;
    case "normal": speedMultiplier = 1; bombMultiplier = 0.1; break;
    case "medio": speedMultiplier = 1.2; bombMultiplier = 0.15; break;
    case "difícil": speedMultiplier = 1.5; bombMultiplier = 0.25; break;
    case "impossible": speedMultiplier = 2; bombMultiplier = 0.35; break;
  }

  heartInterval = setInterval(() => {
    if (!paused && !elevating) {
      let chance = Math.min(bombMultiplier + level * 0.05, 0.5);
      let isBomb = Math.random() < chance;

      hearts.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        speed: (heartSpeed + level * 0.5) * speedMultiplier,
        sway: Math.random() * 2 - 1,
        bomb: isBomb
      });
    }
  }, 500);

  timeInterval = setInterval(() => {
    if (!paused) {
      timeLeft--;
      if (timeLeft <= 0) endGame(false);
    }
  }, 1000);

  requestAnimationFrame(draw);
}

// ================= DIBUJO =================
let cloudOffset = 0;
let cloudDirection = 0.3;

function draw() {
  if (!playing || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Movimiento jugador continuo
  if (!paused && !elevating) {
    if (keys.left) { player.x -= player.speed; if (player.x < 0) player.x = 0; }
    if (keys.right) { player.x += player.speed; if (player.x + player.w > canvas.width) player.x = canvas.width - player.w; }
  }

  // Nube flotante
  cloudOffset += cloudDirection;
  if (cloudOffset > 10 || cloudOffset < -10) cloudDirection *= -1;

  // Elevación de Nancy
  if (elevating) {
    ctx.drawImage(cloudImg, cloud.x, cloud.y + cloudOffset, cloud.w, cloud.h);
    ctx.drawImage(nancyImg, cloud.x + 110, cloud.y - 10 + cloudOffset, 90, 90);
  }

  // Jugador
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Corazones y bombas
  if (!elevating) {
    hearts.forEach((h, i) => {
      h.y += h.speed;
      h.x += Math.sin(h.y / 20) * 1.5;
      if (h.bomb) ctx.drawImage(bombImg, h.x, h.y, 30, 30);
      else ctx.drawImage(heartImg, h.x, h.y, 30, 30);

      // Colisiones
      if (h.x < player.x + player.w && h.x + 30 > player.x && h.y < player.y + player.h && h.y + 30 > player.y) {
        hearts.splice(i, 1);
        if (h.bomb) endGame(false, true); // ← cambio de mensaje
        else collected++;
        if (collected >= 30) startElevate();
      }
    });
  } else {
    if (player.y > cloud.y + 50 + cloudOffset) player.y -= 3;
    else endGame(true);
  }

  // HUD
  if (!elevating) {
    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.fillText(`⏰ ${timeLeft}s`, 10, 25);
    ctx.fillText(`❤️ ${collected}/30`, 10, 50);
  }

  requestAnimationFrame(draw);
}

// ================= ELEVACIÓN =================
function startElevate() {
  elevating = true;
  hearts = [];
}

// ================= FIN =================
function endGame(win, byBomb = false) {
  playing = false;
  elevating = false;
  paused = false;
  clearInterval(heartInterval);
  clearInterval(timeInterval);
  bgMusic.pause();

  canvas.style.display = "none";
  retryScreen.style.display = "flex";

  if (win) {
    winSound.play();
    finalMessage.innerHTML = "Felicidades, Campeón 💖<br>¡Llegaste a la nube y encontraste a Nancy!<br>Este juego es solo una excusa para decirte que te amo Daniel<br>De Nancy ❤️";
  } else if (byBomb) {
    finalMessage.innerHTML = "💥 Has sido explotado por la bomba 💥<br>Tranquilo amor, vuelve a intentarlo de nuevo 💕";
  } else {
    finalMessage.innerHTML = "Te quedaste sin tiempo amor 💔<br>Tranquilo, vuelve a intentarlo 💕";
  }

  player.y = 500;
}
