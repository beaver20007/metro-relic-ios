const {
  size,
  totalFloors,
  floorTransitionMs: FLOOR_TRANSITION_MS,
  resultAnnounceMs: RESULT_ANNOUNCE_MS,
  saveKey: SAVE_KEY,
  settingsKey: SETTINGS_KEY,
  metricsKey: METRICS_KEY,
  defaultSettings: DEFAULT_SETTINGS,
  defaultMetrics: DEFAULT_METRICS,
  floorStations,
  difficultyPresets,
  relicPool,
  bugReportGithubNewIssueUrl: BUG_REPORT_GITHUB_NEW_ISSUE_URL
} = window.GAME_CONFIG || {};
if (!size || !totalFloors || !relicPool || !difficultyPresets) {
  throw new Error("GAME_CONFIG is missing or incomplete");
}

const P = globalThis.MetroRelicPure;
if (!P || typeof P.manhattan !== "function") {
  throw new Error("MetroRelicPure failed to load (pure-grid.js must precede game.js)");
}
const manhattan = P.manhattan;
const samePos = P.samePos;
const inBounds = (x, y) => P.inBounds(x, y, size);

if (!window.MetroRelicI18n?.bundles?.ru) {
  throw new Error("MetroRelicI18n missing (locale-bundles.js must load before game.js)");
}

function getRawLocale() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return DEFAULT_SETTINGS.locale === "en" ? "en" : "ru";
    }
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS.locale === "en" ? "en" : "ru";
    const data = JSON.parse(raw);
    return data && data.locale === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

function getLocaleBundle() {
  const loc = getRawLocale();
  return window.MetroRelicI18n.bundles[loc] || window.MetroRelicI18n.bundles.ru;
}

function tf(path, vars = {}) {
  const segs = path.split(".");
  let cur = getLocaleBundle();
  for (const s of segs) cur = cur?.[s];
  if (typeof cur !== "string") {
    console.warn("i18n missing:", path);
    return path;
  }
  return cur.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

function getInfoScreens() {
  return getLocaleBundle().infoScreens;
}

function getPresetLabel(key) {
  const b = getLocaleBundle();
  if (b.presets && b.presets[key]) return b.presets[key];
  return difficultyPresets[key]?.label || key;
}

function getRelicDisplayName(relic) {
  const v = tf(`relics.${relic.id}`);
  return v === `relics.${relic.id}` ? relic.name : v;
}

function applyLocaleToDom() {
  const d = getLocaleBundle().dom || {};
  try {
    document.documentElement.lang = getLocaleBundle().meta?.htmlLang || "ru";
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el && text != null) el.textContent = text;
    };
    setTxt("splashTagline", d.splashTagline);
    setTxt("splashMeta", d.splashMeta);
    setTxt("splashStartBtn", d.splashStart);
    setTxt("splashHowToBtn", d.splashHowTo);
    setTxt("endTurnBtn", d.endTurn);
    setTxt("restartBtn", d.restart);
    setTxt("settingsBtn", d.settings);
    setTxt("howToBtn", d.howTo);
    setTxt("faqBtn", d.faq);
    setTxt("whatsNewBtn", d.whatsNew);
    setTxt("statsBtn", d.stats);
    setTxt("reportBugBtn", d.reportBug);
    setTxt("relicModalHeading", d.relicPickTitle);
    setTxt("infoModalTitle", d.infoDefaultTitle);
    if (infoModalCloseBtn && d.closeAria) {
      infoModalCloseBtn.setAttribute("aria-label", d.closeAria);
    }
    if (grid && d.gridAria) grid.setAttribute("aria-label", d.gridAria);
    if (logEl && d.initialLog) logEl.textContent = d.initialLog;
  } catch (e) {
    console.error("applyLocaleToDom", e);
  }
}

function getStationByFloor(floor) {
  const b = getLocaleBundle();
  if (b.stations && Object.prototype.hasOwnProperty.call(b.stations, floor)) {
    return b.stations[floor];
  }
  if (floorStations[floor]) return floorStations[floor];
  return b.unknownStation || "?";
}

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
  transitioning: false,
  pickingRelic: false,
  dashArmNextMove: false,
  runStartedAt: Date.now(),
  damageTakenThisFloor: 0,
  oneShotFlash: false
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
const dashBtn = document.getElementById("dashBtn");
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
const runSummaryModal = document.getElementById("runSummaryModal");
const runSummaryTitle = document.getElementById("runSummaryTitle");
const runSummaryReason = document.getElementById("runSummaryReason");
const runSummaryList = document.getElementById("runSummaryList");
const runSummaryAgainBtn = document.getElementById("runSummaryAgainBtn");
const runSummaryStatsBtn = document.getElementById("runSummaryStatsBtn");
const audioStatusEl = document.getElementById("audioStatus");
let floorTransitionEl = null;
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

let runRngFn = null;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function combineDailySeed(difficultyKey) {
  const d = new Date();
  const n = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const h = String(difficultyKey || "n")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Math.imul(n ^ 0x5e33d17c, 1009) + h;
}

function initRunRng() {
  const settings = loadSettings();
  if (settings.runMode === "daily") {
    runRngFn = mulberry32(combineDailySeed(settings.difficulty) >>> 0);
  } else {
    runRngFn = null;
  }
}

function gameRand01() {
  if (runRngFn) return runRngFn();
  return Math.random();
}

function rand(max) {
  return Math.floor(gameRand01() * max);
}

function hapticLight() {
  try {
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (Haptics?.impact) {
      void Haptics.impact({ style: "LIGHT" });
      return;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  } catch (e2) {
    /* ignore */
  }
}

function hapticMedium() {
  try {
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (Haptics?.impact) {
      void Haptics.impact({ style: "MEDIUM" });
      return;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(22);
    }
  } catch (e2) {
    /* ignore */
  }
}

function flashPlayerTile() {
  try {
    if (typeof window === "undefined" || !grid) return;
    requestAnimationFrame(() => {
      const idx = state.player.y * size + state.player.x;
      const btn = grid.children[idx];
      if (!btn) return;
      btn.classList.add("tile-flash");
      setTimeout(() => btn.classList.remove("tile-flash"), 220);
    });
  } catch (e) {
    /* ignore */
  }
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
      if (title) title.textContent = titleText || tf("transitions.genericTitle");
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
  if (getRawLocale() === "en") return `${count} scrap`;
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} трофеев`;
  if (n1 > 1 && n1 < 5) return `${count} трофея`;
  if (n1 === 1) return `${count} трофей`;
  return `${count} трофеев`;
}

function formatLives(count) {
  if (getRawLocale() === "en") return `${count} HP`;
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} жизней`;
  if (n1 > 1 && n1 < 5) return `${count} жизни`;
  if (n1 === 1) return `${count} жизнь`;
  return `${count} жизней`;
}

function isAudioDebugEnabled() {
  try {
    if (typeof window === "undefined") return false;
    const q = new URLSearchParams(window.location.search || "");
    if (q.get("debug") === "1" || q.get("audioDebug") === "1") return true;
    try {
      const cap = window.Capacitor;
      if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
        return false;
      }
    } catch {
      /* ignore */
    }
    const h = String(window.location.hostname || "");
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch {
    return false;
  }
}

function syncAudioDebugIndicator() {
  try {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle("audio-debug", isAudioDebugEnabled());
  } catch (e) {
    console.error("syncAudioDebugIndicator", e);
  }
}

function updateAudioStatus(label) {
  if (!audioStatusEl || !isAudioDebugEnabled()) return;
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
      ...data,
      achievements: {
        ...DEFAULT_METRICS.achievements,
        ...(data.achievements && typeof data.achievements === "object" ? data.achievements : {})
      }
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
  if (patch.achievements && typeof patch.achievements === "object") {
    next.achievements = {
      ...current.achievements,
      ...patch.achievements
    };
  }
  saveMetrics(next);
}

function unlockAchievement(key) {
  const m = loadMetrics();
  if (!m.achievements || m.achievements[key]) return;
  patchMetrics({ achievements: { [key]: true } });
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

    const run = () => {
      if (ctx.state !== "running") return;
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
    };

    if (ctx.state === "running") {
      run();
    } else {
      void ctx.resume().then(run);
    }
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

async function playSfx(kind) {
  try {
    if (!loadSettings().soundEnabled) return;

    try {
      const pre = getAudioContext();
      if (pre && pre.state === "suspended") {
        void pre.resume();
      }
    } catch (e) {
      /* ignore */
    }

    await unlockAudio();

    const eventConfig = EVENT_SFX_BOOST[kind];
    const settingsVolume = normalizeSettings(loadSettings()).volume / 100;
    const vol = Math.max(
      0,
      Math.min(
        1,
        eventConfig ? Math.max(eventConfig.min, settingsVolume * eventConfig.boost) : settingsVolume
      )
    );

    const tryDecodeBuffer = async () => {
      const ctx = getAudioContext();
      const buffer = audioBuffers[kind];
      if (!ctx || !buffer) return false;
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        if (ctx.state !== "running") return false;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = vol;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        updateAudioStatus("mp3");
        return true;
      } catch (e) {
        console.warn("Web Audio buffer play failed", kind, e);
        return false;
      }
    };

    const tryHtmlAudio = async () => {
      const el = audioElements[kind];
      if (!el) return false;
      try {
        const instance = el.cloneNode(true);
        instance.volume = vol;
        await instance.play();
        updateAudioStatus("mp3");
        return true;
      } catch (e) {
        return false;
      }
    };

    /* Сначала декодированный буфер: на iOS (в т.ч. Chrome) заметно меньше задержка, чем у HTMLAudio. */
    if (await tryDecodeBuffer()) return;
    if (await tryHtmlAudio()) return;

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
  } catch (e) {
    console.error("playSfx failed", kind, e);
  }
}

function isOccupied(x, y) {
  return P.isCellOccupied(x, y, state.player, state.enemies);
}

function tryDashMove(dx, dy) {
  if (dx !== 0 && dy !== 0) return false;
  if (dx === 0 && dy === 0) return false;
  if (state.dashCharges <= 0) return false;
  const px = state.player.x;
  const py = state.player.y;
  const mx = px + dx;
  const my = py + dy;
  const ex = px + dx * 2;
  const ey = py + dy * 2;
  if (!inBounds(mx, my) || !inBounds(ex, ey)) return false;
  if (isOccupied(mx, my) || isOccupied(ex, ey)) return false;
  state.player.x = ex;
  state.player.y = ey;
  state.dashCharges -= 1;
  state.oneShotFlash = true;
  hapticLight();
  return true;
}

function afterPlayerActionSequence() {
  if (maybeFinishFloor()) return;
  enemyTurn();
  render();
  maybeFinishFloor();
}

function updateDashButton() {
  if (!dashBtn) return;
  if (state.over || state.transitioning || state.pickingRelic || state.dashCharges <= 0) {
    state.dashArmNextMove = false;
  }
  const n = Math.max(0, state.dashCharges);
  dashBtn.textContent = state.dashArmNextMove
    ? tf("dash.armed", { n })
    : tf("dash.idle", { n });
  const block =
    state.over || state.transitioning || state.pickingRelic || n <= 0;
  dashBtn.disabled = block;
  dashBtn.classList.toggle(
    "dash-armed",
    Boolean(state.dashArmNextMove && n > 0 && !block)
  );
}

function spawnFloor() {
  state.damageTakenThisFloor = 0;
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
  hpEl.textContent = tf("stats.hpLine", { n: state.hp });
  scrapEl.textContent = tf("stats.scrapLine", { n: state.scrap });
  floorEl.textContent = tf("stats.floorLine", {
    cur: state.floor,
    total: totalFloors,
    diff: preset.label
  });
  updateDashButton();
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
      over: state.over,
      runStartedAt: state.runStartedAt,
      damageTakenThisFloor: state.damageTakenThisFloor
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
    if (!P.isValidSavePayload(data)) {
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
    state.pickingRelic = false;
    state.dashArmNextMove = false;
    state.runStartedAt =
      typeof data.runStartedAt === "number" ? data.runStartedAt : Date.now();
    state.damageTakenThisFloor =
      typeof data.damageTakenThisFloor === "number" ? data.damageTakenThisFloor : 0;
    initRunRng();

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
  const locale = safe.locale === "en" ? "en" : "ru";
  const theme = ["default", "neon", "amber"].includes(safe.theme) ? safe.theme : DEFAULT_SETTINGS.theme;
  const runMode = safe.runMode === "daily" ? "daily" : "random";
  return {
    uiScale: normalizedScale,
    difficulty,
    locale,
    theme,
    runMode,
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
    const th = normalizeSettings(settings).theme;
    if (th === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", th);
    }
  } catch (e) {
    console.error("Failed to apply settings", e);
  }
}

function getDifficultyPreset() {
  const settings = loadSettings();
  const key = ["easy", "normal", "hard"].includes(settings.difficulty) ? settings.difficulty : "normal";
  const base = difficultyPresets[key] || difficultyPresets.normal;
  return {
    ...base,
    key,
    label: getPresetLabel(key)
  };
}

function openSettings() {
  let settings = loadSettings();
  const S = getLocaleBundle().settings;
  const modalBody = `
    <p>${S.intro}</p>
    <h3>${S.languageHeading}</h3>
    <p>
      <label>
        ${S.languageHint}
        <select id="localeSelect">
          <option value="ru">${S.languageRu}</option>
          <option value="en">${S.languageEn}</option>
        </select>
      </label>
    </p>
    <h3>${S.difficultyHeading}</h3>
    <p>
      <label>
        ${S.presetLabel}
        <select id="difficultySelect">
          <option value="easy">${tf("presets.easy")}</option>
          <option value="normal">${tf("presets.normal")}</option>
          <option value="hard">${tf("presets.hard")}</option>
        </select>
      </label>
    </p>
    <h3>${S.uiScaleHeading}</h3>
    <p>
      <label>
        ${S.scaleLabel}
        <select id="uiScaleSelect">
          <option value="0.9">90%</option>
          <option value="1">100%</option>
          <option value="1.1">110%</option>
          <option value="1.25">125%</option>
        </select>
      </label>
    </p>
    <h3>${S.soundHeading}</h3>
    <p>
      <label>
        <input id="soundToggle" type="checkbox" />
        ${S.soundOn}
      </label>
    </p>
    <p>
      <label>
        ${S.volumeLabel}
        <input id="volumeRange" type="range" min="0" max="100" step="1" />
        <span id="volumeValue"></span>
      </label>
    </p>
    <h3>${S.themeHeading}</h3>
    <p>
      <label>
        ${S.themeHint}
        <select id="themeSelect">
          <option value="default">${S.themeDefault}</option>
          <option value="neon">${S.themeNeon}</option>
          <option value="amber">${S.themeAmber}</option>
        </select>
      </label>
    </p>
    <h3>${S.runModeHeading}</h3>
    <p>
      <label>
        ${S.runModeHint}
        <select id="runModeSelect">
          <option value="random">${S.runModeRandom}</option>
          <option value="daily">${S.runModeDaily}</option>
        </select>
      </label>
    </p>
    <h3>${S.progressHeading}</h3>
    <p>${S.progressHint}</p>
    <button id="settingsApplyBtn" type="button">${S.applyDifficulty}</button>
    <button id="settingsResetRunBtn" type="button">${S.resetRun}</button>
  `;

  if (!infoModal || !infoModalTitle || !infoModalBody) return;
  infoModalTitle.textContent = S.title;
  infoModalBody.innerHTML = modalBody;
  infoModal.classList.remove("hidden");

  const uiScaleSelect = document.getElementById("uiScaleSelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const localeSelect = document.getElementById("localeSelect");
  const soundToggle = document.getElementById("soundToggle");
  const volumeRange = document.getElementById("volumeRange");
  const volumeValue = document.getElementById("volumeValue");
  const themeSelect = document.getElementById("themeSelect");
  const runModeSelect = document.getElementById("runModeSelect");
  if (uiScaleSelect) {
    uiScaleSelect.value = String(settings.uiScale);
  }
  if (difficultySelect) {
    difficultySelect.value = settings.difficulty;
  }
  if (localeSelect) {
    localeSelect.value = settings.locale === "en" ? "en" : "ru";
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
  if (themeSelect) {
    themeSelect.value = settings.theme === "amber" || settings.theme === "neon" ? settings.theme : "default";
  }
  if (runModeSelect) {
    runModeSelect.value = settings.runMode === "daily" ? "daily" : "random";
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

  localeSelect?.addEventListener("change", () => {
    settings = {
      ...settings,
      locale: localeSelect.value === "en" ? "en" : "ru"
    };
    saveSettings(settings);
    applyLocaleToDom();
    playSfx("ui");
    closeInfoModal();
    openSettings();
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

  themeSelect?.addEventListener("change", () => {
    settings = {
      ...settings,
      theme: themeSelect.value === "neon" || themeSelect.value === "amber" ? themeSelect.value : "default"
    };
    saveSettings(settings);
    applySettingsToUi(settings);
  });

  runModeSelect?.addEventListener("change", () => {
    settings = {
      ...settings,
      runMode: runModeSelect.value === "daily" ? "daily" : "random"
    };
    saveSettings(settings);
    initRunRng();
  });

  const applyBtn = document.getElementById("settingsApplyBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      playSfx("ui");
      closeInfoModal();
      resetGame();
      const preset = getDifficultyPreset();
      setLog(tf("logs.difficultyRestart", { label: preset.label }));
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
  const loc = getLocaleBundle().meta?.dateLocale || "ru-RU";
  const formattedTime = m.lastPlayedAt
    ? new Date(m.lastPlayedAt).toLocaleString(loc)
    : tf("statsModal.never");
  const sm = getLocaleBundle().statsModal;
  const ach = m.achievements || {};
  const achBundle = getLocaleBundle().achievements || {};
  const achKeys = ["first_win", "first_boss_kill", "flawless_floor1"];
  const unlocked = achKeys.filter((k) => ach[k]);
  const achBlock =
    unlocked.length === 0
      ? `<p class="stats-achievements-none">${sm.achievementsNone}</p>`
      : `<div class="achievement-chips">${unlocked
          .map(
            (k) =>
              `<span class="achievement-chip">${achBundle[k] || k}</span>`
          )
          .join("")}</div>`;
  infoModalTitle.textContent = sm.title;
  infoModalBody.innerHTML = `
    <h3>${sm.section}</h3>
    <ul>
      <li>${tf("statsModal.runs", { n: m.runs })}</li>
      <li>${tf("statsModal.wins", { n: m.wins })}</li>
      <li>${tf("statsModal.defeats", { n: m.defeats })}</li>
      <li>${tf("statsModal.maxFloor", { m: m.maxFloorReached, t: totalFloors })}</li>
      <li>${tf("statsModal.lastPlay", { when: formattedTime })}</li>
    </ul>
    <h3>${sm.achievementsSection}</h3>
    ${achBlock}
  `;
  infoModal.classList.remove("hidden");
}

function openInfoModal(screenKey) {
  try {
    const screen = getInfoScreens()[screenKey];
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
    const b = getLocaleBundle().bug;
    const title = document.getElementById("bugTitleInput")?.value?.trim() || b.defaultTitle;
    const steps = document.getElementById("bugStepsInput")?.value?.trim() || b.unset;
    const expected = document.getElementById("bugExpectedInput")?.value?.trim() || b.unset;
    const actual = document.getElementById("bugActualInput")?.value?.trim() || b.unset;
    const contact = document.getElementById("bugContactInput")?.value?.trim() || b.noContact;
    const platform = navigator.userAgent || "unknown";
    const currentUrl = window.location.href;
    return {
      title,
      text: [
        `${b.lblTitle} ${title}`,
        "",
        `${b.lblSteps}`,
        steps,
        "",
        `${b.lblExpected}`,
        expected,
        "",
        `${b.lblActual}`,
        actual,
        "",
        `${b.lblContact}`,
        contact,
        "",
        `${b.lblTech}`,
        `${b.lblUrl} ${currentUrl}`,
        `${b.lblUa} ${platform}`,
        `${b.lblFloor} ${state.floor}/${totalFloors}`,
        `${b.lblHp} ${state.hp}`,
        `${b.lblScrap} ${state.scrap}`,
        `${b.lblState} ${state.over ? b.stateOver : b.stateRun}`
      ].join("\n")
    };
  } catch (e) {
    console.error("Failed to build bug report text", e);
    const b = getLocaleBundle().bug;
    return { title: b.buildFailTitle, text: b.buildFailText };
  }
}

function validateBugReportForm() {
  try {
    const b = getLocaleBundle().bug;
    const titleEl = document.getElementById("bugTitleInput");
    const stepsEl = document.getElementById("bugStepsInput");
    const expectedEl = document.getElementById("bugExpectedInput");
    const actualEl = document.getElementById("bugActualInput");
    const fields = [titleEl, stepsEl, expectedEl, actualEl].filter(Boolean);

    fields.forEach((field) => field.classList.remove("field-error"));

    const errors = [];
    if (!titleEl || titleEl.value.trim().length < 6) {
      errors.push(b.valTitle);
      titleEl?.classList.add("field-error");
    }
    if (!stepsEl || stepsEl.value.trim().length < 10) {
      errors.push(b.valSteps);
      stepsEl?.classList.add("field-error");
    }
    if (!expectedEl || expectedEl.value.trim().length < 6) {
      errors.push(b.valExpected);
      expectedEl?.classList.add("field-error");
    }
    if (!actualEl || actualEl.value.trim().length < 6) {
      errors.push(b.valActual);
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
      message: getLocaleBundle().bug.valGeneric
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
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.copyOk;
          playSfx("ui");
        } catch (e) {
          console.error("Failed to copy bug report", e);
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.copyFail;
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
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.issueOk;
          playSfx("ui");
        } catch (e) {
          console.error("Failed to open github issue page", e);
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.issueFail;
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
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.mailOk;
          playSfx("ui");
        } catch (e) {
          console.error("Failed to open mailto", e);
          if (statusEl) statusEl.textContent = getLocaleBundle().bug.mailFail;
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
  const doFlash = Boolean(state.oneShotFlash);
  state.oneShotFlash = false;
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
  if (doFlash) {
    flashPlayerTile();
  }
}

function attackEnemy(enemy) {
  const preset = getDifficultyPreset();
  enemy.hp -= state.playerDamage;
  playSfx("attack");
  hapticLight();
  setLog(tf("logs.hit", { dmg: state.playerDamage }));
  if (enemy.hp <= 0) {
    const baseScrap = enemy.boss ? 5 : 2;
    const gainedScrap = Math.max(1, Math.round(baseScrap * preset.scrapMultiplier));
    state.scrap += gainedScrap;
    const gain = formatTrophies(gainedScrap);
    if (enemy.boss) {
      unlockAchievement("first_boss_kill");
    }
    setLog(
      enemy.boss
        ? tf("logs.bossKill", { gain })
        : tf("logs.enemyKill", { gain })
    );
  }
}

function enemyTurn() {
  for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
    const dist = manhattan(enemy, state.player);
    if (dist === 1) {
      const prevHp = state.hp;
      state.hp -= enemy.damage;
      state.damageTakenThisFloor += Math.max(0, prevHp - state.hp);
      playSfx("hit");
      hapticMedium();
      if (state.hp <= 0) {
        finishRunAsDefeat({ killedByBoss: Boolean(enemy.boss) });
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
  return P.floorCleared(state.enemies);
}

function formatRunDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m <= 0) return tf("runSummary.durationFmtShort", { s: sec });
  return tf("runSummary.durationFmt", { m, s: sec });
}

function closeRunSummary() {
  try {
    if (!runSummaryModal) return;
    runSummaryModal.classList.add("hidden");
    runSummaryModal.setAttribute("aria-hidden", "true");
  } catch (e) {
    console.error("Failed to close run summary", e);
  }
}

function openRunSummary(opts) {
  const rs = getLocaleBundle().runSummary;
  if (!runSummaryModal || !rs) return;
  const win = opts.outcome === "win";
  if (runSummaryTitle) runSummaryTitle.textContent = win ? rs.winTitle : rs.defeatTitle;
  if (runSummaryReason) {
    if (win) {
      runSummaryReason.textContent = rs.winReason;
    } else {
      const detail =
        opts.killedByBoss === true ? rs.defeatDetailBoss : rs.defeatDetailEnemy;
      runSummaryReason.textContent = `${rs.defeatReason}\n${detail}`;
    }
  }
  if (runSummaryList) {
    runSummaryList.innerHTML = "";
    const mk = (label, value) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      li.appendChild(span);
      li.appendChild(strong);
      runSummaryList.appendChild(li);
    };
    mk(rs.timeLabel, formatRunDuration(opts.durationMs));
    mk(rs.floorLabel, `${opts.floorReached}/${totalFloors}`);
    mk(rs.scrapLabel, formatTrophies(opts.scrap));
  }
  if (runSummaryAgainBtn) runSummaryAgainBtn.textContent = rs.again;
  if (runSummaryStatsBtn) runSummaryStatsBtn.textContent = rs.openStats;
  runSummaryModal.classList.remove("hidden");
  runSummaryModal.setAttribute("aria-hidden", "false");
}

function finishRunAsWin() {
  state.over = true;
  clearSavedGame();
  const metrics = loadMetrics();
  const newWins = metrics.wins + 1;
  patchMetrics({
    wins: newWins,
    maxFloorReached: Math.max(metrics.maxFloorReached, totalFloors),
    lastPlayedAt: new Date().toISOString(),
    achievements: {
      ...(newWins === 1 ? { first_win: true } : {})
    }
  });
  playSfx("win");
  setLog(tf("logs.win", { scrap: formatTrophies(state.scrap) }), "success");
  const durationMs = Math.max(0, Date.now() - (state.runStartedAt || Date.now()));
  showFloorTransition(
    tf("transitions.victoryTitle"),
    tf("transitions.victoryLoot", { scrap: formatTrophies(state.scrap) }),
    "success",
    RESULT_ANNOUNCE_MS
  ).then(() => {
    openRunSummary({
      outcome: "win",
      durationMs,
      floorReached: totalFloors,
      scrap: state.scrap
    });
  });
  render();
  return true;
}

function finishRunAsDefeat(meta = {}) {
  state.over = true;
  clearSavedGame();
  patchMetrics({
    defeats: loadMetrics().defeats + 1,
    lastPlayedAt: new Date().toISOString()
  });
  playSfx("death");
  setLog(tf("logs.defeat"), "danger");
  const durationMs = Math.max(0, Date.now() - (state.runStartedAt || Date.now()));
  showFloorTransition(
    tf("transitions.defeatTitle"),
    tf("transitions.defeatSubtitle"),
    "danger",
    RESULT_ANNOUNCE_MS
  ).then(() => {
    openRunSummary({
      outcome: "defeat",
      durationMs,
      floorReached: state.floor,
      scrap: state.scrap,
      killedByBoss: meta.killedByBoss === true
    });
  });
  render();
}

function startRelicChoiceThenAdvanceToNextFloor() {
  if (state.transitioning || state.over || state.pickingRelic) return;
  state.pickingRelic = true;
  render();
  chooseRelic(() => {
    state.pickingRelic = false;
    render();
    advanceToNextFloor();
  });
}

function advanceToNextFloor() {
  if (state.transitioning) return;
  state.transitioning = true;
  const nextFloor = state.floor + 1;
  setLog(tf("logs.finishedFloor", { floor: state.floor, next: nextFloor }), "info");
  playSfx("transition");

  showFloorTransition(
    tf("transitions.floorBanner", { n: nextFloor }),
    tf("transitions.genericSubtitle"),
    "floor",
    FLOOR_TRANSITION_MS
  ).then(() => {
    if (state.floor === 1 && state.damageTakenThisFloor === 0) {
      unlockAchievement("flawless_floor1");
    }
    state.floor = nextFloor;
    patchMetrics({
      maxFloorReached: Math.max(loadMetrics().maxFloorReached, state.floor),
      lastPlayedAt: new Date().toISOString()
    });
    spawnFloor();
    setLog(
      tf("logs.newFloor", {
        station: getStationByFloor(state.floor),
        floor: state.floor
      }),
      "info"
    );
    state.transitioning = false;
    render();
  });
}

function maybeFinishFloor() {
  if (!samePos(state.player, state.exit)) return false;

  if (state.floor >= totalFloors) {
    return finishRunAsWin();
  }

  startRelicChoiceThenAdvanceToNextFloor();
  return true;
}

function tryUseExit(x, y) {
  const isExit = state.exit.x === x && state.exit.y === y;
  if (!isExit) return false;

  const dist = manhattan(state.player, { x, y });
  // Разрешаем использовать выход, если стоим на нем или рядом с ним.
  if (dist > 1) {
    setLog(tf("logs.exitCloser"));
    return true;
  }

  state.player.x = x;
  state.player.y = y;
  state.oneShotFlash = true;
  hapticLight();
  if (state.floor >= totalFloors) {
    return finishRunAsWin();
  }

  startRelicChoiceThenAdvanceToNextFloor();
  return true;
}

function onTileTap(x, y) {
  if (state.over || state.transitioning || state.pickingRelic) return;
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
    setLog(tf("logs.moveAdjacentOnly"));
    return;
  }

  state.player.x = x;
  state.player.y = y;
  state.oneShotFlash = true;
  hapticLight();
  if (maybeFinishFloor()) return;
  playSfx("move");
  enemyTurn();
  render();
  maybeFinishFloor();
}

function handleSwipeMove(deltaX, deltaY) {
  if (state.over || state.transitioning || state.pickingRelic) return;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX < 24 && absY < 24) return;

  let dx = 0;
  let dy = 0;
  if (absX >= absY) {
    dx = deltaX > 0 ? 1 : -1;
  } else {
    dy = deltaY > 0 ? 1 : -1;
  }

  if (state.dashArmNextMove && state.dashCharges > 0) {
    if (tryDashMove(dx, dy)) {
      state.dashArmNextMove = false;
      playSfx("move");
      afterPlayerActionSequence();
    } else {
      state.dashArmNextMove = false;
      setLog(tf("logs.dashBadPath"));
      playSfx("ui");
    }
    updateDashButton();
    return;
  }

  const targetX = state.player.x + dx;
  const targetY = state.player.y + dy;

  if (!inBounds(targetX, targetY)) {
    setLog(tf("logs.wall"));
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

  grid.addEventListener("touchcancel", () => {
    tracking = false;
  }, { passive: true });

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
    if (state.over || state.transitioning || state.pickingRelic) return;
    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    const inInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
    if (inInput) return;

    const key = String(event.key || "").toLowerCase();
    let dx = 0;
    let dy = 0;
    let dirHandled = true;

    if (key === "arrowleft" || key === "a" || key === "ф") dx = -1;
    else if (key === "arrowright" || key === "d" || key === "в") dx = 1;
    else if (key === "arrowup" || key === "w" || key === "ц") dy = -1;
    else if (key === "arrowdown" || key === "s" || key === "ы") dy = 1;
    else dirHandled = false;

    if (!dirHandled) return;

    if (event.shiftKey) {
      event.preventDefault();
      state.dashArmNextMove = false;
      if (state.dashCharges <= 0) {
        setLog(tf("logs.noDash"));
        playSfx("ui");
        updateDashButton();
        return;
      }
      if (tryDashMove(dx, dy)) {
        playSfx("move");
        afterPlayerActionSequence();
      } else {
        setLog(tf("logs.dashBadPath"));
        playSfx("ui");
      }
      updateDashButton();
      return;
    }

    event.preventDefault();

    const targetX = state.player.x + dx;
    const targetY = state.player.y + dy;

    if (!inBounds(targetX, targetY)) {
      setLog(tf("logs.wall"));
      return;
    }
    onTileTap(targetX, targetY);
  });
}

function resetGame() {
  closeRunSummary();
  const preset = getDifficultyPreset();
  clearSavedGame();
  initRunRng();
  state.runStartedAt = Date.now();
  state.damageTakenThisFloor = 0;
  state.oneShotFlash = false;
  state.floor = 1;
  state.hp = preset.playerHp;
  state.scrap = 0;
  state.playerDamage = preset.playerDamage;
  state.dashCharges = 0;
  state.over = false;
  state.transitioning = false;
  state.pickingRelic = false;
  state.dashArmNextMove = false;
  spawnFloor();
  const metrics = loadMetrics();
  patchMetrics({
    runs: metrics.runs + 1,
    maxFloorReached: Math.max(metrics.maxFloorReached, 1),
    lastPlayedAt: new Date().toISOString()
  });
  setLog(
    tf("logs.startRun", {
      station: getStationByFloor(state.floor),
      lives: formatLives(state.hp)
    })
  );
  render();
}

function pickTwoRelics() {
  const bag = [...relicPool];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(gameRand01() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag.slice(0, 2);
}

function chooseRelic(onChosen) {
  if (!relicModal || !relicOptions) {
    onChosen();
    return;
  }
  relicOptions.innerHTML = "";
  relicModal.classList.remove("hidden");
  const options = pickTwoRelics();

  options.forEach((relic) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "relic-btn";
    btn.textContent = getRelicDisplayName(relic);
    btn.addEventListener("click", () => {
      relic.apply(state);
      relicModal.classList.add("hidden");
      setLog(tf("logs.relicTaken", { name: getRelicDisplayName(relic) }));
      playSfx("ui");
      onChosen();
    });
    relicOptions.appendChild(btn);
  });
}

endTurnBtn.addEventListener("click", () => {
  if (state.over || state.pickingRelic) return;
  enemyTurn();
  render();
  maybeFinishFloor();
});

if (dashBtn) {
  dashBtn.addEventListener("click", async () => {
    await unlockAudio();
    if (state.over || state.transitioning || state.pickingRelic) return;
    playSfx("ui");
    if (state.dashCharges <= 0) {
      setLog(tf("logs.noDashBoots"));
      updateDashButton();
      return;
    }
    state.dashArmNextMove = !state.dashArmNextMove;
    if (state.dashArmNextMove) {
      setLog(tf("logs.dashArmOn"));
    } else {
      setLog(tf("logs.dashArmOff"));
    }
    updateDashButton();
  });
}

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

if (runSummaryModal) {
  runSummaryModal.addEventListener("click", (event) => {
    if (event.target === runSummaryModal) {
      closeRunSummary();
    }
  });
}
if (runSummaryAgainBtn) {
  runSummaryAgainBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    closeRunSummary();
    resetGame();
  });
}
if (runSummaryStatsBtn) {
  runSummaryStatsBtn.addEventListener("click", async () => {
    await unlockAudio();
    playSfx("ui");
    closeRunSummary();
    openStatsModal();
  });
}

function initGame() {
  applySettingsToUi(loadSettings());
  const restored = loadGame();
  if (restored) {
    setLog(tf("logs.continueRun"));
    render();
    return;
  }

  resetGame();
}

function boot() {
  syncAudioDebugIndicator();
  applyLocaleToDom();
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

    splashStartBtn.addEventListener("click", async () => {
      await unlockAudio();
      await playSfx("ui");
      splashScreen.classList.add("hidden");
      splashScreen.style.display = "none";
      appRoot.classList.remove("hidden");
      appRoot.style.display = "";
      initGame();
    });

    if (splashHowToBtn) {
      splashHowToBtn.addEventListener("click", async () => {
        await unlockAudio();
        await playSfx("ui");
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
