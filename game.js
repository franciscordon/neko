const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.imageSmoothingEnabled = false;

const GROUND_Y = 414;
const GRAVITY = 1300;
const JUMP_VELOCITY = -560;

const keys = { left: false, right: false };
const isMobileLike = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches;

canvas.style.touchAction = "none";

const neko = {
  x: canvas.width * 0.5,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  facing: 1,
  maxSpeed: 220,
  accel: 1300,
  decel: 1800,
  walkTime: 0,
};

const sprite = {
  frames: [],
  jumpFrames: [],
  ready: false,
  drawScale: 0.58,
};

const pixelPalette = {
  ".": null,
  t: "#203124",
  T: "#2e4b36",
  l: "#5d7f5e",
  h: "#5f3f3a",
  H: "#7b4f47",
  r: "#8b6761",
  w: "#d5b88b",
  d: "#6f483d",
  o: "#b97a52",
};

const treeSprite = [
  "......tt......",
  ".....tTTt.....",
  "....tTTTTt....",
  "...tTTTTTTt...",
  "..tTTTTTTTTt..",
  "...tTTTTTTt...",
  "....tTTTTt....",
  ".....tttt.....",
  "......dd......",
  "......dd......",
  "......dd......",
  ".....dddd.....",
];

const houseSprite = [
  "........dd..........",
  "........dd..........",
  ".......dddd.........",
  "......rrrrrr........",
  ".....rrrrrrrr.......",
  "....rrrHHHHrrr......",
  "...rrrHHHHHHrrr.....",
  "..rrrHHHHHHHHrrr....",
  ".rrrHHHHHHHHHHrrr...",
  ".rHHHHHHHHHHHHHHr...",
  ".rHwwwwHHHHwwwwHr...",
  ".rHwwwwHddHwwwwHr...",
  ".rHHHHHHddHHHHHHr...",
  ".rHwoooHooHoooHHr...",
  ".rHwoooHooHoooHHr...",
  ".rHHHHHHHHHHHHHHr...",
  ".hhhhhhhhhhhhhhhh...",
  "..oooooooooooooooo..",
];

const WORLD_SCREENS = [
  {
    skyTop: "#8b8f9d",
    skyMid: "#afb0b8",
    skyBottom: "#c1c1c7",
    glowA: "rgba(241, 184, 177, 0.68)",
    glowB: "rgba(230, 170, 165, 0.30)",
    items: [
      { type: "tree", x: 40, y: 255, scale: 5 },
      { type: "house", x: 150, y: 238, scale: 5 },
      { type: "tree", x: 330, y: 265, scale: 5 },
      { type: "house", x: 500, y: 245, scale: 5 },
      { type: "tree", x: 690, y: 262, scale: 5 },
      { type: "house", x: 860, y: 240, scale: 5 },
      { type: "tree", x: 1035, y: 266, scale: 5 },
      { type: "house", x: 1210, y: 242, scale: 5 },
      { type: "tree", x: 1390, y: 264, scale: 5 },
      { type: "house", x: 1495, y: 244, scale: 5 },
    ],
  },
  {
    skyTop: "#7c8c9b",
    skyMid: "#a1b0bc",
    skyBottom: "#b7c1c7",
    glowA: "rgba(178, 203, 244, 0.54)",
    glowB: "rgba(149, 177, 223, 0.28)",
    items: [
      { type: "house", x: 65, y: 242, scale: 5 },
      { type: "tree", x: 260, y: 262, scale: 5 },
      { type: "tree", x: 440, y: 255, scale: 5 },
      { type: "house", x: 620, y: 240, scale: 5 },
      { type: "tree", x: 820, y: 264, scale: 5 },
      { type: "house", x: 980, y: 238, scale: 5 },
      { type: "tree", x: 1165, y: 258, scale: 5 },
      { type: "house", x: 1335, y: 241, scale: 5 },
      { type: "tree", x: 1490, y: 262, scale: 5 },
    ],
  },
  {
    skyTop: "#908594",
    skyMid: "#b3aab3",
    skyBottom: "#c8bec6",
    glowA: "rgba(250, 194, 155, 0.62)",
    glowB: "rgba(237, 167, 133, 0.28)",
    items: [
      { type: "tree", x: 80, y: 264, scale: 5 },
      { type: "tree", x: 235, y: 256, scale: 5 },
      { type: "house", x: 390, y: 241, scale: 5 },
      { type: "tree", x: 590, y: 264, scale: 5 },
      { type: "house", x: 765, y: 243, scale: 5 },
      { type: "tree", x: 965, y: 261, scale: 5 },
      { type: "house", x: 1135, y: 238, scale: 5 },
      { type: "tree", x: 1320, y: 258, scale: 5 },
      { type: "house", x: 1475, y: 244, scale: 5 },
    ],
  },
  {
    skyTop: "#7f8a86",
    skyMid: "#aab4ad",
    skyBottom: "#c1c8c2",
    glowA: "rgba(210, 233, 194, 0.5)",
    glowB: "rgba(177, 211, 162, 0.24)",
    items: [
      { type: "house", x: 40, y: 240, scale: 5 },
      { type: "tree", x: 230, y: 264, scale: 5 },
      { type: "house", x: 405, y: 244, scale: 5 },
      { type: "tree", x: 585, y: 259, scale: 5 },
      { type: "tree", x: 740, y: 266, scale: 5 },
      { type: "house", x: 895, y: 238, scale: 5 },
      { type: "tree", x: 1095, y: 262, scale: 5 },
      { type: "house", x: 1260, y: 245, scale: 5 },
      { type: "tree", x: 1450, y: 258, scale: 5 },
    ],
  },
];

let currentScreen = 0;
let lastTime = performance.now();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function approach(current, target, delta) {
  if (current < target) return Math.min(current + delta, target);
  if (current > target) return Math.max(current - delta, target);
  return current;
}

function getScreen() {
  const len = WORLD_SCREENS.length;
  const i = ((currentScreen % len) + len) % len;
  return WORLD_SCREENS[i];
}

function tryJump() {
  if (Math.abs(neko.y - GROUND_Y) < 0.5) {
    neko.vy = JUMP_VELOCITY;
  }
}

function loadFrames() {
  const walkSources = [
    "./assets/neko/frame_01.png",
    "./assets/neko/frame_02.png",
    "./assets/neko/frame_03.png",
    "./assets/neko/frame_04.png",
    "./assets/neko/frame_05.png",
    "./assets/neko/frame_06.png",
  ];

  const jumpSources = ["./assets/neko/jump_01.png", "./assets/neko/jump_02.png"];

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  Promise.all([Promise.all(walkSources.map(loadImage)), Promise.all(jumpSources.map(loadImage))])
    .then(([walkImgs, jumpImgs]) => {
      sprite.frames = walkImgs;
      sprite.jumpFrames = jumpImgs;
      sprite.ready = true;
    })
    .catch(() => {
      sprite.ready = false;
    });
}

function drawPixelArt(rows, ox, oy, scale = 3) {
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const code = row[x];
      const color = pixelPalette[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}

function drawScenery(screen) {
  for (const item of screen.items) {
    if (item.type === "tree") {
      drawPixelArt(treeSprite, item.x, item.y, item.scale);
    } else {
      drawPixelArt(houseSprite, item.x, item.y, item.scale);
    }
  }
}

function drawBackground(timeSec) {
  const screen = getScreen();

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, screen.skyTop);
  sky.addColorStop(0.56, screen.skyMid);
  sky.addColorStop(1, screen.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(
    canvas.width * 0.5,
    185,
    20,
    canvas.width * 0.5,
    185,
    280 + Math.sin(timeSec) * 8,
  );
  glow.addColorStop(0, screen.glowA);
  glow.addColorStop(0.45, screen.glowB);
  glow.addColorStop(1, "rgba(230, 170, 165, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#adb0b8";
  ctx.fillRect(0, GROUND_Y - 60, canvas.width, 60);

  drawScenery(screen);

  ctx.fillStyle = "#9ca0a9";
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
}

function drawShadow(speedNorm) {
  const air = clamp((GROUND_Y - neko.y) / 120, 0, 1);
  const width = (112 - speedNorm * 18) * (1 - air * 0.3);
  const height = (16 - speedNorm * 2) * (1 - air * 0.35);
  ctx.fillStyle = "rgba(27, 13, 16, 0.24)";
  ctx.beginPath();
  ctx.ellipse(neko.x, GROUND_Y + 12, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawNeko() {
  const speedNorm = clamp(Math.abs(neko.vx) / neko.maxSpeed, 0, 1);
  const moving = speedNorm > 0.03;
  const airborne = neko.y < GROUND_Y - 0.5;

  drawShadow(speedNorm);

  if (!sprite.ready || sprite.frames.length === 0) {
    ctx.fillStyle = "#111";
    ctx.fillRect(neko.x - 28, neko.y - 58, 56, 44);
    return;
  }

  let frame;
  let bob = 0;

  if (airborne && sprite.jumpFrames.length > 0) {
    frame = neko.vy < 0 ? sprite.jumpFrames[0] : sprite.jumpFrames[1];
  } else {
    const cadence = 3.2 + speedNorm * 6.2;
    const phase = moving ? Math.floor((neko.walkTime * cadence) % sprite.frames.length) : 0;
    bob = moving && phase % 2 ? 1 : 0;
    frame = sprite.frames[phase];
  }

  const w = Math.round(frame.width * sprite.drawScale);
  const h = Math.round(frame.height * sprite.drawScale);

  const x = -Math.floor(w / 2);
  const y = neko.y - h - 1 + bob;

  ctx.save();
  ctx.translate(Math.round(neko.x), 0);
  ctx.scale(neko.facing, 1);
  ctx.imageSmoothingEnabled = false;

  // Paint eye color behind the sprite so transparent eye gaps reveal color.
  const eyeUnderColor = "#dbe86b";
  const eyePatchW = airborne ? Math.max(34, Math.round(w * 0.2)) : Math.max(46, Math.round(w * 0.27));
  const eyePatchH = airborne ? Math.max(14, Math.round(h * 0.16)) : Math.max(16, Math.round(h * 0.19));
  const eyePatchY = airborne ? y + Math.round(h * 0.32) : y + Math.round(h * 0.3);
  const eyePatchX = airborne ? x + Math.round(w * 0.72) : x + Math.round(w * 0.69);

  ctx.fillStyle = eyeUnderColor;
  ctx.fillRect(eyePatchX, eyePatchY, eyePatchW, eyePatchH);

  ctx.drawImage(frame, x, y, w, h);
  ctx.restore();
}

function update(dt) {
  const input = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const target = input * neko.maxSpeed;
  const rate = input !== 0 ? neko.accel : neko.decel;

  neko.vx = approach(neko.vx, target, rate * dt);
  if (Math.abs(neko.vx) < 0.5) neko.vx = 0;

  neko.x += neko.vx * dt;

  const halfWidth = sprite.ready && sprite.frames[0] ? (sprite.frames[0].width * sprite.drawScale) / 2 : 90;
  const minX = halfWidth + 8;
  const maxX = canvas.width - halfWidth - 8;

  // Screen transitions at full left/right edges.
  if (neko.x > maxX && neko.vx > 0) {
    currentScreen += 1;
    neko.x = minX;
    neko.facing = 1;
  } else if (neko.x < minX && neko.vx < 0) {
    currentScreen -= 1;
    neko.x = maxX;
    neko.facing = -1;
  } else {
    neko.x = clamp(neko.x, minX, maxX);
  }

  if (Math.abs(neko.vx) > 0.8) {
    neko.facing = Math.sign(neko.vx);
  }

  // Jump physics
  neko.vy += GRAVITY * dt;
  neko.y += neko.vy * dt;
  if (neko.y >= GROUND_Y) {
    neko.y = GROUND_Y;
    neko.vy = 0;
  }

  neko.walkTime += dt;
}

function render(timeSec) {
  drawBackground(timeSec);
  drawNeko();
}

function frame(now) {
  const dt = clamp((now - lastTime) / 1000, 0, 0.033);
  lastTime = now;

  update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (isMobileLike) return;
  if (event.key === "ArrowLeft") keys.left = true;
  if (event.key === "ArrowRight") keys.right = true;
  if (event.code === "Space") {
    event.preventDefault();
    tryJump();
  }
});

window.addEventListener("keyup", (event) => {
  if (isMobileLike) return;
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
});

let touchStartY = 0;
let touchJumpUsed = false;

function setTouchDirection(clientX) {
  const rect = canvas.getBoundingClientRect();
  const mid = rect.left + rect.width / 2;
  if (clientX < mid) {
    keys.left = true;
    keys.right = false;
  } else {
    keys.left = false;
    keys.right = true;
  }
}

if (isMobileLike) {
  canvas.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        touchStartY = touch.clientY;
        touchJumpUsed = false;
        setTouchDirection(touch.clientX);
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        setTouchDirection(touch.clientX);

        if (!touchJumpUsed && touchStartY - touch.clientY > 28) {
          tryJump();
          touchJumpUsed = true;
        }
      }
    },
    { passive: false },
  );

  const stopTouch = () => {
    keys.left = false;
    keys.right = false;
    touchJumpUsed = false;
  };

  canvas.addEventListener("touchend", stopTouch);
  canvas.addEventListener("touchcancel", stopTouch);
}

window.addEventListener("blur", () => {
  keys.left = false;
  keys.right = false;
});

loadFrames();
requestAnimationFrame(frame);
