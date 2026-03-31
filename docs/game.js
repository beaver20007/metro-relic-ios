const size = 7;
const totalFloors = 3;

const relicPool = [
  { id: "steel", name: "Стальная обшивка (+3 жизни)", apply: (s) => (s.hp += 3) },
  { id: "claw", name: "Заточка (+1 урон)", apply: (s) => (s.playerDamage += 1) },
  { id: "battery", name: "Энергоячейка (+2 трофея)", apply: (s) => (s.scrap += 2) },
  { id: "boots", name: "Тактические ботинки (рывок раз в бой)", apply: (s) => (s.dashCharges += 1) },
  { id: "injector", name: "Боевой инжектор (+2 жизни, +1 урон)", apply: (s) => ((s.hp += 2), (s.playerDamage += 1)) },
  { id: "scrapper", name: "Сборщик трофеев (+4 трофея)", apply: (s) => (s.scrap += 4) }
];

const state = {
  floor: 1,
  hp: 10,
  scrap: 0,
  playerDamage: 2,
  dashCharges: 0,
  player: { x: 0, y: 0 },
  exit: { x: 6, y: 6 },
  enemies: [],
  over: false,
  transitioning: false
};
const FLOOR_TRANSITION_MS = 1200;
const RESULT_ANNOUNCE_MS = 1900;

const SAVE_KEY = "metroRelicSaveV1";
const SETTINGS_KEY = "metroRelicSettingsV1";
const METRICS_KEY = "metroRelicMetricsV1";
const DEFAULT_SETTINGS = {
  uiScale: 1,
  difficulty: "normal",
  soundEnabled: true,
  volume: 70
};
const DEFAULT_METRICS = {
  runs: 0,
  wins: 0,
  defeats: 0,
  maxFloorReached: 1,
  lastPlayedAt: null
};
const floorStations = {
  1: "Станция: Речной вокзал",
  2: "Станция: Театральная",
  3: "Станция: Депо-13"
};
const difficultyPresets = {
  easy: {
    label: "Легко",
    playerHp: 12,
    playerDamage: 3,
    enemyHpBonus: -1,
    enemyDamageBonus: 0,
    enemyCountBonus: -1,
    scrapMultiplier: 1.2
  },
  normal: {
    label: "Нормально",
    playerHp: 10,
    playerDamage: 2,
    enemyHpBonus: 0,
    enemyDamageBonus: 0,
    enemyCountBonus: 0,
    scrapMultiplier: 1
  },
  hard: {
    label: "Сложно",
    playerHp: 8,
    playerDamage: 2,
    enemyHpBonus: 1,
    enemyDamageBonus: 1,
    enemyCountBonus: 1,
    scrapMultiplier: 0.9
  }
};

const appRoot = document.querySelector(".app");
const splashScreen = document.getElementById("splashScreen");
const splashStartBtn = document.getElementById("splashStartBtn");
const splashHowToBtn = document.getElementById("splashHowToBtn");
const grid = document.getElementById("grid");
const hpEl = document.getElementById("hp");
const scrapEl = document.getElementById("scrap");
const floorEl = document.getElementById("floor");
const logEl = document.getElementById("log");
const endTurnBtn = document.getElementById("endTurnBtn");
const restartBtn = document.getElementById("restartBtn");
const settingsBtn = document.getElementById("settingsBtn");
const howToBtn = document.getElementById("howToBtn");
const faqBtn = document.getElementById("faqBtn");
const whatsNewBtn = document.getElementById("whatsNewBtn");
const statsBtn = document.getElementById("statsBtn");
const reportBugBtn = document.getElementById("reportBugBtn");
const relicModal = document.getElementById("relicModal");
const relicOptions = document.getElementById("relicOptions");
const infoModal = document.getElementById("infoModal");
const infoModalTitle = document.getElementById("infoModalTitle");
const infoModalBody = document.getElementById("infoModalBody");
const infoModalCloseBtn = document.getElementById("infoModalCloseBtn");
const audioStatusEl = document.getElementById("audioStatus");
let floorTransitionEl = null;
const BUG_REPORT_GITHUB_NEW_ISSUE_URL = "https://github.com/beaver20007/metro-relic-ios/issues/new";

const infoScreens = {
  howTo: {
    title: "Как играть",
    body: `
      <p>Добро пожаловать в Metro Relic — пошаговую тактическую игру на поле 7x7.</p>
      <h3>Цель</h3>
      <ul>
        <li>Пройти 3 этажа.</li>
        <li>Уничтожить всех врагов на этаже.</li>
        <li>Дойти до выхода X.</li>
      </ul>
      <h3>Обозначения</h3>
      <ul>
        <li>P — игрок</li>
        <li>E — обычный враг</li>
        <li>B — босс на последнем этаже</li>
        <li>X — выход</li>
      </ul>
      <h3>Управление</h3>
      <ul>
        <li>Свайпай по полю в нужную сторону, чтобы двигаться и атаковать.</li>
        <li>На клавиатуре используй стрелки или WASD.</li>
        <li>После твоего действия враги делают ход.</li>
      </ul>
    `
  },
  faq: {
    title: "Частые ошибки",
    body: `
      <h3>Этаж не завершается на X</h3>
      <p>Выход срабатывает только после полной зачистки всех врагов.</p>
      <h3>Не могу сделать ход</h3>
      <p>Доступны только соседние свободные клетки, диагонали запрещены.</p>
      <h3>Атака не проходит</h3>
      <p>Атаковать можно только врага на соседней клетке.</p>
      <h3>Слишком быстро погибаю</h3>
      <p>Старайся не входить в окружение, выманивай врагов по одному.</p>
      <h3>Прогресс не восстановился</h3>
      <p>Это баг. Сообщи устройство, браузер и шаги, после которых пропал прогресс.</p>
    `
  },
  whatsNew: {
    title: "Что нового",
    body: `
      <p><strong>Текущая тестовая версия:</strong></p>
      <ul>
        <li>Добавлено автосохранение прогресса.</li>
        <li>Подготовлен iOS-билд через Capacitor.</li>
        <li>Добавлены встроенные экраны инструкции и FAQ.</li>
        <li>Добавлены звуки действий и экран статистики.</li>
        <li>Расширены реликвии и атмосфера метро по этажам.</li>
        <li>Улучшен онбординг для внешних тестеров.</li>
      </ul>
    `
  },
  reportBug: {
    title: "Сообщить о баге",
    body: `
      <p>Заполни форму ниже: мы соберем готовый отчёт для отправки.</p>
      <p>
        <label>
          Краткий заголовок проблемы
          <input id="bugTitleInput" type="text" placeholder="Например: На 2 этаже не играет звук победы" />
        </label>
      </p>
      <p>
        <label>
          Шаги воспроизведения
          <textarea id="bugStepsInput" rows="4" placeholder="1) Открыть игру...&#10;2) Сделать ход...&#10;3) Получилось..."></textarea>
        </label>
      </p>
      <p>
        <label>
          Ожидаемый результат
          <textarea id="bugExpectedInput" rows="2" placeholder="Что должно было произойти"></textarea>
        </label>
      </p>
      <p>
        <label>
          Фактический результат
          <textarea id="bugActualInput" rows="2" placeholder="Что произошло на самом деле"></textarea>
        </label>
      </p>
      <p>
        <label>
          Контакты (опционально)
          <input id="bugContactInput" type="text" placeholder="@telegram / email" />
        </label>
      </p>
      <button id="bugCopyBtn" type="button">Скопировать отчёт</button>
      <button id="bugOpenIssueBtn" type="button">Открыть заявку на GitHub</button>
      <button id="bugEmailBtn" type="button">Отправить по email</button>
      <p id="bugReportStatus" style="margin-top:8px; opacity:.9;"></p>
    `
  }
};

let audioCtx = null;
const AUDIO_VERSION = "20260331-1";
const audioBuffers = {};
const audioElements = {};
const AUDIO_FILES = {
  ui: "./assets/sfx/ui.mp3",
  move: "./assets/sfx/move.mp3",
  attack: "./assets/sfx/attack.mp3",
  hit: "./assets/sfx/hit.mp3",
  death: "./assets/sfx/you-died-45f.mp3",
  win: "./assets/sfx/the-sound-of-victory-winning.mp3",
  transition: "./assets/sfx/transition.mp3"
};
const EVENT_SFX_BOOST = {
  transition: { boost: 1.35, min: 0.55 },
  win: { boost: 1.7, min: 0.78 },
  death: { boost: 1.5, min: 0.65 }
};
const DEFAULT_VICTORY_SFX_VARIANTS = {
  pobeda1: [
    { delay: 0, notes: [[146, 0.55, "sawtooth", 0.16], [196, 0.52, "triangle", 0.13]] },
    { delay: 520, notes: [[174, 0.58, "sawtooth", 0.17], [220, 0.54, "triangle", 0.13]] },
    { delay: 1060, notes: [[196, 0.62, "sawtooth", 0.18], [246, 0.58, "triangle", 0.14]] },
    { delay: 1660, notes: [[220, 0.66, "sawtooth", 0.18], [277, 0.62, "square", 0.14]] },
    { delay: 2320, notes: [[246, 0.72, "triangle", 0.16], [311, 0.7, "square", 0.14]] },
    { delay: 3020, notes: [[293, 0.86, "square", 0.14], [370, 0.82, "triangle", 0.12]] }
  ]
};
const DEFAULT_VICTORY_SFX_ALIASES = {
  pobeda1: "pobeda1",
  "победа1": "pobeda1",
  "победа-1": "pobeda1",
  "победа_1": "pobeda1",
  "победа один": "pobeda1"
};
const externalVictoryConfig = typeof window !== "undefined" ? window.VICTORY_SFX_CONFIG || {} : {};
const VICTORY_SFX_VARIANTS = externalVictoryConfig.variants || DEFAULT_VICTORY_SFX_VARIANTS;
const VICTORY_SFX_ALIASES = {
  ...DEFAULT_VICTORY_SFX_ALIASES,
  ...(externalVictoryConfig.aliases || {})
};
const ACTIVE_VICTORY_SFX = externalVictoryConfig.active || "победа один";

function rand(max) {
  return Math.floor(Math.random() * max);
}

function setLog(msg, tone = "default") {
  logEl.textContent = msg;
  if (!logEl || !logEl.classList) return;
  logEl.classList.remove("log--success", "log--danger", "log--info");
  if (tone === "success") logEl.classList.add("log--success");
  else if (tone === "danger") logEl.classList.add("log--danger");
  else if (tone === "info") logEl.classList.add("log--info");
}

function ensureFloorTransitionEl() {
  try {
    if (floorTransitionEl) return floorTransitionEl;
    const el = document.createElement("div");
    el.className = "floor-transition";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="floor-transition__bg"></div>
      <div class="floor-transition__label">
        <div class="floor-transition__title"></div>
        <div class="floor-transition__subtitle"></div>
      </div>
    `;
    document.body.appendChild(el);
    floorTransitionEl = el;
    return floorTransitionEl;
  } catch (e) {
    console.error("Failed to create floor transition element", e);
    return null;
  }
}

function showFloorTransition(titleText, subtitleText, tone = "floor", durationMs = FLOOR_TRANSITION_MS) {
  return new Promise((resolve) => {
    try {
      const el = ensureFloorTransitionEl();
      if (!el) {
        resolve();
        return;
      }
      const title = el.querySelector(".floor-transition__title");
      const subtitle = el.querySelector(".floor-transition__subtitle");
      if (title) title.textContent = titleText || "Переход";
      if (subtitle) subtitle.textContent = subtitleText || "";
      el.classList.remove("tone-floor", "tone-success", "tone-danger");
      el.classList.add(`tone-${tone}`);
      el.classList.add("show");
      setTimeout(() => {
        el.classList.remove("show");
        resolve();
      }, durationMs);
    } catch (e) {
      console.error("Failed to show floor transition", e);
      resolve();
    }
  });
}

function formatTrophies(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} трофеев`;
  if (n1 > 1 && n1 < 5) return `${count} трофея`;
  if (n1 === 1) return `${count} трофей`;
  return `${count} трофеев`;
}

function formatLives(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} жизней`;
  if (n1 > 1 && n1 < 5) return `${count} жизни`;
  if (n1 === 1) return `${count} жизнь`;
  return `${count} жизней`;
}

function updateAudioStatus(label) {
  if (!audioStatusEl) return;
  audioStatusEl.textContent = `Audio: ${label}`;
}

function loadMetrics() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return { ...DEFAULT_METRICS };
    const raw = window.localStorage.getItem(METRICS_KEY);
    if (!raw) return { ...DEFAULT_METRICS };
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return { ...DEFAULT_METRICS };
    return {
      ...DEFAULT_METRICS,
      ...data
    };
  } catch (e) {
    console.error("Failed to load metrics", e);
    return { ...DEFAULT_METRICS };
  }
}

function saveMetrics(metrics) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error("Failed to save metrics", e);
  }
}

function patchMetrics(patch) {
  const current = loadMetrics();
  const next = {
    ...current,
    ...patch
  };
  saveMetrics(next);
}

function getStationByFloor(floor) {
  return floorStations[floor] || "Станция: Неизвестная линия";
}

function getAudioContext() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    return audioCtx;
  } catch (e) {
    console.error("Failed to create audio context", e);
    return null;
  }
}

async function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    updateAudioStatus("unlocked");
  } catch (e) {
    console.error("Failed to unlock audio", e);
    updateAudioStatus("error");
  }
}

function setupGlobalAudioUnlock() {
  const unlockOnce = async () => {
    await unlockAudio();
    document.removeEventListener("pointerdown", unlockOnce);
    document.removeEventListener("touchstart", unlockOnce);
    document.removeEventListener("keydown", unlockOnce);
  };

  document.addEventListener("pointerdown", unlockOnce, { passive: true });
  document.addEventListener("touchstart", unlockOnce, { passive: true });
  document.addEventListener("keydown", unlockOnce);
}

async function preloadAudioBuffers() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    for (const [key, path] of Object.entries(AUDIO_FILES)) {
      try {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) continue;
        const arr = await response.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr.slice(0));
        audioBuffers[key] = decoded;
      } catch (e) {
        console.warn(`Audio file for ${key} unavailable`, e);
      }
    }

    const loaded = Object.keys(audioBuffers).length;
    const total = Object.keys(AUDIO_FILES).length;
    updateAudioStatus(loaded > 0 ? `mp3 ${loaded}/${total}` : "fallback");
  } catch (e) {
    console.error("Failed to preload audio buffers", e);
    updateAudioStatus("fallback");
  }
}

function setupAudioElements() {
  try {
    for (const [key, path] of Object.entries(AUDIO_FILES)) {
      const audio = new Audio(`${path}?v=${AUDIO_VERSION}`);
      audio.preload = "auto";
      audio.load();
      audioElements[key] = audio;
    }
  } catch (e) {
    console.error("Failed to setup audio elements", e);
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.03) {
  try {
    if (!loadSettings().soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    const masterVolume = normalizeSettings(loadSettings()).volume / 100;
    gain.gain.setValueAtTime(volume * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.error("Failed to play tone", e);
  }
}

function playVictoryFanfare(variant = ACTIVE_VICTORY_SFX) {
  try {
    const normalizedKey = String(variant || "")
      .trim()
      .toLowerCase();
    const resolvedVariant = VICTORY_SFX_ALIASES[normalizedKey] || "pobeda1";
    const steps = VICTORY_SFX_VARIANTS[resolvedVariant] || VICTORY_SFX_VARIANTS.pobeda1;

    steps.forEach((step) => {
      setTimeout(() => {
        step.notes.forEach(([f, d, t, v]) => playTone(f, d, t, v));
      }, step.delay);
    });
  } catch (e) {
    console.error("Failed to play victory fanfare", e);
  }
}

function playSfx(kind) {
  try {
    if (!loadSettings().soundEnabled) return;
    const el = audioElements[kind];
    if (el) {
      const instance = el.cloneNode(true);
      const settingsVolume = normalizeSettings(loadSettings()).volume / 100;
      const eventConfig = EVENT_SFX_BOOST[kind];
      const boostedVolume = eventConfig
        ? Math.max(eventConfig.min, settingsVolume * eventConfig.boost)
        : settingsVolume;
      instance.volume = Math.max(0, Math.min(1, boostedVolume));
      instance.play().catch(() => {});
      updateAudioStatus("mp3");
      // Для победы используем только внешний трек (если он доступен),
      // без наложения синтетической фанфары.
      if (kind === "win" || !eventConfig) return;
    }
  } catch (e) {
    console.error("Failed to play html audio sfx", e);
  }

  try {
    if (!loadSettings().soundEnabled) return;
    const ctx = getAudioContext();
    const buffer = audioBuffers[kind];
    if (ctx && ctx.state === "running" && buffer) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const masterVolume = normalizeSettings(loadSettings()).volume / 100;
      source.buffer = buffer;
      gain.gain.value = Math.max(0, Math.min(1, masterVolume));
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      return;
    }
  } catch (e) {
    console.error("Failed to play mp3 sfx", e);
  }

  // fallback на синтетические звуки, если mp3 недоступны
  switch (kind) {
    case "move":
      playTone(280, 0.09, "triangle", 0.05);
      break;
    case "attack":
      playTone(420, 0.09, "square", 0.07);
      playTone(250, 0.12, "triangle", 0.05);
      break;
    case "hit":
      playTone(180, 0.15, "sawtooth", 0.08);
      break;
    case "death":
      playTone(180, 0.08, "square", 0.11);
      playTone(130, 0.22, "sawtooth", 0.13);
      playTone(92, 0.32, "sawtooth", 0.12);
      break;
    case "win":
      playVictoryFanfare();
      break;
    case "transition":
      playTone(260, 0.08, "triangle", 0.09);
      playTone(340, 0.1, "triangle", 0.1);
      playTone(440, 0.14, "sine", 0.1);
      break;
    case "ui":
      playTone(360, 0.06, "triangle", 0.05);
      break;
    default:
      break;
  }
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function isOccupied(x, y) {
  if (state.player.x === x && state.player.y === y) return true;
  return state.enemies.some((e) => e.x === x && e.y === y && e.hp > 0);
}

function spawnFloor() {
  const preset = getDifficultyPreset();
  state.enemies = [];
  state.player = { x: 0, y: 0 };
  state.exit = { x: size - 1, y: size - 1 };

  const enemyCount = Math.max(1, state.floor + 2 + preset.enemyCountBonus);
  for (let i = 0; i < enemyCount; i += 1) {
    let x = 0;
    let y = 0;
    do {
      x = rand(size);
      y = rand(size);
    } while ((x === 0 && y === 0) || (x === size - 1 && y === size - 1) || isOccupied(x, y));

    const isBoss = state.floor === totalFloors && i === enemyCount - 1;
    const baseHp = isBoss ? 8 : 4;
    const baseDamage = isBoss ? 3 : 1;
    state.enemies.push({
      x,
      y,
      hp: Math.max(1, baseHp + preset.enemyHpBonus),
      damage: Math.max(1, baseDamage + preset.enemyDamageBonus),
      boss: isBoss
    });
  }
}

function tileClass(x, y) {
  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  if (state.player.x === x && state.player.y === y) return "tile player";
  if (enemy) return `tile ${enemy.boss ? "enemy-boss" : "enemy"} enemy`;

  const adjacent = manhattan(state.player, { x, y }) === 1;
  const isExit = state.exit.x === x && state.exit.y === y;
  return `tile ${adjacent ? "adjacent" : ""} ${isExit ? "exit" : ""}`;
}

function tileSymbol(x, y) {
  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  if (state.player.x === x && state.player.y === y) return `P${state.hp}`;
  if (enemy) return enemy.boss ? "B" : "E";
  if (state.exit.x === x && state.exit.y === y) return "X";
  return "";
}

function getPlayerTileColor() {
  try {
    const baseHp = Math.max(1, getDifficultyPreset().playerHp);
    const ratio = Math.max(0, Math.min(1, state.hp / baseHp));
    // ratio 1 -> синий, ratio 0 -> красный
    const red = Math.round(47 + (176 - 47) * (1 - ratio));
    const green = Math.round(102 + (34 - 102) * (1 - ratio));
    const blue = Math.round(255 + (58 - 255) * (1 - ratio));
    return `rgb(${red}, ${green}, ${blue})`;
  } catch (e) {
    console.error("Failed to compute player tile color", e);
    return "#2f66ff";
  }
}

function getPlayerRingColor() {
  try {
    const baseHp = Math.max(1, getDifficultyPreset().playerHp);
    const ratio = Math.max(0, Math.min(1, state.hp / baseHp));
    const red = Math.round(90 + (255 - 90) * (1 - ratio));
    const green = Math.round(150 + (90 - 150) * (1 - ratio));
    const blue = Math.round(255 + (90 - 255) * (1 - ratio));
    return `rgb(${red}, ${green}, ${blue})`;
  } catch (e) {
    console.error("Failed to compute player ring color", e);
    return "#5a96ff";
  }
}

function getPlayerHpRatio() {
  const baseHp = Math.max(1, getDifficultyPreset().playerHp);
  return Math.max(0, Math.min(1, state.hp / baseHp));
}

function updateStats() {
  const preset = getDifficultyPreset();
  hpEl.textContent = `Жизни: ${state.hp}`;
  scrapEl.textContent = `Трофеи: ${state.scrap}`;
  floorEl.textContent = `Этаж: ${state.floor}/${totalFloors} • ${preset.label}`;
}

function saveGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const payload = {
      floor: state.floor,
      hp: state.hp,
      scrap: state.scrap,
      playerDamage: state.playerDamage,
      dashCharges: state.dashCharges,
      player: { ...state.player },
      exit: { ...state.exit },
      enemies: state.enemies.map((e) => ({ ...e })),
      over: state.over
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (e) {
    // безопасно игнорируем ошибки сохранения
    console.error("Failed to save game state", e);
  }
}

function loadGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data.floor !== "number" ||
      typeof data.hp !== "number" ||
      typeof data.scrap !== "number" ||
      !data.player ||
      !data.exit ||
      !Array.isArray(data.enemies)
    ) {
      return false;
    }

    state.floor = data.floor;
    state.hp = data.hp;
    state.scrap = data.scrap;
    state.playerDamage = data.playerDamage ?? state.playerDamage;
    state.dashCharges = data.dashCharges ?? state.dashCharges;
    state.player = { ...state.player, ...data.player };
    state.exit = { ...state.exit, ...data.exit };
    state.enemies = data.enemies.map((e) => ({ ...e }));
    state.over = Boolean(data.over);

    return true;
  } catch (e) {
    console.error("Failed to load game state", e);
    return false;
  }
}

function clearSavedGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error("Failed to clear saved game state", e);
  }
}

function loadSettings() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return { ...DEFAULT_SETTINGS };
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };
    return normalizeSettings(data);
  } catch (e) {
    console.error("Failed to load settings", e);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

function normalizeSettings(settings) {
  const safe = settings && typeof settings === "object" ? settings : {};
  const uiScale = Number(safe.uiScale);
  const normalizedScale = [0.9, 1, 1.1, 1.25].includes(uiScale) ? uiScale : DEFAULT_SETTINGS.uiScale;
  const difficulty = ["easy", "normal", "hard"].includes(safe.difficulty)
    ? safe.difficulty
    : DEFAULT_SETTINGS.difficulty;
  return {
    uiScale: normalizedScale,
    difficulty,
    soundEnabled: safe.soundEnabled !== false,
    volume: Number.isFinite(Number(safe.volume))
      ? Math.min(100, Math.max(0, Number(safe.volume)))
      : DEFAULT_SETTINGS.volume
  };
}

function applySettingsToUi(settings) {
  try {
    const root = document.documentElement;
    if (!root || !settings) return;

    let scale = normalizeSettings(settings).uiScale;
    // На мобильных браузерах высокий uiScale легко ломает ширину сетки
    if (typeof window !== "undefined" && window.innerWidth <= 520) {
      scale = Math.min(scale, 1);
    }
    root.style.setProperty("--ui-scale", String(scale));
  } catch (e) {
    console.error("Failed to apply settings", e);
  }
}

function getDifficultyPreset() {
  const settings = loadSettings();
  return difficultyPresets[settings.difficulty] || difficultyPresets.normal;
}

function openSettings() {
  let settings = loadSettings();
  const modalBody = `
    <p>Настройки применяются только на этом устройстве.</p>
    <h3>Сложность</h3>
    <p>
      <label>
        Пресет:
        <select id="difficultySelect">
          <option value="easy">Легко</option>
          <option value="normal">Нормально</option>
          <option value="hard">Сложно</option>
        </select>
      </label>
    </p>
    <h3>Размер интерфейса</h3>
    <p>
      <label>
        Масштаб:
        <select id="uiScaleSelect">
          <option value="0.9">90%</option>
          <option value="1">100%</option>
          <option value="1.1">110%</option>
          <option value="1.25">125%</option>
        </select>
      </label>
    </p>
    <h3>Звук</h3>
    <p>
      <label>
        <input id="soundToggle" type="checkbox" />
        Включен
      </label>
    </p>
    <p>
      <label>
        Громкость:
        <input id="volumeRange" type="range" min="0" max="100" step="1" />
        <span id="volumeValue"></span>
      </label>
    </p>
    <h3>Прогресс</h3>
    <p>Можно начать новый забег и очистить текущее автосохранение.</p>
    <button id="settingsApplyBtn" type="button">Применить сложность и начать новый забег</button>
    <button id="settingsResetRunBtn" type="button">Сбросить прогресс и начать новый забег</button>
  `;

  openInfoModal("howTo"); // откроет модалку, затем перезапишем содержимое
  if (!infoModalTitle || !infoModalBody) return;
  infoModalTitle.textContent = "Настройки";
  infoModalBody.innerHTML = modalBody;

  const uiScaleSelect = document.getElementById("uiScaleSelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");
  const volumeRange = document.getElementById("volumeRange");
  const volumeValue = document.getElementById("volumeValue");
  if (uiScaleSelect) {
    uiScaleSelect.value = String(settings.uiScale);
  }
  if (difficultySelect) {
    difficultySelect.value = settings.difficulty;
  }
  if (soundToggle) {
    soundToggle.checked = settings.soundEnabled;
  }
  if (volumeRange) {
    volumeRange.value = String(settings.volume);
  }
  if (volumeValue) {
    volumeValue.textContent = `${settings.volume}%`;
  }

  uiScaleSelect?.addEventListener("change", () => {
    settings = {
      ...settings,
      uiScale: Number(uiScaleSelect.value)
    };
    saveSettings(settings);
    applySettingsToUi(settings);
  });

  difficultySelect?.addEventListener("change", () => {
    settings = {
      ...settings,
      difficulty: difficultySelect.value
    };
    saveSettings(settings);
  });

  soundToggle?.addEventListener("change", () => {
    settings = {
      ...settings,
      soundEnabled: soundToggle.checked
    };
    saveSettings(settings);
  });

  volumeRange?.addEventListener("input", () => {
    settings = {
      ...settings,
      volume: Number(volumeRange.value)
    };
    if (volumeValue) {
      volumeValue.textContent = `${settings.volume}%`;
    }
    saveSettings(settings);
    playSfx("ui");
  });

  const applyBtn = document.getElementById("settingsApplyBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      playSfx("ui");
      closeInfoModal();
      resetGame();
      const preset = getDifficultyPreset();
      setLog(`Сложность: ${preset.label}. Новый забег начат.`);
      render();
    });
  }

  const resetRunBtn = document.getElementById("settingsResetRunBtn");
  if (resetRunBtn) {
    resetRunBtn.addEventListener("click", () => {
      playSfx("ui");
      clearSavedGame();
      closeInfoModal();
      resetGame();
    });
  }
}

function openStatsModal() {
  const m = loadMetrics();
  const formattedTime = m.lastPlayedAt ? new Date(m.lastPlayedAt).toLocaleString("ru-RU") : "еще не было";
  infoModalTitle.textContent = "Статистика";
  infoModalBody.innerHTML = `
    <h3>Общая</h3>
    <ul>
      <li>Запусков забега: ${m.runs}</li>
      <li>Побед: ${m.wins}</li>
      <li>Поражений: ${m.defeats}</li>
      <li>Максимальный этаж: ${m.maxFloorReached}/${totalFloors}</li>
      <li>Последняя игра: ${formattedTime}</li>
    </ul>
  `;
  infoModal.classList.remove("hidden");
}

function openInfoModal(screenKey) {
  try {
    const screen = infoScreens[screenKey];
    if (!screen || !infoModal || !infoModalTitle || !infoModalBody) return;
    infoModalTitle.textContent = screen.title;
    infoModalBody.innerHTML = screen.body;
    infoModal.classList.remove("hidden");
    if (screenKey === "reportBug") {
      setupBugReportForm();
    }
  } catch (e) {
    console.error("Failed to open info modal", e);
  }
}

function buildBugReportText() {
  try {
    const title = document.getElementById("bugTitleInput")?.value?.trim() || "Баг-репорт";
    const steps = document.getElementById("bugStepsInput")?.value?.trim() || "Не указано";
    const expected = document.getElementById("bugExpectedInput")?.value?.trim() || "Не указано";
    const actual = document.getElementById("bugActualInput")?.value?.trim() || "Не указано";
    const contact = document.getElementById("bugContactInput")?.value?.trim() || "Не указан";
    const platform = navigator.userAgent || "unknown";
    const currentUrl = window.location.href;
    return {
      title,
      text: [
        `Заголовок: ${title}`,
        "",
        "Шаги воспроизведения:",
        steps,
        "",
        "Ожидаемый результат:",
        expected,
        "",
        "Фактический результат:",
        actual,
        "",
        "Контакт:",
        contact,
        "",
        "Техданные:",
        `URL: ${currentUrl}`,
        `User-Agent: ${platform}`,
        `Этаж: ${state.floor}/${totalFloors}`,
        `Жизни: ${state.hp}`,
        `Трофеи: ${state.scrap}`,
        `Состояние: ${state.over ? "run-over" : "in-run"}`
      ].join("\n")
    };
  } catch (e) {
    console.error("Failed to build bug report text", e);
    return { title: "Баг-репорт", text: "Не удалось собрать отчёт автоматически." };
  }
}

function validateBugReportForm() {
  try {
    const titleEl = document.getElementById("bugTitleInput");
    const stepsEl = document.getElementById("bugStepsInput");
    const expectedEl = document.getElementById("bugExpectedInput");
    const actualEl = document.getElementById("bugActualInput");
    const fields = [titleEl, stepsEl, expectedEl, actualEl].filter(Boolean);

    fields.forEach((field) => field.classList.remove("field-error"));

    const errors = [];
    if (!titleEl || titleEl.value.trim().length < 6) {
      errors.push("Заголовок должен быть не короче 6 символов.");
      titleEl?.classList.add("field-error");
    }
    if (!stepsEl || stepsEl.value.trim().length < 10) {
      errors.push("Опиши шаги воспроизведения (минимум 10 символов).");
      stepsEl?.classList.add("field-error");
    }
    if (!expectedEl || expectedEl.value.trim().length < 6) {
      errors.push("Укажи ожидаемый результат (минимум 6 символов).");
      expectedEl?.classList.add("field-error");
    }
    if (!actualEl || actualEl.value.trim().length < 6) {
      errors.push("Укажи фактический результат (минимум 6 символов).");
      actualEl?.classList.add("field-error");
    }

    return {
      ok: errors.length === 0,
      message: errors.join(" ")
    };
  } catch (e) {
    console.error("Failed to validate bug report form", e);
    return {
      ok: false,
      message: "Не удалось проверить форму. Попробуй снова."
    };
  }
}

function setupBugReportForm() {
  try {
    const copyBtn = document.getElementById("bugCopyBtn");
    const openIssueBtn = document.getElementById("bugOpenIssueBtn");
    const emailBtn = document.getElementById("bugEmailBtn");
    const statusEl = document.getElementById("bugReportStatus");

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const validation = validateBugReportForm();
        if (!validation.ok) {
          if (statusEl) statusEl.textContent = validation.message;
          return;
        }
        const report = buildBugReportText();
        try {
          await navigator.clipboard.writeText(report.text);
          if (statusEl) statusEl.textContent = "Отчёт скопирован. Вставь его в тикет/чат.";
          playSfx("ui");
        } catch (e) {
          console.error("Failed to copy bug report", e);
          if (statusEl) statusEl.textContent = "Не удалось скопировать автоматически. Скопируй вручную.";
        }
      });
    }

    if (openIssueBtn) {
      openIssueBtn.addEventListener("click", () => {
        const validation = validateBugReportForm();
        if (!validation.ok) {
          if (statusEl) statusEl.textContent = validation.message;
          return;
        }
        const report = buildBugReportText();
        try {
          const issueUrl = `${BUG_REPORT_GITHUB_NEW_ISSUE_URL}?title=${encodeURIComponent(report.title)}&body=${encodeURIComponent(report.text)}`;
          window.open(issueUrl, "_blank", "noopener,noreferrer");
          if (statusEl) statusEl.textContent = "Открыта страница создания issue.";
          playSfx("ui");
        } catch (e) {
          console.error("Failed to open github issue page", e);
          if (statusEl) statusEl.textContent = "Не удалось открыть GitHub Issue.";
        }
      });
    }

    if (emailBtn) {
      emailBtn.addEventListener("click", () => {
        const validation = validateBugReportForm();
        if (!validation.ok) {
          if (statusEl) statusEl.textContent = validation.message;
          return;
        }
        const report = buildBugReportText();
        try {
          const mailto = `mailto:?subject=${encodeURIComponent(`[Metro Relic] ${report.title}`)}&body=${encodeURIComponent(report.text)}`;
          window.location.href = mailto;
          if (statusEl) statusEl.textContent = "Открыт почтовый клиент.";
          playSfx("ui");
        } catch (e) {
          console.error("Failed to open mailto", e);
          if (statusEl) statusEl.textContent = "Не удалось открыть почтовый клиент.";
        }
      });
    }
  } catch (e) {
    console.error("Failed to initialize bug report form", e);
  }
}

function closeInfoModal() {
  try {
    if (!infoModal) return;
    infoModal.classList.add("hidden");
  } catch (e) {
    console.error("Failed to close info modal", e);
  }
}

function render() {
  updateStats();
  grid.innerHTML = "";

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const btn = document.createElement("button");
      btn.className = tileClass(x, y);
      btn.textContent = tileSymbol(x, y);
      btn.type = "button";
      if (state.player.x === x && state.player.y === y) {
        const hpRatio = getPlayerHpRatio();
        const ringWidth = Math.max(1, Math.round(1 + hpRatio * 2)); // 1..3 px
        const glowAlpha = (0.2 + hpRatio * 0.25).toFixed(2); // 0.20..0.45
        btn.style.background = getPlayerTileColor();
        btn.style.outline = `${ringWidth}px solid ${getPlayerRingColor()}`;
        btn.style.outlineOffset = `${-ringWidth}px`;
        btn.style.boxShadow = `0 0 10px rgba(90,150,255,${glowAlpha})`;
      }
      grid.appendChild(btn);
    }
  }

  saveGame();
}

function attackEnemy(enemy) {
  const preset = getDifficultyPreset();
  enemy.hp -= state.playerDamage;
  playSfx("attack");
  setLog(`Ты ударил врага на ${state.playerDamage}.`);
  if (enemy.hp <= 0) {
    const baseScrap = enemy.boss ? 5 : 2;
    const gainedScrap = Math.max(1, Math.round(baseScrap * preset.scrapMultiplier));
    state.scrap += gainedScrap;
    setLog(
      enemy.boss
        ? `Босс уничтожен! +${formatTrophies(gainedScrap)}.`
        : `Враг уничтожен! +${formatTrophies(gainedScrap)}.`
    );
  }
}

function enemyTurn() {
  for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
    const dist = manhattan(enemy, state.player);
    if (dist === 1) {
      state.hp -= enemy.damage;
      playSfx("hit");
      if (state.hp <= 0) {
        finishRunAsDefeat();
        return;
      }
      continue;
    }

    const dx = state.player.x === enemy.x ? 0 : state.player.x > enemy.x ? 1 : -1;
    const dy = state.player.y === enemy.y ? 0 : state.player.y > enemy.y ? 1 : -1;

    const candidateA = { x: enemy.x + dx, y: enemy.y };
    const candidateB = { x: enemy.x, y: enemy.y + dy };
    const move = [candidateA, candidateB].find(
      (c) => inBounds(c.x, c.y) && !isOccupied(c.x, c.y) && !samePos(c, state.exit)
    );
    if (move) {
      enemy.x = move.x;
      enemy.y = move.y;
    }
  }
}

function floorCleared() {
  return state.enemies.every((e) => e.hp <= 0);
}

function finishRunAsWin() {
  state.over = true;
  const metrics = loadMetrics();
  patchMetrics({
    wins: metrics.wins + 1,
    maxFloorReached: Math.max(metrics.maxFloorReached, totalFloors),
    lastPlayedAt: new Date().toISOString()
  });
  playSfx("win");
  setLog(`Победа! Ты выбрался из метро с ${formatTrophies(state.scrap)}.`, "success");
  showFloorTransition("ПОБЕДА", `Добыча: ${formatTrophies(state.scrap)}`, "success", RESULT_ANNOUNCE_MS);
  render();
  return true;
}

function finishRunAsDefeat() {
  state.over = true;
  patchMetrics({
    defeats: loadMetrics().defeats + 1,
    lastPlayedAt: new Date().toISOString()
  });
  playSfx("death");
  setLog("Поражение! Ты погиб в туннелях. Нажми 'Новый забег'.", "danger");
  showFloorTransition("ПОРАЖЕНИЕ", "Нажми «Новый забег»", "danger", RESULT_ANNOUNCE_MS);
}

function advanceToNextFloor() {
  if (state.transitioning) return;
  state.transitioning = true;
  const nextFloor = state.floor + 1;
  setLog(`Этаж ${state.floor} пройден. Переход на этаж ${nextFloor}...`, "info");
  playSfx("transition");

  showFloorTransition(`ЭТАЖ ${nextFloor}`, "Переход...", "floor", FLOOR_TRANSITION_MS).then(() => {
    state.floor = nextFloor;
    patchMetrics({
      maxFloorReached: Math.max(loadMetrics().maxFloorReached, state.floor),
      lastPlayedAt: new Date().toISOString()
    });
    spawnFloor();
    setLog(`${getStationByFloor(state.floor)}. Этаж ${state.floor}. Враги стали сильнее.`, "info");
    state.transitioning = false;
    render();
  });
}

function maybeFinishFloor() {
  if (!samePos(state.player, state.exit)) return false;

  if (state.floor >= totalFloors) {
    return finishRunAsWin();
  }

  // Упрощенный и надежный сценарий: сразу переходим на следующий этаж.
  // Выбор реликвии отключен, чтобы избежать зависаний при переходе на X.
  advanceToNextFloor();
  return true;
}

function tryUseExit(x, y) {
  const isExit = state.exit.x === x && state.exit.y === y;
  if (!isExit) return false;

  const dist = manhattan(state.player, { x, y });
  // Разрешаем использовать выход, если стоим на нем или рядом с ним.
  if (dist > 1) {
    setLog("Подойди к выходу X вплотную.");
    return true;
  }

  state.player.x = x;
  state.player.y = y;
  // Прямой надежный переход по X без промежуточных состояний.
  if (state.floor >= totalFloors) {
    return finishRunAsWin();
  }

  advanceToNextFloor();
  return true;
}

function onTileTap(x, y) {
  if (state.over || state.transitioning) return;
  if (tryUseExit(x, y)) return;

  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  const dist = manhattan(state.player, { x, y });

  if (enemy && dist === 1) {
    attackEnemy(enemy);
    if (maybeFinishFloor()) return;
    enemyTurn();
    render();
    maybeFinishFloor();
    return;
  }

  if (dist !== 1 || enemy) {
    playSfx("ui");
    setLog("Можно ходить только на соседнюю свободную клетку.");
    return;
  }

  state.player.x = x;
  state.player.y = y;
  if (maybeFinishFloor()) return;
  playSfx("move");
  enemyTurn();
  render();
  maybeFinishFloor();
}

function handleSwipeMove(deltaX, deltaY) {
  if (state.over || state.transitioning) return;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX < 24 && absY < 24) return;

  let targetX = state.player.x;
  let targetY = state.player.y;

  if (absX >= absY) {
    targetX += deltaX > 0 ? 1 : -1;
  } else {
    targetY += deltaY > 0 ? 1 : -1;
  }

  if (!inBounds(targetX, targetY)) {
    setLog("Дальше туннельной стены идти нельзя.");
    return;
  }

  onTileTap(targetX, targetY);
}

function setupSwipeControls() {
  if (!grid) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  grid.addEventListener("touchstart", (event) => {
    if (!event.touches || event.touches.length !== 1) return;
    const t = event.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  grid.addEventListener("touchmove", (event) => {
    if (!tracking) return;
    event.preventDefault();
  }, { passive: false });

  grid.addEventListener("touchend", (event) => {
    if (!tracking) return;
    const t = event.changedTouches && event.changedTouches[0];
    tracking = false;
    if (!t) return;
    handleSwipeMove(t.clientX - startX, t.clientY - startY);
  }, { passive: true });
}

function setupKeyboardControls() {
  window.addEventListener("keydown", (event) => {
    if (state.over || state.transitioning) return;
    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    const inInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
    if (inInput) return;

    const key = String(event.key || "").toLowerCase();
    let targetX = state.player.x;
    let targetY = state.player.y;
    let handled = true;

    if (key === "arrowleft" || key === "a" || key === "ф") targetX -= 1;
    else if (key === "arrowright" || key === "d" || key === "в") targetX += 1;
    else if (key === "arrowup" || key === "w" || key === "ц") targetY -= 1;
    else if (key === "arrowdown" || key === "s" || key === "ы") targetY += 1;
    else handled = false;

    if (!handled) return;
    event.preventDefault();

    if (!inBounds(targetX, targetY)) {
      setLog("Дальше туннельной стены идти нельзя.");
      return;
    }
    onTileTap(targetX, targetY);
  });
}

function resetGame() {
  const preset = getDifficultyPreset();
  clearSavedGame();
  state.floor = 1;
  state.hp = preset.playerHp;
  state.scrap = 0;
  state.playerDamage = preset.playerDamage;
  state.dashCharges = 0;
  state.over = false;
  state.transitioning = false;
  spawnFloor();
  const metrics = loadMetrics();
  patchMetrics({
    runs: metrics.runs + 1,
    maxFloorReached: Math.max(metrics.maxFloorReached, 1),
    lastPlayedAt: new Date().toISOString()
  });
  setLog(`${getStationByFloor(state.floor)}. Новый забег: ${formatLives(state.hp)}. Уничтожь врагов и зайди на выход X.`);
  render();
}

function pickTwoRelics() {
  const bag = [...relicPool].sort(() => Math.random() - 0.5);
  return bag.slice(0, 2);
}

function chooseRelic(onChosen) {
  relicOptions.innerHTML = "";
  relicModal.classList.remove("hidden");
  const options = pickTwoRelics();

  options.forEach((relic) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "relic-btn";
    btn.textContent = relic.name;
    btn.addEventListener("click", () => {
      relic.apply(state);
      relicModal.classList.add("hidden");
      setLog(`Получена реликвия: ${relic.name}`);
      onChosen();
    });
    relicOptions.appendChild(btn);
  });
}

endTurnBtn.addEventListener("click", () => {
  if (state.over) return;
  enemyTurn();
  render();
  maybeFinishFloor();
});

restartBtn.addEventListener("click", resetGame);
if (settingsBtn) {
  settingsBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openSettings();
  });
}

if (howToBtn) {
  howToBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openInfoModal("howTo");
  });
}
if (faqBtn) {
  faqBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openInfoModal("faq");
  });
}
if (whatsNewBtn) {
  whatsNewBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openInfoModal("whatsNew");
  });
}
if (statsBtn) {
  statsBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openStatsModal();
  });
}
if (reportBugBtn) {
  reportBugBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    openInfoModal("reportBug");
  });
}
if (infoModalCloseBtn) {
  infoModalCloseBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    closeInfoModal();
  });
}
if (infoModal) {
  infoModal.addEventListener("click", (event) => {
    if (event.target === infoModal) {
      closeInfoModal();
    }
  });
}

function initGame() {
  applySettingsToUi(loadSettings());
  const restored = loadGame();
  if (restored) {
    setLog("Продолжаем последний забег.");
    render();
    return;
  }

  resetGame();
}

function boot() {
  setupSwipeControls();
  setupKeyboardControls();
  setupGlobalAudioUnlock();
  setupAudioElements();
  preloadAudioBuffers();
  // Если есть сплеш-экран, сначала показываем его
  if (splashScreen && splashStartBtn && appRoot) {
    appRoot.classList.add("hidden");
    appRoot.style.display = "none";
    splashScreen.classList.remove("hidden");
    splashScreen.style.display = "flex";

    splashStartBtn.addEventListener("click", () => {
      unlockAudio();
      playSfx("ui");
      splashScreen.classList.add("hidden");
      splashScreen.style.display = "none";
      appRoot.classList.remove("hidden");
      appRoot.style.display = "";
      initGame();
    });

    if (splashHowToBtn) {
      splashHowToBtn.addEventListener("click", () => {
        unlockAudio();
        playSfx("ui");
        // Переходим в игру и сразу открываем экран "Как играть"
        splashScreen.classList.add("hidden");
        splashScreen.style.display = "none";
        appRoot.classList.remove("hidden");
        appRoot.style.display = "";
        initGame();
        openInfoModal("howTo");
      });
    }
  } else {
    if (appRoot) {
      appRoot.classList.remove("hidden");
    }
    initGame();
  }
}

boot();
