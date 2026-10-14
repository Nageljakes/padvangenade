/* Pad van Genade — local store.
   Wraps localStorage so a browser in private mode, a full quota, or corrupt
   data degrades to "no saved state" instead of throwing and breaking the app.
   Nothing here ever leaves the device. */

const NAMESPACE = "pvg:";

function safeGet(key) {
  try {
    return localStorage.getItem(NAMESPACE + key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(NAMESPACE + key, value);
    return true;
  } catch {
    return false;
  }
}

function readJSON(key, fallback) {
  const raw = safeGet(key);
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  return safeSet(key, JSON.stringify(value));
}

/* ---------------------------------------------------------------- language */

export function getLang() {
  const stored = safeGet("lang");
  if (stored === "af" || stored === "en") return stored;
  const nav = (navigator.language || "af").toLowerCase();
  // Afrikaans is the original voice of this site, so only switch away from it
  // when the browser asks for a clearly non-Afrikaans language.
  if (nav.startsWith("af")) return "af";
  if (nav.startsWith("en")) return "en";
  return "af";
}

export const setLang = (lang) => safeSet("lang", lang);

/* ------------------------------------------------------------------- saved */

const validIds = (ids, allowed) => Array.isArray(ids) ? ids.filter((id) => allowed.has(id)) : [];

export function loadSaved(validTopicIds) {
  const allowed = new Set(validTopicIds);
  return {
    topics: validIds(readJSON("savedTopics", []), allowed),
    journal: readJSON("journal", []),
    positions: readJSON("positions", {}),
    streak: readJSON("streak", { count: 0, last: "" }),
    seenIntro: safeGet("seenIntro") === "1",
  };
}

export function toggleSavedTopic(id, current) {
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  writeJSON("savedTopics", next);
  return next;
}

export const savePositions = (positions) => writeJSON("positions", positions);
export const saveStreak = (streak) => writeJSON("streak", streak);
export const markIntroSeen = () => safeSet("seenIntro", "1");

/* ----------------------------------------------------------------- journal */

export function addEntry(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString(), text: trimmed };
  const next = [entry, ...readJSON("journal", [])].slice(0, 500);
  writeJSON("journal", next);
  return next;
}

export function removeEntry(id) {
  const next = readJSON("journal", []).filter((e) => e.id !== id);
  writeJSON("journal", next);
  return next;
}

/* ------------------------------------------------------------------- misc */

export function storageWorks() {
  try {
    const k = NAMESPACE + "probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}