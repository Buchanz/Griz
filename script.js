const cards = Array.from(document.querySelectorAll(".album-card"));
const aboutLink = document.getElementById("aboutLink");
const eventsLink = document.getElementById("eventsLink");
const eventsOverlay = document.getElementById("eventsOverlay");
const closeEvents = document.getElementById("closeEvents");
const overlayButtons = Array.from(document.querySelectorAll(".album-pill[data-open-overlay]"));
const detailOverlays = Array.from(document.querySelectorAll(".detail-overlay"));
const detailCloseButtons = Array.from(document.querySelectorAll(".detail-close"));
const detailNavButtons = Array.from(document.querySelectorAll(".detail-nav"));
const homePrev = document.getElementById("homePrev");
const homeNext = document.getElementById("homeNext");
const albumTrack = document.getElementById("albumTrack");
const aboutOverlay = document.getElementById("aboutOverlay");
const eventsList = eventsOverlay?.querySelector(".events-list") || null;
const playPauseBtn = document.getElementById("playPauseBtn");
const prevTrackBtn = document.getElementById("prevTrackBtn");
const nextTrackBtn = document.getElementById("nextTrackBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const spotifyAuthBtn = document.getElementById("spotifyAuthBtn");
const youtubePlayerHost = document.getElementById("youtubePlayerHost");
const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerSubtitle = document.getElementById("playerSubtitle");
const playerProgress = document.getElementById("playerProgress");
const playerCurrent = document.getElementById("playerCurrent");
const playerDuration = document.getElementById("playerDuration");
const detailOverlayOrder = [
  "sidequestOverlay",
  "ouroOverlay",
  "cgh4Overlay",
  "rainbowOverlay",
  "cgh3Overlay",
  "ridewavesOverlay",
  "goodwillOverlay",
  "sayitloudOverlay",
  "rebeleraOverlay",
  "madOverlay",
]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const overlayToHomeIndex = {
  sidequestOverlay: 0,
  ouroOverlay: 1,
  cgh4Overlay: 2,
  rainbowOverlay: 3,
  cgh3Overlay: 4,
  ridewavesOverlay: 5,
  goodwillOverlay: 6,
  sayitloudOverlay: 7,
  rebeleraOverlay: 8,
  madOverlay: 9,
};

let activeIndex = 0;
const currentStates = new Array(cards.length).fill("hidden");
let suppressHomeCardClick = false;
let isShuffleOn = false;
let spotifyPlayer = null;
let spotifyDeviceId = null;
let spotifyToken = null;
let spotifyProgressTimer = null;
let spotifyStateSnapshot = null;
let playerMode = "youtube";
let youtubePlayer = null;
let youtubeReady = false;
let youtubeProgressTimer = null;
let currentYouTubeTrackIndex = -1;
let detailOverlaySwitching = false;
let carouselSyncTimer = null;
let centeredReadyTimer = null;
let eventsRefreshTimer = null;

const SPOTIFY_CONFIG = {
  clientId: "6789ef7450fb41dc939104ee025bd65c",
  redirectUri: "http://127.0.0.1:5500",
  scopes: [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ],
};
const TOKEN_STORAGE_KEY = "griz_spotify_token_v1";
const VERIFIER_STORAGE_KEY = "griz_spotify_verifier_v1";
const STATE_STORAGE_KEY = "griz_spotify_state_v1";
const SIDEQUEST_MIX = {
  videoId: "-GFzEz6jpos",
  cover: "assets/SideQuestCover.jpeg",
  albumLabel: "GRiZ — Side Quest (Mix)",
  tracks: [
    { title: "ID1 / In Da Getto (Mixed)", duration: "2:56" },
    { title: "2-step Nassau (Mixed)", duration: "2:24" },
    { title: "Oh (feat. Ludacris) [GRiZ Remix] [Mixed]", duration: "2:03" },
    { title: "ID2 / BEIGE BUTTER (Mixed)", duration: "1:50" },
    { title: "ID3 (Mixed)", duration: "1:32" },
    { title: "Cockney Thug (GRiZ Remix) [Mixed]", duration: "2:05" },
    { title: "ID4 / Fever (Mixed)", duration: "2:58" },
    { title: "ID5 (Mixed)", duration: "3:02" },
    { title: "ID6 / Style / HAWT (GRiZ Remix) [Mixed]", duration: "2:07" },
    { title: "Feeling Good / Are You That Somebody (GRiZ Remix) [Mixed]", duration: "3:29" },
    { title: "Weekend (feat. Miguel) [GRiZ Remix] [Mixed]", duration: "2:52" },
    { title: "Love Sensation (GRiZ Remix) [Mixed]", duration: "1:39" },
    { title: "Gonna Make You Sweat / BEATS FOR THE UNDERGROUND (GRiZ Remix) [Mixed]", duration: "2:21" },
    { title: "Show Out (GRiZ Remix) [Mixed]", duration: "1:37" },
    { title: "I Remember (GRiZ Remix) [Mixed]", duration: "3:47" },
    { title: "Low Rider / I Get the Bag (GRiZ Remix) [Mixed]", duration: "2:22" },
    { title: "Peso (GRiZ Remix) [Mixed]", duration: "2:21" },
    { title: "Diva (GRiZ Remix) [Mixed]", duration: "1:33" },
    { title: "Beba / HIGHJACK (GRiZ Remix) [Mixed]", duration: "1:34" },
    { title: "FE!N (GRiZ Remix) [Mixed]", duration: "1:14" },
    { title: "Narcos (GRiZ Remix) [Mixed]", duration: "2:17" },
    { title: "Go Back (GRiZ Remix) [Mixed]", duration: "3:19" },
  ],
};

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function durationToSeconds(raw) {
  const [mins, secs] = String(raw || "0:00")
    .split(":")
    .map((piece) => Number(piece || 0));
  return mins * 60 + secs;
}

const sidequestTimeline = SIDEQUEST_MIX.tracks.reduce((acc, track, index) => {
  const previous = index === 0 ? 0 : acc[index - 1].start + acc[index - 1].duration;
  acc.push({
    ...track,
    start: previous,
    duration: durationToSeconds(track.duration),
  });
  return acc;
}, []);

function extractDominantRgb(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const sampleSize = 24;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  const candidates = [];

  const rgbToHsl = (r, g, b) => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta > 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case rn:
          h = ((gn - bn) / delta) % 6;
          break;
        case gn:
          h = (bn - rn) / delta + 2;
          break;
        default:
          h = (rn - gn) / delta + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s, l };
  };

  const hslToRgb = (h, s, l) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rp = 0;
    let gp = 0;
    let bp = 0;

    if (h < 60) {
      rp = c;
      gp = x;
    } else if (h < 120) {
      rp = x;
      gp = c;
    } else if (h < 180) {
      gp = c;
      bp = x;
    } else if (h < 240) {
      gp = x;
      bp = c;
    } else if (h < 300) {
      rp = x;
      bp = c;
    } else {
      rp = c;
      bp = x;
    }

    return {
      r: Math.round((rp + m) * 255),
      g: Math.round((gp + m) * 255),
      b: Math.round((bp + m) * 255),
    };
  };

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 20) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { s, l } = rgbToHsl(r, g, b);

    if (s < 0.16 || l < 0.1 || l > 0.9) continue;
    const score = s * (1 - Math.abs(l - 0.52));
    candidates.push({ r, g, b, score });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const picked = candidates.slice(0, Math.min(36, candidates.length));
  const avg = picked.reduce(
    (acc, entry) => {
      acc.r += entry.r;
      acc.g += entry.g;
      acc.b += entry.b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  const baseR = Math.round(avg.r / picked.length);
  const baseG = Math.round(avg.g / picked.length);
  const baseB = Math.round(avg.b / picked.length);
  const hsl = rgbToHsl(baseR, baseG, baseB);

  const boosted = hslToRgb(
    hsl.h,
    Math.min(0.95, Math.max(0.58, hsl.s * 1.25)),
    Math.min(0.6, Math.max(0.42, hsl.l * 1.03))
  );

  return `${boosted.r}, ${boosted.g}, ${boosted.b}`;
}

function applyImageShadowTint(selector, hostSelector) {
  const images = Array.from(document.querySelectorAll(selector));
  images.forEach((img) => {
    const applyTint = () => {
      const rgb = extractDominantRgb(img);
      if (!rgb) return;
      const host = img.closest(hostSelector);
      if (host) host.style.setProperty("--img-shadow-rgb", rgb);
    };

    if (img.complete && img.naturalWidth > 0) {
      applyTint();
    } else {
      img.addEventListener("load", applyTint, { once: true });
    }
  });
}

function getSidequestTrackIndexByTime(currentSeconds) {
  for (let i = sidequestTimeline.length - 1; i >= 0; i -= 1) {
    if (currentSeconds >= sidequestTimeline[i].start) return i;
  }
  return 0;
}

function updateProgressFill(value) {
  if (!playerProgress) return;
  const pct = Math.max(0, Math.min(100, value));
  playerProgress.style.setProperty("--progress-pct", `${pct}%`);
}

function parseEventDateToken(rawToken) {
  if (!rawToken) return null;
  const token = rawToken.trim().toUpperCase();
  const match = token.match(/^([A-Z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) return null;

  const monthMap = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  const month = monthMap[match[1]];
  if (month === undefined) return null;
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year)) return null;

  return new Date(year, month, day);
}

function getEventEndDate(row) {
  const dateNode = row?.querySelector(".event-primary");
  const raw = dateNode?.textContent?.trim();
  if (!raw) return null;

  const parts = raw.split(/\s*-\s*/).map((piece) => piece.trim()).filter(Boolean);
  const lastToken = parts[parts.length - 1] || "";
  return parseEventDateToken(lastToken) || parseEventDateToken(parts[0] || "");
}

function refreshEventsByDate() {
  if (!eventsList) return;
  const rows = Array.from(eventsList.querySelectorAll(".event-row"));
  if (!rows.length) return;

  const now = new Date();
  let visibleCount = 0;

  rows.forEach((row) => {
    const endDate = getEventEndDate(row);
    if (!endDate) {
      row.hidden = false;
      visibleCount += 1;
      return;
    }
    const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    const isPast = endOfDay < now;
    row.hidden = isPast;
    if (!isPast) visibleCount += 1;
  });

  eventsList.style.gridTemplateRows = `repeat(${Math.max(visibleCount, 1)}, minmax(0, 1fr))`;
}

function startEventsAutoRefresh() {
  refreshEventsByDate();
  if (eventsRefreshTimer) window.clearInterval(eventsRefreshTimer);
  eventsRefreshTimer = window.setInterval(refreshEventsByDate, 60 * 1000);
}

function setDefaultPlayerMeta() {
  if (playerCover) playerCover.src = SIDEQUEST_MIX.cover;
  if (playerTitle) playerTitle.textContent = sidequestTimeline[0]?.title || "Side Quest Mix";
  if (playerSubtitle) playerSubtitle.textContent = SIDEQUEST_MIX.albumLabel;
  if (playerCurrent) playerCurrent.textContent = "0:00";
  if (playerDuration) playerDuration.textContent = "0:00";
  if (playerProgress) playerProgress.value = "0";
  updateProgressFill(0);
}

function updatePlayButton(isPaused = true) {
  if (!playPauseBtn) return;
  playPauseBtn.textContent = isPaused ? "▶" : "❚❚";
}

function renderSpotifyAuthState(state) {
  if (!spotifyAuthBtn) return;
  spotifyAuthBtn.classList.remove("is-connected");
  spotifyAuthBtn.disabled = false;
  if (state === "connecting") {
    spotifyAuthBtn.textContent = "Connecting...";
    spotifyAuthBtn.disabled = true;
    return;
  }
  if (state === "connected") {
    spotifyAuthBtn.textContent = "Spotify On";
    spotifyAuthBtn.classList.add("is-connected");
    return;
  }
  spotifyAuthBtn.textContent = "Use Spotify";
}

function getStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function persistToken(tokenPayload) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenPayload));
}

function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  spotifyToken = null;
}

function isTokenExpired(tokenPayload) {
  if (!tokenPayload?.expires_at) return true;
  return Date.now() >= tokenPayload.expires_at - 45_000;
}

function toBase64Url(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (value) => chars[value % chars.length]).join("");
}

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toBase64Url(digest);
}

function getAuthUrl(challenge, state) {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: "code",
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SPOTIFY_CONFIG.scopes.join(" "),
    state,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function requestToken(params) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!response.ok) {
    throw new Error(`Spotify token request failed (${response.status})`);
  }
  return response.json();
}

async function refreshSpotifyToken() {
  if (!spotifyToken?.refresh_token) throw new Error("Missing refresh token");
  const refreshed = await requestToken({
    grant_type: "refresh_token",
    refresh_token: spotifyToken.refresh_token,
    client_id: SPOTIFY_CONFIG.clientId,
  });
  spotifyToken = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || spotifyToken.refresh_token,
    expires_at: Date.now() + (refreshed.expires_in || 3600) * 1000,
  };
  persistToken(spotifyToken);
  return spotifyToken.access_token;
}

async function getValidAccessToken() {
  if (!spotifyToken) spotifyToken = getStoredToken();
  if (!spotifyToken) return null;
  if (isTokenExpired(spotifyToken)) {
    try {
      await refreshSpotifyToken();
    } catch (error) {
      clearToken();
      renderSpotifyAuthState("disconnected");
      return null;
    }
  }
  return spotifyToken.access_token;
}

async function spotifyFetch(url, options = {}) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("No access token");
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
}

async function startSpotifyAuth() {
  const verifier = randomString(96);
  const state = randomString(16);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
  const challenge = await generateCodeChallenge(verifier);
  window.location.assign(getAuthUrl(challenge, state));
}

async function handleSpotifyAuthRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    renderSpotifyAuthState("disconnected");
    return;
  }
  if (!code) return;

  const storedState = sessionStorage.getItem(STATE_STORAGE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  if (!verifier || !state || state !== storedState) {
    throw new Error("Spotify auth state mismatch");
  }

  const tokenResponse = await requestToken({
    client_id: SPOTIFY_CONFIG.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    code_verifier: verifier,
  });

  spotifyToken = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
  };
  persistToken(spotifyToken);

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function updatePlayerFromSpotifyState(state) {
  spotifyStateSnapshot = state;
  if (!state) {
    updatePlayButton(true);
    return;
  }

  const currentTrack = state.track_window?.current_track;
  const durationMs = state.duration || 0;
  const positionMs = state.position || 0;

  if (currentTrack) {
    if (playerTitle) playerTitle.textContent = currentTrack.name || "Unknown Track";
    const artistName = (currentTrack.artists || []).map((artist) => artist.name).join(", ");
    const albumName = currentTrack.album?.name || "Unknown Album";
    if (playerSubtitle) playerSubtitle.textContent = `${artistName} — ${albumName}`;
    const art = currentTrack.album?.images?.[0]?.url;
    if (art && playerCover) playerCover.src = art;
  }

  if (playerCurrent) playerCurrent.textContent = formatTime(positionMs / 1000);
  if (playerDuration) playerDuration.textContent = formatTime(durationMs / 1000);
  const pct = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  if (playerProgress) playerProgress.value = String(pct);
  updateProgressFill(pct);
  updatePlayButton(Boolean(state.paused));
}

function startSpotifyProgressTimer() {
  if (spotifyProgressTimer) window.clearInterval(spotifyProgressTimer);
  spotifyProgressTimer = window.setInterval(() => {
    if (!spotifyStateSnapshot || spotifyStateSnapshot.paused) return;
    const nextPosition = Math.min(
      (spotifyStateSnapshot.position || 0) + 500,
      spotifyStateSnapshot.duration || 0
    );
    spotifyStateSnapshot = { ...spotifyStateSnapshot, position: nextPosition };
    updatePlayerFromSpotifyState(spotifyStateSnapshot);
  }, 500);
}

async function loadSpotifySdk() {
  if (window.Spotify?.Player) return;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existing) {
      const previousReady = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        previousReady?.();
        resolve();
      };
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Spotify SDK"));
    document.head.appendChild(script);
  });
}

async function transferPlaybackToWebPlayer(deviceId) {
  const response = await spotifyFetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    body: JSON.stringify({
      device_ids: [deviceId],
      play: false,
    }),
  });
  if (!response.ok && response.status !== 202 && response.status !== 204) {
    throw new Error("Could not transfer playback to web player");
  }
}

async function initializeSpotifyPlayer() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;
  renderSpotifyAuthState("connecting");

  await loadSpotifySdk();
  if (!window.Spotify?.Player) throw new Error("Spotify SDK unavailable");

  if (spotifyPlayer) {
    spotifyPlayer.disconnect();
  }

  spotifyPlayer = new window.Spotify.Player({
    name: "assets/GrizSite Player",
    getOAuthToken: async (callback) => {
      const token = await getValidAccessToken();
      callback(token || "");
    },
    volume: 0.78,
  });

  spotifyPlayer.addListener("ready", async ({ device_id }) => {
    spotifyDeviceId = device_id;
    renderSpotifyAuthState("connected");
    try {
      await transferPlaybackToWebPlayer(device_id);
    } catch (error) {
      // keep UI connected even if transfer fails due to no active playback.
    }
  });

  spotifyPlayer.addListener("not_ready", () => {
    renderSpotifyAuthState("disconnected");
  });

  spotifyPlayer.addListener("player_state_changed", (state) => {
    if (state) {
      updatePlayerFromSpotifyState(state);
    }
  });

  spotifyPlayer.addListener("initialization_error", ({ message }) => {
    console.error("Spotify player init error:", message);
    renderSpotifyAuthState("disconnected");
  });

  spotifyPlayer.addListener("authentication_error", ({ message }) => {
    console.error("Spotify auth error:", message);
    clearToken();
    renderSpotifyAuthState("disconnected");
  });

  spotifyPlayer.addListener("account_error", ({ message }) => {
    console.error("Spotify account error:", message);
    renderSpotifyAuthState("disconnected");
  });

  const connected = await spotifyPlayer.connect();
  if (!connected) {
    renderSpotifyAuthState("disconnected");
    return;
  }
  startSpotifyProgressTimer();
}

async function spotifyPlayPause() {
  if (!spotifyPlayer) {
    await initializeSpotifyPlayer();
    return;
  }
  await spotifyPlayer.togglePlay();
}

async function spotifyNextTrack() {
  if (!spotifyPlayer) return;
  await spotifyPlayer.nextTrack();
}

async function spotifyPrevTrack() {
  if (!spotifyPlayer) return;
  await spotifyPlayer.previousTrack();
}

async function spotifySetShuffle(nextState) {
  if (!spotifyDeviceId) return;
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/me/player/shuffle?state=${String(nextState)}&device_id=${encodeURIComponent(spotifyDeviceId)}`,
    { method: "PUT" }
  );
  if (!response.ok && response.status !== 202 && response.status !== 204) {
    throw new Error("Failed to set shuffle");
  }
}

function stopYouTubeProgressTimer() {
  if (youtubeProgressTimer) {
    window.clearInterval(youtubeProgressTimer);
    youtubeProgressTimer = null;
  }
}

function updateYouTubeTrackMeta(currentSeconds) {
  const nextTrackIndex = getSidequestTrackIndexByTime(currentSeconds);
  if (nextTrackIndex === currentYouTubeTrackIndex) return;
  currentYouTubeTrackIndex = nextTrackIndex;
  const currentTrack = sidequestTimeline[nextTrackIndex];
  if (!currentTrack) return;
  if (playerTitle) playerTitle.textContent = currentTrack.title;
  if (playerSubtitle) playerSubtitle.textContent = SIDEQUEST_MIX.albumLabel;
  if (playerCover) playerCover.src = SIDEQUEST_MIX.cover;
}

function syncYouTubeProgress() {
  if (!youtubePlayer || !youtubeReady) return;
  const currentSeconds = youtubePlayer.getCurrentTime?.() || 0;
  const durationSeconds = youtubePlayer.getDuration?.() || 0;
  updateYouTubeTrackMeta(currentSeconds);
  if (playerCurrent) playerCurrent.textContent = formatTime(currentSeconds);
  if (playerDuration) playerDuration.textContent = formatTime(durationSeconds);
  const pct = durationSeconds > 0 ? (currentSeconds / durationSeconds) * 100 : 0;
  if (playerProgress) playerProgress.value = String(pct);
  updateProgressFill(pct);
}

function startYouTubeProgressTimer() {
  stopYouTubeProgressTimer();
  youtubeProgressTimer = window.setInterval(syncYouTubeProgress, 250);
}

async function loadYouTubeApi() {
  if (window.YT?.Player) return;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve();
      };
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube API"));
    document.head.appendChild(script);
  });
}

async function ensureYouTubePlayer() {
  if (youtubePlayer) return;
  await loadYouTubeApi();

  await new Promise((resolve) => {
    youtubePlayer = new window.YT.Player("youtubePlayerHost", {
      width: "240",
      height: "240",
      videoId: SIDEQUEST_MIX.videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          youtubeReady = true;
          youtubePlayer.cueVideoById(SIDEQUEST_MIX.videoId);
          syncYouTubeProgress();
          resolve();
        },
        onError: () => {
          resolve();
        },
        onStateChange: (event) => {
          const isPlaying = event.data === window.YT.PlayerState.PLAYING;
          if (isPlaying) {
            startYouTubeProgressTimer();
            syncYouTubeProgress();
            updatePlayButton(false);
            return;
          }
          if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            stopYouTubeProgressTimer();
            syncYouTubeProgress();
            updatePlayButton(true);
          }
        },
      },
    });
  });
}

async function youtubePlayPause() {
  await ensureYouTubePlayer();
  if (!youtubeReady || !youtubePlayer) return;
  const state = youtubePlayer.getPlayerState?.();
  if (state === window.YT.PlayerState.PLAYING) {
    youtubePlayer.pauseVideo();
    return;
  }
  if (state === window.YT.PlayerState.UNSTARTED || state === window.YT.PlayerState.CUED) {
    youtubePlayer.loadVideoById(SIDEQUEST_MIX.videoId);
  }
  youtubePlayer.playVideo();
}

async function youtubeSeekToTrack(direction) {
  await ensureYouTubePlayer();
  const currentSeconds = youtubePlayer.getCurrentTime?.() || 0;
  const currentIndex = getSidequestTrackIndexByTime(currentSeconds);
  if (isShuffleOn) {
    const randomIndex = Math.floor(Math.random() * sidequestTimeline.length);
    youtubePlayer.seekTo(sidequestTimeline[randomIndex].start, true);
    youtubePlayer.playVideo();
    return;
  }
  const targetIndex = Math.max(0, Math.min(sidequestTimeline.length - 1, currentIndex + direction));
  youtubePlayer.seekTo(sidequestTimeline[targetIndex].start, true);
  youtubePlayer.playVideo();
}

function playCenteredAlbumWithSpotify() {
  if (!spotifyDeviceId) return Promise.resolve(false);
  const centeredCard = cards[activeIndex];
  const albumTitle = centeredCard?.querySelector(".album-title")?.textContent?.trim();
  if (!albumTitle) return Promise.resolve(false);

  return spotifyFetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(`album:${albumTitle} artist:GRiZ`)}&type=album&limit=1`
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      const albumUri = payload?.albums?.items?.[0]?.uri;
      if (!albumUri) return false;
      return spotifyFetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`,
        {
          method: "PUT",
          body: JSON.stringify({ context_uri: albumUri }),
        }
      ).then((res) => res.ok || res.status === 202 || res.status === 204);
    })
    .catch(() => false);
}

function scheduleHomeVinylReveal() {
  document.body.classList.add("vinyl-delayed");
  setTimeout(() => {
    document.body.classList.remove("vinyl-delayed");
  }, 520);
}

function getState(distance) {
  if (distance === 0) return "active";
  if (distance === -1) return "left";
  if (distance === 1) return "right";
  if (distance === -2) return "left-far";
  if (distance === 2) return "right-far";
  return "hidden";
}

function render() {
  if (centeredReadyTimer) {
    clearTimeout(centeredReadyTimer);
    centeredReadyTimer = null;
  }
  cards.forEach((card, index) => {
    const nextState = getState(index - activeIndex);
    const prevState = currentStates[index];
    const wasHidden = prevState === "hidden";
    const willBeHidden = nextState === "hidden";

    card.classList.remove(
      "active",
      "left",
      "right",
      "left-far",
      "right-far",
      "hidden",
      "puff-in",
      "puff-out",
      "no-transform",
      "centered-ready"
    );

    if (willBeHidden) {
      if (!wasHidden) {
        card.classList.add(prevState, "puff-out");
        setTimeout(() => {
          if (currentStates[index] === "hidden") {
            card.classList.remove("active", "left", "right", "left-far", "right-far", "puff-out", "no-transform");
            card.classList.add("hidden");
          }
        }, 540);
      } else {
        card.classList.add("hidden");
      }
      currentStates[index] = "hidden";
      return;
    }

    card.classList.add(nextState);
    if (wasHidden) {
      card.classList.add("puff-in", "no-transform");
      setTimeout(() => {
        card.classList.remove("puff-in", "no-transform");
      }, 640);
    }
    currentStates[index] = nextState;
  });
  const centeredCard = cards[activeIndex];
  if (centeredCard) {
    centeredReadyTimer = setTimeout(() => {
      centeredCard.classList.add("centered-ready");
    }, 430);
  }
  updateHomeNavVisibility();
}

function updateHomeNavVisibility() {
  if (homePrev) {
    const disableLeft = activeIndex <= 0;
    homePrev.classList.toggle("nav-disabled", disableLeft);
    homePrev.setAttribute("aria-disabled", String(disableLeft));
  }
  if (homeNext) {
    const disableRight = activeIndex >= cards.length - 1;
    homeNext.classList.toggle("nav-disabled", disableRight);
    homeNext.setAttribute("aria-disabled", String(disableRight));
  }
}

function showOverlay(overlay) {
  if (!overlay) return;
  overlay.classList.remove("hidden-overlay");
  overlay.classList.remove("nav-visible");
  overlay.classList.add("entering");
  overlay.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    overlay.classList.add("overlay-visible");
    requestAnimationFrame(() => {
      overlay.classList.remove("entering");
      updateDetailNavVisibility(overlay);
      if (overlay.classList.contains("detail-overlay")) {
        setTimeout(() => {
          if (overlay.classList.contains("overlay-visible")) {
            overlay.classList.add("nav-visible");
          }
        }, 220);
      }
    });
  });
}

function hideOverlay(overlay) {
  if (!overlay) return;
  overlay.classList.remove("nav-visible");
  if (overlay.classList.contains("detail-overlay") && overlay.id !== "aboutOverlay") {
    scheduleHomeVinylReveal();
  }
  overlay.classList.remove("overlay-visible");
  overlay.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    if (!overlay.classList.contains("overlay-visible")) {
      overlay.classList.add("hidden-overlay");
      overlay.classList.remove("entering");
    }
  }, 320);
}

function updateDetailNavVisibility(overlay) {
  if (!overlay || !overlay.classList.contains("detail-overlay")) return;
  const idx = detailOverlayOrder.indexOf(overlay);
  if (idx < 0) return;

  const leftBtn = overlay.querySelector(".detail-nav-left");
  const rightBtn = overlay.querySelector(".detail-nav-right");

  if (leftBtn) {
    const disabled = idx === 0;
    leftBtn.classList.toggle("nav-disabled", disabled);
    leftBtn.setAttribute("aria-disabled", String(disabled));
  }

  if (rightBtn) {
    const disabled = idx === detailOverlayOrder.length - 1;
    rightBtn.classList.toggle("nav-disabled", disabled);
    rightBtn.setAttribute("aria-disabled", String(disabled));
  }
}

function switchDetailOverlay(currentOverlay, nextOverlay, direction = 1) {
  if (!currentOverlay || !nextOverlay || currentOverlay === nextOverlay || detailOverlaySwitching) return;
  detailOverlaySwitching = true;
  nextOverlay.classList.add("nav-visible");
  document.body.classList.add("carousel-sync");
  if (carouselSyncTimer) clearTimeout(carouselSyncTimer);
  carouselSyncTimer = setTimeout(() => {
    document.body.classList.remove("carousel-sync");
  }, 620);

  const nextHomeIndex = overlayToHomeIndex[nextOverlay.id];
  if (typeof nextHomeIndex === "number" && nextHomeIndex !== activeIndex) {
    activeIndex = nextHomeIndex;
    render();
  }

  const outClass = "switching-out-fade";
  const inClass = "switching-in-fade";
  const switchClasses = [
    "switching-out-left",
    "switching-out-right",
    "switching-in-left",
    "switching-in-right",
    "switching-out-fade",
    "switching-in-fade",
  ];

  currentOverlay.classList.remove(...switchClasses);
  nextOverlay.classList.remove(...switchClasses);

  currentOverlay.classList.add(outClass);
  currentOverlay.setAttribute("aria-hidden", "true");
  currentOverlay.style.pointerEvents = "none";

  nextOverlay.classList.remove("hidden-overlay", "entering");
  nextOverlay.classList.add("overlay-visible", inClass);
  nextOverlay.setAttribute("aria-hidden", "false");
  nextOverlay.style.pointerEvents = "auto";
  updateDetailNavVisibility(nextOverlay);

  requestAnimationFrame(() => {
    nextOverlay.classList.remove(inClass);
  });

  setTimeout(() => {
    currentOverlay.classList.remove("overlay-visible");
    currentOverlay.classList.add("hidden-overlay");
    currentOverlay.classList.remove(outClass, "entering");
    nextOverlay.classList.remove(inClass);
    currentOverlay.style.pointerEvents = "";
    nextOverlay.style.pointerEvents = "";
    detailOverlaySwitching = false;
  }, 560);
}

function navigateDetailOverlay(currentOverlay, direction) {
  const currentIndex = detailOverlayOrder.indexOf(currentOverlay);
  if (currentIndex < 0) return;
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= detailOverlayOrder.length) return;
  switchDetailOverlay(currentOverlay, detailOverlayOrder[nextIndex], direction);
}

function getOverlayFromCard(card) {
  const openButton = card?.querySelector(".album-pill[data-open-overlay]");
  const overlayId = openButton?.dataset?.openOverlay;
  if (!overlayId) return null;
  return document.getElementById(overlayId);
}

function animateOpenOverlayFromCard(card, overlay) {
  const coverImage = card?.querySelector("img");
  const targetCover = overlay?.querySelector(".detail-cover");
  if (!coverImage || !overlay || !targetCover) {
    showOverlay(overlay);
    return;
  }

  const startRect = coverImage.getBoundingClientRect();
  overlay.classList.remove("hidden-overlay");
  overlay.classList.remove("nav-visible");
  overlay.classList.add("overlay-visible", "cover-animating");
  overlay.setAttribute("aria-hidden", "false");
  updateDetailNavVisibility(overlay);

  const endRect = targetCover.getBoundingClientRect();
  const clone = coverImage.cloneNode(true);
  clone.classList.add("cover-transition-clone");
  clone.style.top = `${startRect.top}px`;
  clone.style.left = `${startRect.left}px`;
  clone.style.width = `${startRect.width}px`;
  clone.style.height = `${startRect.height}px`;
  document.body.appendChild(clone);

  requestAnimationFrame(() => {
    clone.style.top = `${endRect.top}px`;
    clone.style.left = `${endRect.left}px`;
    clone.style.width = `${endRect.width}px`;
    clone.style.height = `${endRect.height}px`;
    clone.style.borderRadius = "14px";
    clone.style.boxShadow = "0 30px 78px rgba(16, 18, 24, 0.34)";
  });

  window.setTimeout(() => {
    overlay.classList.remove("cover-animating");
    if (overlay.classList.contains("overlay-visible")) {
      overlay.classList.add("nav-visible");
    }
    clone.remove();
  }, 560);
}

function animateCloseOverlayToHome(overlay) {
  if (!overlay || !overlay.classList.contains("detail-overlay") || overlay.id === "aboutOverlay") {
    hideOverlay(overlay);
    return;
  }

  const targetIndex = overlayToHomeIndex[overlay.id];
  if (typeof targetIndex !== "number") {
    hideOverlay(overlay);
    return;
  }

  activeIndex = targetIndex;
  document.body.classList.add("carousel-sync");
  if (carouselSyncTimer) clearTimeout(carouselSyncTimer);
  carouselSyncTimer = setTimeout(() => {
    document.body.classList.remove("carousel-sync");
  }, 760);
  render();

  const targetCard = cards[targetIndex];
  const targetImage = targetCard?.querySelector("img");
  const sourceCover = overlay.querySelector(".detail-cover");
  if (!targetImage || !sourceCover) {
    hideOverlay(overlay);
    return;
  }

  targetCard.classList.add("cover-reentry-hidden");

  const startRect = sourceCover.getBoundingClientRect();
  const clone = sourceCover.cloneNode(true);
  clone.classList.add("cover-transition-clone");
  clone.style.top = `${startRect.top}px`;
  clone.style.left = `${startRect.left}px`;
  clone.style.width = `${startRect.width}px`;
  clone.style.height = `${startRect.height}px`;
  clone.style.borderRadius = "14px";
  clone.style.boxShadow = "0 30px 78px rgba(16, 18, 24, 0.34)";
  document.body.appendChild(clone);

  overlay.classList.add("cover-animating");
  overlay.classList.remove("overlay-visible");
  overlay.setAttribute("aria-hidden", "true");

  const endRect = targetImage.getBoundingClientRect();
  requestAnimationFrame(() => {
    clone.style.top = `${endRect.top}px`;
    clone.style.left = `${endRect.left}px`;
    clone.style.width = `${endRect.width}px`;
    clone.style.height = `${endRect.height}px`;
    clone.style.borderRadius = "2px";
    clone.style.boxShadow = "0 24px 54px rgba(10, 12, 18, 0.45)";
  });

  window.setTimeout(() => {
    clone.remove();
    overlay.classList.add("hidden-overlay");
    overlay.classList.remove("cover-animating", "entering", "switching-in", "switching-out");
    targetCard.classList.remove("cover-reentry-hidden");
    scheduleHomeVinylReveal();
  }, 560);
}

function goHomePrev() {
  if (activeIndex <= 0) return;
  activeIndex -= 1;
  render();
}

function goHomeNext() {
  if (activeIndex >= cards.length - 1) return;
  activeIndex += 1;
  render();
}

cards.forEach((card, index) => {
  card.addEventListener("click", (event) => {
    if (suppressHomeCardClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressHomeCardClick = false;
      return;
    }
    if (index !== activeIndex) {
      activeIndex = index;
      render();
      return;
    }

    const overlay = getOverlayFromCard(card);
    if (!overlay) return;
    animateOpenOverlayFromCard(card, overlay);
  });
});

// Home carousel swipe is mobile-only.
if (albumTrack) {
  let startX = 0;
  let startY = 0;
  let isTouching = false;
  let ignoreSwipe = false;
  let startedOnActiveCover = false;
  let startedCardIndex = -1;
  const dragIgnoreSelector = ".album-pill, .home-nav";

  const isMobileViewport = () => window.matchMedia("(max-width: 780px)").matches;

  const onStart = (x, y, target) => {
    startX = x;
    startY = y;
    isTouching = true;
    const startedCard = target?.closest?.(".album-card");
    startedCardIndex = startedCard ? Number(startedCard.dataset.index) : -1;
    const startedOnImage = Boolean(target?.closest?.(".album-card > img"));
    startedOnActiveCover = startedOnImage && startedCardIndex === activeIndex;
  };

  const onEnd = (x, y) => {
    if (!isTouching || ignoreSwipe || !isMobileViewport()) {
      isTouching = false;
      ignoreSwipe = false;
      startedOnActiveCover = false;
      startedCardIndex = -1;
      return;
    }

    isTouching = false;
    const deltaX = x - startX;
    const deltaY = y - startY;
    const verticalSwipe = Math.abs(deltaY) > 62 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2;

    if (verticalSwipe && deltaY < 0 && startedOnActiveCover) {
      const activeCard = cards[activeIndex];
      const overlay = getOverlayFromCard(activeCard);
      startedOnActiveCover = false;
      startedCardIndex = -1;
      if (overlay) {
        animateOpenOverlayFromCard(activeCard, overlay);
      }
      return;
    }

    const horizontalSwipe = Math.abs(deltaX) > 52 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
    if (!horizontalSwipe) {
      startedOnActiveCover = false;
      startedCardIndex = -1;
      return;
    }

    suppressHomeCardClick = true;
    setTimeout(() => {
      suppressHomeCardClick = false;
    }, 220);

    if (deltaX < 0) {
      goHomeNext();
      startedOnActiveCover = false;
      startedCardIndex = -1;
      return;
    }
    goHomePrev();
    startedOnActiveCover = false;
    startedCardIndex = -1;
  };

  albumTrack.addEventListener("touchstart", (event) => {
    if (!isMobileViewport()) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    ignoreSwipe = Boolean(event.target.closest(dragIgnoreSelector));
    onStart(touch.clientX, touch.clientY, event.target);
  });

  albumTrack.addEventListener(
    "touchmove",
    (event) => {
      if (!isTouching || ignoreSwipe || !isMobileViewport()) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  albumTrack.addEventListener("touchend", (event) => {
    if (!isMobileViewport()) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    onEnd(touch.clientX, touch.clientY);
  });
}

aboutLink?.addEventListener("click", (event) => {
  event.preventDefault();
  showOverlay(aboutOverlay);
});

homePrev?.addEventListener("click", (event) => {
  event.preventDefault();
  goHomePrev();
});

homeNext?.addEventListener("click", (event) => {
  event.preventDefault();
  goHomeNext();
});

playPauseBtn?.addEventListener("click", () => {
  if (playerMode === "spotify") {
    spotifyPlayPause()
      .then(async () => {
        const state = await spotifyPlayer?.getCurrentState?.();
        if (!state) {
          await playCenteredAlbumWithSpotify();
        }
      })
      .catch((error) => {
        console.error(error);
      });
    return;
  }
  youtubePlayPause().catch((error) => {
    console.error(error);
  });
});

nextTrackBtn?.addEventListener("click", () => {
  const action = playerMode === "spotify" ? spotifyNextTrack() : youtubeSeekToTrack(1);
  action.catch((error) => {
    console.error(error);
  });
});

prevTrackBtn?.addEventListener("click", () => {
  const action = playerMode === "spotify" ? spotifyPrevTrack() : youtubeSeekToTrack(-1);
  action.catch((error) => {
    console.error(error);
  });
});

shuffleBtn?.addEventListener("click", () => {
  isShuffleOn = !isShuffleOn;
  shuffleBtn.classList.toggle("is-active", isShuffleOn);
  if (playerMode !== "spotify") return;
  spotifySetShuffle(isShuffleOn).catch((error) => {
    console.error(error);
  });
});

playerProgress?.addEventListener("input", () => {
  const pct = Number(playerProgress.value || 0);
  if (playerMode === "spotify") {
    if (!spotifyPlayer || !spotifyStateSnapshot?.duration) return;
    const seekMs = Math.floor((pct / 100) * spotifyStateSnapshot.duration);
    spotifyPlayer.seek(seekMs).catch((error) => {
      console.error(error);
    });
  } else {
    if (!youtubePlayer || !youtubeReady) return;
    const total = youtubePlayer.getDuration?.() || 0;
    if (total > 0) {
      youtubePlayer.seekTo((pct / 100) * total, true);
    }
  }
  updateProgressFill(pct);
});
spotifyAuthBtn?.addEventListener("click", () => {
  playerMode = "spotify";
  if (spotifyToken) {
    initializeSpotifyPlayer().catch((error) => {
      console.error(error);
      renderSpotifyAuthState("disconnected");
    });
    return;
  }
  startSpotifyAuth().catch((error) => {
    console.error(error);
  });
});

eventsLink?.addEventListener("click", (event) => {
  event.preventDefault();
  refreshEventsByDate();
  showOverlay(eventsOverlay);
});

closeEvents?.addEventListener("click", () => {
  hideOverlay(eventsOverlay);
});

eventsOverlay?.addEventListener("click", (event) => {
  if (event.target === eventsOverlay) {
    hideOverlay(eventsOverlay);
  }
});

overlayButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const overlayId = button.dataset.openOverlay;
    if (!overlayId) return;
    const targetOverlay = document.getElementById(overlayId);
    showOverlay(targetOverlay);
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".album-pill[data-open-overlay]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  const overlayId = button.dataset.openOverlay;
  if (!overlayId) return;
  const targetOverlay = document.getElementById(overlayId);
  showOverlay(targetOverlay);
});

detailCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const overlay = button.closest(".detail-overlay");
    animateCloseOverlayToHome(overlay);
  });
});

detailNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = Number(button.dataset.navDir || 0);
    if (!direction) return;

    const currentOverlay = button.closest(".detail-overlay");
    if (!currentOverlay) return;
    navigateDetailOverlay(currentOverlay, direction);
  });
});

detailOverlays.forEach((overlay) => {
  if (overlay.id !== "aboutOverlay") {
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swiping = false;
    let lockHorizontal = false;
    const isMobileViewport = () => window.matchMedia("(max-width: 780px)").matches;

    overlay.addEventListener("touchstart", (event) => {
      if (!isMobileViewport()) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      if (event.target.closest(".detail-tracks, .about-main, .detail-nav, .detail-close")) return;
      swipeStartX = touch.clientX;
      swipeStartY = touch.clientY;
      swiping = true;
      lockHorizontal = false;
    });

    overlay.addEventListener(
      "touchmove",
      (event) => {
        if (!swiping || !isMobileViewport()) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const deltaX = touch.clientX - swipeStartX;
        const deltaY = touch.clientY - swipeStartY;
        if (!lockHorizontal && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          lockHorizontal = true;
        }
        if (lockHorizontal) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    overlay.addEventListener("touchcancel", () => {
      swiping = false;
      lockHorizontal = false;
    });

    overlay.addEventListener("touchend", (event) => {
      if (!swiping || !isMobileViewport()) return;
      const touch = event.changedTouches[0];
      swiping = false;
      lockHorizontal = false;
      if (!touch) return;
      const deltaX = touch.clientX - swipeStartX;
      const deltaY = touch.clientY - swipeStartY;
      const horizontalSwipe = Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
      if (horizontalSwipe) {
        if (deltaX < 0) {
          navigateDetailOverlay(overlay, 1);
          return;
        }
        navigateDetailOverlay(overlay, -1);
        return;
      }
      const verticalSwipe = Math.abs(deltaY) > 70 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25;
      if (verticalSwipe && deltaY > 0) {
        animateCloseOverlayToHome(overlay);
      }
    });
  }

  if (overlay.id !== "aboutOverlay") {
    const detailCover = overlay.querySelector(".detail-cover");
    detailCover?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      animateCloseOverlayToHome(overlay);
    });
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      animateCloseOverlayToHome(overlay);
    }
  });

  const detailPage = overlay.querySelector(".detail-page");
  detailPage?.addEventListener("click", (event) => {
    const clickedInteractive = event.target.closest(
      ".detail-cover-wrap, .detail-tracks, .detail-close, .detail-nav"
    );
    if (clickedInteractive) return;
    animateCloseOverlayToHome(overlay);
  });
});

async function initSpotify() {
  setDefaultPlayerMeta();
  updatePlayButton(true);
  renderSpotifyAuthState("disconnected");

  try {
    await handleSpotifyAuthRedirect();
  } catch (error) {
    console.error(error);
    clearToken();
    renderSpotifyAuthState("disconnected");
    return;
  }

  spotifyToken = getStoredToken();
  if (!spotifyToken) return;

  try {
    await initializeSpotifyPlayer();
  } catch (error) {
    console.error(error);
    renderSpotifyAuthState("disconnected");
  }
}

initSpotify().catch((error) => console.error(error));
render();
startEventsAutoRefresh();
requestAnimationFrame(() => {
  document.body.classList.add("carousel-ready");
});

applyImageShadowTint(".album-card > img", ".album-card");
applyImageShadowTint(".detail-cover", ".detail-cover-wrap");
applyImageShadowTint(".about-cover", ".about-cover-wrap");
