const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: true });
ctx.imageSmoothingEnabled = false;

const GROUND_Y = 414;
const GRAVITY = 1300;
const JUMP_VELOCITY = -560;
const MOON_GRAVITY_MULTIPLIER = 0.26;
const ANTIGRAV_THRUST = 980;
const ANTIGRAV_MAX_RISE_SPEED = -260;
const ANTIGRAV_START = 100;
const ANTIGRAV_MAX = 100;
const ANTIGRAV_DRAIN_PER_SEC = 15;
const CAULIFLOWER_RESTORE = 30;
const EAT_DURATION = 0.42;

const keys = { left: false, right: false, antiGrav: false };
const isMobileLike = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches;

canvas.style.touchAction = "none";

const controlsHintEl = document.getElementById("controlsHint");
if (controlsHintEl) {
  controlsHintEl.textContent = isMobileLike
    ? "Mobile: tap left/right to move, swipe up to jump, double tap to fly."
    : "Desktop: Left/Right to move, Space to jump, hold Up Arrow to fly.";
}

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
  animLoco: 0,
  animPhase: 0,
  blockedMove: false,
  eatTimer: 0,
};

const antigrav = {
  points: ANTIGRAV_START,
  active: false,
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

const obstaclePalette = {
  ".": null,
  s: "#6f5a4d",
  S: "#3f312b",
  b: "#766251",
  B: "#4b3a33",
  g: "#7d8996",
  G: "#58626a",
  o: "#c9894f",
  O: "#8f5f38",
  l: "#d6c37d",
  r: "#cf4d43",
  R: "#8c2f2f",
  y: "#f0d36c",
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

const townhouseSprite = [
  ".........dd.........",
  "........dddd........",
  ".......dDDDDd.......",
  "......rrrrrrrr......",
  ".....rHHHHHHHHr.....",
  "....rHHwwHHwwHHr....",
  "...rHHHwwHHwwHHHr...",
  "..rHHHHHHddHHHHHHr..",
  "..rHHooHHddHHooHHr..",
  "..rHHooHHooHHooHHr..",
  "..rHHHHHHooHHHHHHr..",
  "..hhhhhhhhhhhhhhhh..",
  "...oooooooooooooo...",
];

const cottageSprite = [
  "........tt........",
  ".......tTTt.......",
  "......tTTTTt......",
  ".....rrrrrrrr.....",
  "....rrHHHHHHrr....",
  "...rrHHwwwwHHrr...",
  "..rrHHwwddwwHHrr..",
  ".rrHHHHHddHHHHHrr.",
  ".rHHoooHooHoooHHr.",
  ".rHHoooHooHoooHHr.",
  ".rHHHHHHHHHHHHHHr.",
  ".hhhhhhhhhhhhhhhh.",
  "..oooooooooooooo..",
];

const tallHouseSprite = [
  "......dddd......",
  ".....dDDDDd.....",
  "....rrrrrrrr....",
  "...rHHHHHHHHr...",
  "..rHHwwHHwwHHr..",
  "..rHHwwHHwwHHr..",
  "..rHHHHddHHHHr..",
  "..rHHooHHooHHr..",
  "..rHHHHddHHHHr..",
  "..rHHooHHooHHr..",
  "..rHHHHHHHHHHr..",
  "..hhhhhhhhhhhh..",
  "...oooooooooo...",
];

const villaSprite = [
  "............dd............",
  "...........dddd...........",
  "..........rrrrrr..........",
  "........rrrrrrrrrr........",
  "......rrrHHHHHHHHrrr......",
  ".....rrHHHHwwwwHHHHrr.....",
  "....rrHHHwwwddwwwHHHrr....",
  "...rrHHHHHHHddHHHHHHHrr...",
  "..rrHHoooHHHooHHHoooHHrr..",
  "..rHHHoooHHHooHHHoooHHHr..",
  "..rHHHHHHHHHHHHHHHHHHHHr..",
  "..hhhhhhhhhhhhhhhhhhhhhh..",
  "...oooooooooooooooooooo...",
];

const houseSprites = {
  house: houseSprite,
  townhouse: townhouseSprite,
  cottage: cottageSprite,
  tallHouse: tallHouseSprite,
  villa: villaSprite,
};

const obstacleSprites = {
  shoe: [
    "..SSSS....",
    ".SssssS...",
    "SssssssS..",
    ".SSSSssS..",
    "...SssS...",
    "..SSSS....",
  ],
  bag: [
    "...BBBB...",
    "..BbbbbB..",
    ".BbbbbbbB.",
    ".BbbbbbbB.",
    ".BbbllbbB.",
    "..BBBBBB..",
  ],
  cone: [
    "...o...",
    "..ooo..",
    "..oOo..",
    ".ooOoo.",
    ".ooooo.",
    "ooooooo",
  ],
  crate: [
    "GGGGGG",
    "GggggG",
    "GgGGgG",
    "GggggG",
    "GGGGGG",
  ],
  barrier: [
    "....rrrr....",
    "...rRRRRr...",
    "..rRRRRRRr..",
    "..rRRyyRRr..",
    "..rRRyyRRr..",
    "..rRRRRRRr..",
    "...rRRRRr...",
    "....rrrr....",
    "..GGGGGGGG..",
    "..GgllllgG..",
    "..GgllllgG..",
    ".....GG.....",
    ".....GG.....",
    "....oOOo....",
    "...ooOOoo...",
  ],
};

const cauliflowerPalette = {
  ".": null,
  w: "#ece5db",
  W: "#ffffff",
  s: "#d8d0c7",
  g: "#6b9a57",
  G: "#436d3a",
};

const cauliflowerSprite = [
  "....wWw....",
  "..wwWWWWww..",
  ".wWWWWWWWWw.",
  "wWWWssssWWWw",
  "wWWWWWWWWWWw",
  ".wWWWWWWWWw.",
  "..gGGGGGGg..",
  "..GGgGGgGG..",
  "...GGGGGG...",
  "....gGGg....",
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
      { type: "townhouse", x: 120, y: 260, scale: 4 },
      { type: "tree", x: 330, y: 265, scale: 5 },
      { type: "cottage", x: 450, y: 258, scale: 4 },
      { type: "tree", x: 690, y: 262, scale: 5 },
      { type: "villa", x: 760, y: 248, scale: 4 },
      { type: "tree", x: 1035, y: 266, scale: 5 },
      { type: "tallHouse", x: 1180, y: 246, scale: 5 },
      { type: "tree", x: 1390, y: 264, scale: 5 },
      { type: "townhouse", x: 1460, y: 260, scale: 4 },
    ],
    obstacles: [
      { kind: "shoe", x: 380, scale: 4 },
      { kind: "bag", x: 980, scale: 4 },
      { kind: "barrier", x: 690, scale: 5 },
    ],
  },
  {
    skyTop: "#7c8c9b",
    skyMid: "#a1b0bc",
    skyBottom: "#b7c1c7",
    glowA: "rgba(178, 203, 244, 0.54)",
    glowB: "rgba(149, 177, 223, 0.28)",
    items: [
      { type: "villa", x: 20, y: 250, scale: 4 },
      { type: "tree", x: 260, y: 262, scale: 5 },
      { type: "tree", x: 440, y: 255, scale: 5 },
      { type: "cottage", x: 585, y: 258, scale: 4 },
      { type: "tree", x: 820, y: 264, scale: 5 },
      { type: "tallHouse", x: 955, y: 246, scale: 5 },
      { type: "tree", x: 1165, y: 258, scale: 5 },
      { type: "townhouse", x: 1310, y: 260, scale: 4 },
      { type: "tree", x: 1490, y: 262, scale: 5 },
    ],
    obstacles: [
      { kind: "cone", x: 520, scale: 5 },
      { kind: "shoe", x: 1210, scale: 4 },
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
      { type: "villa", x: 690, y: 248, scale: 4 },
      { type: "tree", x: 965, y: 261, scale: 5 },
      { type: "cottage", x: 1100, y: 258, scale: 4 },
      { type: "tree", x: 1320, y: 258, scale: 5 },
      { type: "tallHouse", x: 1450, y: 246, scale: 5 },
    ],
    obstacles: [
      { kind: "crate", x: 300, scale: 5 },
      { kind: "bag", x: 1080, scale: 4 },
      { kind: "barrier", x: 815, scale: 5 },
    ],
  },
  {
    skyTop: "#7f8a86",
    skyMid: "#aab4ad",
    skyBottom: "#c1c8c2",
    glowA: "rgba(210, 233, 194, 0.5)",
    glowB: "rgba(177, 211, 162, 0.24)",
    items: [
      { type: "townhouse", x: 30, y: 260, scale: 4 },
      { type: "tree", x: 230, y: 264, scale: 5 },
      { type: "villa", x: 330, y: 248, scale: 4 },
      { type: "tree", x: 585, y: 259, scale: 5 },
      { type: "tree", x: 740, y: 266, scale: 5 },
      { type: "cottage", x: 860, y: 258, scale: 4 },
      { type: "tree", x: 1095, y: 262, scale: 5 },
      { type: "tallHouse", x: 1235, y: 246, scale: 5 },
      { type: "tree", x: 1450, y: 258, scale: 5 },
    ],
    obstacles: [
      { kind: "cone", x: 430, scale: 5 },
      { kind: "crate", x: 1320, scale: 5 },
    ],
  },
];

let currentScreen = 0;
let lastTime = performance.now();
const cauliflowerState = createCauliflowerState();

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

function getScreenIndex() {
  const len = WORLD_SCREENS.length;
  return ((currentScreen % len) + len) % len;
}

function getNekoSize() {
  const base = sprite.ready && sprite.frames[0] ? sprite.frames[0] : { width: 312, height: 208 };
  return {
    w: Math.round(base.width * sprite.drawScale),
    h: Math.round(base.height * sprite.drawScale),
  };
}

function getObstacleInstances(screen) {
  return (screen.obstacles || []).map((ob) => {
    const rows = obstacleSprites[ob.kind] || obstacleSprites.shoe;
    const scale = ob.scale || 4;
    const w = rows[0].length * scale;
    const h = rows.length * scale;
    return {
      ...ob,
      rows,
      scale,
      w,
      h,
      y: GROUND_Y - h,
    };
  });
}

function createCauliflowerState() {
  return WORLD_SCREENS.map((screen) => {
    const obstacles = getObstacleInstances(screen);
    const count = Math.random() < 0.7 ? 1 : 2;
    const scale = 4;
    const w = cauliflowerSprite[0].length * scale;
    const h = cauliflowerSprite.length * scale;
    const minX = 90;
    const maxX = canvas.width - w - 90;
    const items = [];

    let attempts = 0;
    while (items.length < count && attempts < 60) {
      attempts += 1;
      const x = Math.round(minX + Math.random() * (maxX - minX));
      const nearObstacle = obstacles.some((ob) => x + w > ob.x - 34 && x < ob.x + ob.w + 34);
      const nearOtherCauliflower = items.some((item) => Math.abs(item.x - x) < 90);
      if (nearObstacle || nearOtherCauliflower) continue;

      items.push({
        x,
        y: GROUND_Y - h + 3,
        w,
        h,
        scale,
        eaten: false,
      });
    }

    return items;
  });
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

function drawPixelArt(rows, ox, oy, scale = 3, palette = pixelPalette) {
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const code = row[x];
      const color = palette[code];
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
      const spriteRows = houseSprites[item.type] || houseSprite;
      drawPixelArt(spriteRows, item.x, item.y, item.scale);
    }
  }
}

function drawObstacles(screen) {
  for (const ob of getObstacleInstances(screen)) {
    drawPixelArt(ob.rows, ob.x, ob.y, ob.scale, obstaclePalette);
  }
}

function drawCauliflowers() {
  const items = cauliflowerState[getScreenIndex()] || [];
  for (const item of items) {
    if (item.eaten) continue;
    drawPixelArt(cauliflowerSprite, item.x, item.y, item.scale, cauliflowerPalette);
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

  drawObstacles(screen);
  drawCauliflowers();
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
  const speedNormPhysical = clamp(Math.abs(neko.vx) / neko.maxSpeed, 0, 1);
  const speedNorm = clamp(neko.animLoco, 0, 1);
  const moving = speedNorm > 0.03;
  const airborne = neko.y < GROUND_Y - 0.5;
  const flying = antigrav.active && airborne;
  const eating = neko.eatTimer > 0 && !airborne;
  const eatProgress = eating ? 1 - neko.eatTimer / EAT_DURATION : 0;
  const eatBend = eating ? Math.sin(Math.min(1, eatProgress * 1.35) * Math.PI) : 0;

  drawShadow(speedNormPhysical);

  if (!sprite.ready || sprite.frames.length === 0) {
    ctx.fillStyle = "#111";
    ctx.fillRect(neko.x - 28, neko.y - 58, 56, 44);
    return;
  }

  let frame;
  let bob = 0;

  if (airborne && sprite.jumpFrames.length > 0) {
    frame = neko.vy < 0 ? sprite.jumpFrames[0] : sprite.jumpFrames[1];
  } else if (eating) {
    frame = sprite.frames[0];
    bob = 3;
  } else {
    const phase = moving ? Math.floor(neko.animPhase % sprite.frames.length) : 0;
    bob = moving && phase % 2 ? 1 : 0;
    frame = sprite.frames[phase];
  }

  const w = Math.round(frame.width * sprite.drawScale);
  const h = Math.round(frame.height * sprite.drawScale);

  const x = -Math.floor(w / 2);
  const y = neko.y - h - 1 + bob;

  ctx.save();
  ctx.translate(Math.round(neko.x), flying ? Math.round(Math.sin(neko.walkTime * 14) * 2) : 0);
  ctx.scale(neko.facing, 1);
  if (eating) {
    const pivotX = x - Math.round(w * 0.1);
    const pivotY = y + Math.round(h * 0.78);
    ctx.translate(pivotX, pivotY);
    ctx.rotate((18 * eatBend * Math.PI) / 180);
    ctx.translate(-pivotX, -pivotY);
  } else if (flying) {
    ctx.rotate((-10 * Math.PI) / 180);
  }
  ctx.imageSmoothingEnabled = false;

  // Paint eye color behind the sprite so transparent eye gaps reveal color.
  const eyeUnderColor = "#dbe86b";
  const eyePatchW = airborne ? Math.max(34, Math.round(w * 0.2)) : Math.max(46, Math.round(w * 0.27));
  const eyePatchH = airborne ? Math.max(14, Math.round(h * 0.16)) : Math.max(16, Math.round(h * 0.19));
  const eyePatchY = airborne ? y + Math.round(h * 0.32) : y + Math.round(h * 0.3);
  const eyePatchX = airborne ? x + Math.round(w * 0.72) : x + Math.round(w * 0.69);

  ctx.fillStyle = eyeUnderColor;
  ctx.fillRect(eyePatchX, eyePatchY, eyePatchW, eyePatchH);

  const pupilW = Math.max(3, Math.round(eyePatchW * 0.12));
  const pupilH = Math.max(5, Math.round(eyePatchH * 0.5));
  const pupilY = eyePatchY + Math.max(2, Math.round(eyePatchH * 0.18));
  const pupilOffset = flying ? 1 : 0;
  const leftPupilX = eyePatchX + Math.round(eyePatchW * 0.24) + pupilOffset;
  const rightPupilX = eyePatchX + Math.round(eyePatchW * 0.62) + pupilOffset;

  ctx.fillStyle = "#111111";
  ctx.fillRect(leftPupilX, pupilY, pupilW, pupilH);
  ctx.fillRect(rightPupilX, pupilY, pupilW, pupilH);

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.fillRect(leftPupilX, pupilY, Math.max(1, pupilW - 1), 1);
  ctx.fillRect(rightPupilX, pupilY, Math.max(1, pupilW - 1), 1);

  if (flying) {
    ctx.fillStyle = "#0a0a0d";
    ctx.fillRect(x + Math.round(w * 0.19), y + Math.round(h * 0.63), Math.round(w * 0.17), Math.round(h * 0.14));
    ctx.fillRect(x + Math.round(w * 0.33), y + Math.round(h * 0.56), Math.round(w * 0.16), Math.round(h * 0.13));
    ctx.fillRect(x + Math.round(w * 0.56), y + Math.round(h * 0.64), Math.round(w * 0.15), Math.round(h * 0.12));
    ctx.fillRect(x + Math.round(w * 0.67), y + Math.round(h * 0.57), Math.round(w * 0.12), Math.round(h * 0.11));
  }

  ctx.drawImage(frame, x, y, w, h);

  if (flying) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(x + Math.round(w * 0.28), y + Math.round(h * 0.18), Math.round(w * 0.18), Math.round(h * 0.05));
    ctx.fillRect(x + Math.round(w * 0.5), y + Math.round(h * 0.22), Math.round(w * 0.12), Math.round(h * 0.04));
  }

  if (eating) {
    const biteWave = Math.sin(eatProgress * Math.PI * 2.8);
    const chewOpen = Math.max(0, biteWave);
    const headDip = Math.round(3 + eatBend * 7);
    const headShift = Math.round(4 + eatBend * 6);
    const mouthX = x + Math.round(w * 0.69) - headShift;
    const mouthY = y + Math.round(h * 0.66) + headDip;
    const cauliflowerX = x + Math.round(w * 0.73);
    const cauliflowerY = y + Math.round(h * 0.82);

    ctx.fillStyle = "#0a0a0d";
    ctx.fillRect(x + Math.round(w * 0.17), y + Math.round(h * 0.72), Math.round(w * 0.18), Math.round(h * 0.11));
    ctx.fillRect(x + Math.round(w * 0.31), y + Math.round(h * 0.66), Math.round(w * 0.17), Math.round(h * 0.1));

    ctx.fillStyle = "#0a0a0d";
    ctx.fillRect(x + Math.round(w * 0.62) - headShift, y + Math.round(h * 0.38) + headDip, Math.round(w * 0.16), Math.round(h * 0.1));
    ctx.fillRect(x + Math.round(w * 0.68) - headShift, y + Math.round(h * 0.5) + headDip, Math.round(w * 0.14), Math.round(h * 0.08));

    ctx.fillStyle = "#f4efe8";
    ctx.fillRect(cauliflowerX, cauliflowerY + 3, 15, 9);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cauliflowerX + 2, cauliflowerY, 11, 7);
    ctx.fillRect(cauliflowerX + 9, cauliflowerY + 4, 5, 4);
    ctx.fillStyle = "#5a8b56";
    ctx.fillRect(cauliflowerX - 4, cauliflowerY + 8, 7, 6);
    ctx.fillRect(cauliflowerX + 2, cauliflowerY + 11, 5, 5);

    ctx.fillStyle = "#0a0a0d";
    ctx.fillRect(mouthX - 2, mouthY + 1, 12, 4 + Math.round(chewOpen * 4));
    ctx.fillStyle = "#f6c4d2";
    ctx.fillRect(mouthX, mouthY + 3, 9, 2 + Math.round(chewOpen * 5));

    ctx.fillStyle = "rgba(244, 239, 232, 0.98)";
    ctx.fillRect(mouthX + 12 + Math.round(chewOpen * 2), mouthY + 2, 4, 4);
    ctx.fillRect(mouthX + 17 - Math.round(chewOpen * 3), mouthY + 8, 3, 3);
    ctx.fillRect(mouthX + 8, mouthY + 13 + Math.round(chewOpen * 2), 2, 2);
  }

  ctx.restore();
}

function drawHud() {
  const meterX = 22;
  const meterY = 22;
  const meterW = 220;
  const meterH = 18;
  const fill = clamp(antigrav.points / ANTIGRAV_MAX, 0, 1);

  ctx.save();
  ctx.font = '18px "Avenir Next", "Segoe UI", sans-serif';
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(18, 15, 25, 0.74)";
  ctx.fillRect(meterX - 10, meterY - 10, meterW + 220, 56);

  ctx.fillStyle = "#f4f0ff";
  ctx.fillText(`Anti-gravity: ${Math.ceil(antigrav.points)} / ${ANTIGRAV_MAX}`, meterX, meterY);

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(meterX, meterY + 26, meterW, meterH);
  ctx.fillStyle = antigrav.active ? "#8ef0ff" : "#b8b1d9";
  ctx.fillRect(meterX, meterY + 26, Math.round(meterW * fill), meterH);
  ctx.strokeStyle = "rgba(244, 240, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY + 26, meterW, meterH);
  ctx.restore();
}

function resolveObstacleCollision() {
  const screen = getScreen();
  const obstacles = getObstacleInstances(screen);
  if (obstacles.length === 0) return false;

  let blocked = false;

  const size = getNekoSize();
  const halfBodyW = size.w * 0.27;
  const hitLeft = neko.x - halfBodyW;
  const hitRight = neko.x + halfBodyW;
  const hitTop = neko.y - size.h * 0.4;
  const hitBottom = neko.y - 2;

  for (const ob of obstacles) {
    const obLeft = ob.x;
    const obRight = ob.x + ob.w;
    const obTop = ob.y;
    const obBottom = ob.y + ob.h;

    const overlapX = hitRight > obLeft && hitLeft < obRight;
    const overlapY = hitBottom > obTop + 2 && hitTop < obBottom - 2;

    if (!overlapX || !overlapY) continue;

    if (neko.vx > 0) {
      neko.x = obLeft - halfBodyW - 1;
      neko.vx = 0;
      blocked = true;
    } else if (neko.vx < 0) {
      neko.x = obRight + halfBodyW + 1;
      neko.vx = 0;
      blocked = true;
    }
  }

  return blocked;
}

function collectCauliflowers() {
  const items = cauliflowerState[getScreenIndex()] || [];
  const size = getNekoSize();
  const halfBodyW = size.w * 0.25;
  const hitLeft = neko.x - halfBodyW;
  const hitRight = neko.x + halfBodyW;
  const hitTop = neko.y - size.h * 0.34;
  const hitBottom = neko.y + 4;

  for (const item of items) {
    if (item.eaten) continue;

    const overlapX = hitRight > item.x && hitLeft < item.x + item.w;
    const overlapY = hitBottom > item.y && hitTop < item.y + item.h;
    if (!overlapX || !overlapY) continue;

    item.eaten = true;
    antigrav.points = Math.min(ANTIGRAV_MAX, antigrav.points + CAULIFLOWER_RESTORE);
    neko.eatTimer = EAT_DURATION;
    neko.vx = 0;
    break;
  }
}

function update(dt) {
  neko.eatTimer = Math.max(0, neko.eatTimer - dt);

  const eating = neko.eatTimer > 0;
  const input = eating ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const target = input * neko.maxSpeed;
  const rate = input !== 0 ? neko.accel : neko.decel;

  neko.vx = approach(neko.vx, target, rate * dt);
  if (Math.abs(neko.vx) < 0.5) neko.vx = 0;

  neko.x += neko.vx * dt;

  const size = getNekoSize();
  const halfWidth = size.w / 2;
  const minX = halfWidth + 8;
  const maxX = canvas.width - halfWidth - 8;
  const minVisibleY = size.h + 10;

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

  // Ground-level obstacle collisions. Neko must jump over these.
  const blockedMove = resolveObstacleCollision();
  neko.blockedMove = blockedMove;
  collectCauliflowers();

  if (Math.abs(neko.vx) > 0.8) {
    neko.facing = Math.sign(neko.vx);
  }

  const antigravRequested = !eating && keys.antiGrav && antigrav.points > 0;
  antigrav.active = antigravRequested;
  if (antigrav.active) {
    antigrav.points = Math.max(0, antigrav.points - ANTIGRAV_DRAIN_PER_SEC * dt);
  }

  // Jump physics
  const gravity = antigrav.active ? GRAVITY * MOON_GRAVITY_MULTIPLIER : GRAVITY;
  neko.vy += gravity * dt;
  if (antigrav.active) {
    neko.vy -= ANTIGRAV_THRUST * dt;
    neko.vy = Math.max(neko.vy, ANTIGRAV_MAX_RISE_SPEED);
  }
  neko.y += neko.vy * dt;
  if (neko.y < minVisibleY) {
    neko.y = minVisibleY;
    neko.vy = Math.max(0, neko.vy);
  }
  if (neko.y >= GROUND_Y) {
    neko.y = GROUND_Y;
    neko.vy = 0;
    antigrav.active = false;
  }

  const locomotionTarget = blockedMove && input !== 0 ? 0.16 : clamp(Math.abs(neko.vx) / neko.maxSpeed, 0, 1);
  neko.animLoco += (locomotionTarget - neko.animLoco) * Math.min(1, dt * 10);

  const cadence = 3.2 + neko.animLoco * 6.2;
  neko.animPhase += dt * cadence;

  neko.walkTime += dt;
}

function render(timeSec) {
  drawBackground(timeSec);
  drawNeko();
  drawHud();
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
  if (event.key === "ArrowUp") {
    event.preventDefault();
    keys.antiGrav = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    tryJump();
  }
});

window.addEventListener("keyup", (event) => {
  if (isMobileLike) return;
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
  if (event.key === "ArrowUp") keys.antiGrav = false;
});

let touchStartY = 0;
let touchJumpUsed = false;
let lastTouchStartTime = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let mobileFlightLatch = false;

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
        const now = performance.now();
        const touch = event.touches[0];
        const isDoubleTap =
          now - lastTouchStartTime < 380 &&
          Math.abs(touch.clientX - lastTouchX) < 48 &&
          Math.abs(touch.clientY - lastTouchY) < 48;
        lastTouchStartTime = now;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        touchStartY = touch.clientY;
        touchJumpUsed = false;
        setTouchDirection(touch.clientX);
        if (isDoubleTap) {
          mobileFlightLatch = !mobileFlightLatch;
        }
        keys.antiGrav = mobileFlightLatch;
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
        keys.antiGrav = mobileFlightLatch;

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
    keys.antiGrav = mobileFlightLatch;
    touchJumpUsed = false;
  };

  canvas.addEventListener("touchend", stopTouch);
  canvas.addEventListener("touchcancel", stopTouch);
}

window.addEventListener("blur", () => {
  keys.left = false;
  keys.right = false;
  keys.antiGrav = false;
  antigrav.active = false;
  mobileFlightLatch = false;
});

loadFrames();
requestAnimationFrame(frame);
