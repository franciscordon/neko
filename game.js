const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.imageSmoothingEnabled = false;

const GROUNd_Y = 414;
const keys = { left: false, right: false };
const isMobileLike = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches;

canvas.style.touchAction = "none";

const neko = {
  x: canvas.width * 0.5,
  vx: 0,
  facing: 1,
  maxSpeed: 220,
  accel: 1300,
  decel: 1800,
  walkTime: 0,
};

const sprite = {
  frames: [],
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

const backgroundItems = [
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
];

let lastTime = performance.now();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function approach(current, target, delta) {
  if (current < target) return Math.min(current + delta, target);
  if (current > target) return Math.max(current - delta, target);
  return current;
}

function loadFrames() {
  const sources = [
    "./assets/neko/frame_01.png",
    "./assets/neko/frame_02.png",
    "./assets/neko/frame_03.png",
    "./assets/neko/frame_04.png",
    "./assets/neko/frame_05.png",
    "./assets/neko/frame_06.png",
  ];

  const loaders = sources.map(
    (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
  );

  Promise.all(loaders)
    .then((imgs) => {
      sprite.frames = imgs;
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

function drawScenery() {
  for (const item of backgroundItems) {
    if (item.type === "tree") {
      drawPixelArt(treeSprite, item.x, item.y, item.scale);
    } else {
      drawPixelArt(houseSprite, item.x, item.y, item.scale);
    }
  }
}

function drawBackground(timeSec) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#8b8f9d");
  sky.addColorStop(0.56, "#afb0b8");
  sky.addColorStop(1, "#c1c1c7");
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
  glow.addColorStop(0, "rgba(241, 184, 177, 0.68)");
  glow.addColorStop(0.45, "rgba(230, 170, 165, 0.30)");
  glow.addColorStop(1, "rgba(230, 170, 165, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#adb0b8";
  ctx.fillRect(0, GROUNd_Y - 60, canvas.width, 60);

  drawScenery();

  ctx.fillStyle = "#9ca0a9";
  ctx.fillRect(0, GROUNd_Y, canvas.width, canvas.height - GROUNd_Y);
}

function drawShadow(speedNorm) {
  const width = 112 - speedNorm * 18;
  const height = 16 - speedNorm * 2;
  ctx.fillStyle = "rgba(27, 13, 16, 0.24)";
  ctx.beginPath();
  ctx.ellipse(neko.x, GROUNd_Y + 12, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawNeko() {
  const speedNorm = clamp(Math.abs(neko.vx) / neko.maxSpeed, 0, 1);
  const moving = speedNorm > 0.03;

  drawShadow(speedNorm);

  if (!sprite.ready || sprite.frames.length === 0) {
    ctx.fillStyle = "#111";
    ctx.fillRect(neko.x - 28, GROUNd_Y - 58, 56, 44);
    return;
  }

  const cadence = 3.2 + speedNorm * 6.2;
  const phase = moving ? Math.floor((neko.walkTime * cadence) % sprite.frames.length) : 0;
  const bob = moving && phase % 2 ? 1 : 0;

  const frame = sprite.frames[phase];
  const w = Math.round(frame.width * sprite.drawScale);
  const h = Math.round(frame.height * sprite.drawScale);

  const x = -Math.floor(w / 2);
  const y = GROUNd_Y - h - 1 + bob;

  ctx.save();
  ctx.translate(Math.round(neko.x), 0);
  ctx.scale(neko.facing, 1);
  ctx.imageSmoothingEnabled = false;

  // Paint eye color behind the sprite so only transparent eye gaps reveal it.
  const eyeUnderColor = "#dbe86b";
  const eyePatchW = Math.max(46, Math.round(w * 0.27));
  const eyePatchH = Math.max(16, Math.round(h * 0.19));
  const eyePatchY = y + Math.round(h * 0.30);
  const eyePatchX = x + Math.round(w * 0.69);

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
  neko.x = clamp(neko.x, halfWidth + 8, canvas.width - halfWidth - 8);

  if (Math.abs(neko.vx) > 0.8) {
    neko.facing = Math.sign(neko.vx);
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
});

window.addEventListener("keyup", (event) => {
  if (isMobileLike) return;
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
});

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
  canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (event.touches.length > 0) setTouchDirection(event.touches[0].clientX);
  }, { passive: false });

  canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (event.touches.length > 0) setTouchDirection(event.touches[0].clientX);
  }, { passive: false });

  const stopTouch = () => {
    keys.left = false;
    keys.right = false;
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
