/* Pad van Genade — application shell.
   Plain ES modules, no build step, no framework. State lives in one object;
   render() paints from state. Every string shown to a reader goes through t(),
   which reads the active language, so a language switch never leaves mixed UI.
*/

import { STRINGS, ABOUT } from "./i18n.js";
import * as store from "./store.js";

const DATA_URL = "data/content.json";
const DAILY_URL = "data/daily.json";
const HELP_URL = "data/help.json";

/* ------------------------------------------------------------------ state */

const state = {
  lang: store.getLang(),
  content: null,
  daily: null,
  help: null,
  helpMode: "me",          // "me" | "someone"
  page: "today",
  topic: null,             // slug
  passage: 0,              // index within topic.passages
  group: "all",
  query: "",
  saved: [],
  journal: [],
  positions: {},
  streak: { count: 0, last: "" },
  dailyIndex: null,        // null = today's verse
  online: navigator.onLine,
  hero: true,
};

const t = (key) => STRINGS[state.lang][key];
const L = (obj) => obj[state.lang];

/* Hero imagery.
   One photograph per day, chosen deterministically from the date so the page
   does not flicker between visits but still changes over the year. Only the
   chosen image is ever requested. */
const HEROES = ["drakensberg", "tablemount", "sunflowers", "springbok"];

function heroForToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return HEROES[day % HEROES.length];
}

function applyHero() {
  const id = heroForToday();
  const el = $(".masthead");
  if (!el) return;
  // Set on the masthead itself, not <html>: the CSS fallback rule keys off
  // this element's own style attribute.
  // Set backgroundImage directly rather than through a CSS custom property:
  // a relative url() inside a custom property resolves against the stylesheet,
  // not the document, which breaks the moment the CSS lives in a subfolder.
  // Resolving against document.baseURI also keeps the GitHub Pages subpath working.
  const webp = new URL(`assets/img/${id}.webp`, document.baseURI).href;
  // Hero keeps the photo at full strength; the page behind the content gets a
  // softer copy of the same image so hero and body feel like one photograph.
  document.documentElement.style.setProperty("--page-bg", `url("${webp}")`);
  el.style.backgroundImage = `url("${webp}")`;
  document.documentElement.dataset.hero = id;
  // Warm the JPEG fallback so a browser without WebP support is not left
  // waiting on a second round trip after first paint.
  const img = new Image();
  img.src = new URL(`assets/img/${id}.jpg`, document.baseURI).href;
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------- boot */

async function loadJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function boot() {
  renderShell();
  bindGlobal();
  try {
    const [content, daily, help, credits] = await Promise.all([
      loadJSON(DATA_URL),
      loadJSON(DAILY_URL).catch(() => ({ entries: [] })),
      loadJSON(HELP_URL).catch(() => ({ cards: [] })),
        loadJSON("assets/img/credits.json").catch(() => ({ images: [] })),
    ]);
    state.content = content;
    state.daily = daily;
    state.help = help;
    state.credits = credits;
    Object.assign(state, store.loadSaved(content.topics.map((t) => t.slug)));
    state.dailyIndex = dailyIndexForToday();
    markVisit();
    render();
    // Read the topic out of the hash BEFORE setPage rewrites it, otherwise the
    // deep link is erased before we can read it.
    const deepTopic = routeTopicFromHash();
    setPage(routeFromHash());
    if (deepTopic) openTopic(deepTopic);
  } catch (err) {
    renderFatal(err);
  }
  registerSW();
}

/* ------------------------------------------------------------------ route */

const PAGES = ["today", "struggle", "journal", "help", "share", "about"];

function routeFromHash() {
  const id = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
  return PAGES.includes(id) ? id : "today";
}

function setPage(page, opts = {}) {
  state.page = page;
  // The reader is a sub-view that appears alongside the struggle page, not a
  // page of its own, so it is shown whenever struggle is active.
  $$(".page").forEach((el) => {
    const isReader = el.id === "page-reader";
    el.hidden = !(el.id === `page-${page}` || (isReader && page === "struggle"));
  });
  $$(".nav__link").forEach((el) => {
    if (el.dataset.page === page) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  const hash = opts.topic ? `#/${page}/${opts.topic}` : `#/${page}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);

  // Keep the reader where they were. Force-scrolling to the top on every menu
  // press threw away their place, which is especially jarring when moving
  // between tabs deep in a long topic list. The position is restored *after*
  // rendering, then clamped, so switching to a shorter page cannot leave you
  // stranded past the end of the content.
  const keep = window.scrollY;
  renderPage(page);
  // Callers that want to scroll somewhere specific (opening a topic) opt out.
  if (opts.keepScroll === false) return;
  requestAnimationFrame(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(keep, max), behavior: "auto" });
  });
}

function routeTopicFromHash() {
  const parts = (location.hash || "").replace(/^#\/?/, "").split("/");
  return PAGES.includes(parts[0]) && parts[1] ? parts[1] : null;
}

/* ----------------------------------------------------------------- render */

function render() {
  document.documentElement.lang = t("htmlLang");
  renderNav();
  renderMast();
  renderToday();
  renderStruggle();
  renderReader();
  renderJournal();
  renderHelp();
  renderShare();
  renderAbout();
  renderFooter();
  applyHero();
}

function renderPage(page) {
  ({
    today: renderToday,
    struggle: renderStruggle,
    journal: renderJournal,
    help: renderHelp,
    share: renderShare,
    about: renderAbout,
  })[page]?.();
  if (page === "struggle" && state.topic) renderReader();
}

/* -------------------------------------------------------------------- nav */

// The language switch is a sibling of #nav-inner, not a child: renderNav
// replaces #nav-inner's contents on every repaint, which would otherwise
// delete the switcher along with the links.
function renderNav() {
  const items = [["today", t("navToday")], ["struggle", t("navStruggle")], ["journal", t("navJournal")], ["help", t("navHelp")], ["share", t("navShare")], ["about", t("navAbout")]];
  $("#nav-inner").innerHTML = items
    .map(([id, label]) => `<a class="nav__link" href="#/${id}" data-page="${id}">${esc(label)}</a>`)
    .join("");
  $("#lang-switch").innerHTML = ["af", "en"]
    .map((code) => `<button type="button" data-lang="${code}" aria-pressed="${state.lang === code}" lang="${code}">${code.toUpperCase()}</button>`)
    .join("");
  $("#offline-badge").hidden = state.online;
}

function renderMast() {
  $("#brand-name").textContent = t("brand");
  $("#brand-tag").textContent = t("tagline");
  $("#mast-eyebrow").textContent = t("mastEyebrow");
  $("#mast-tag").textContent = t("mastTag");
  const cta = $("#hero-cta");
  if (cta) cta.textContent = t("tellMeWhat");
  document.title = `${t("brand")} — ${t("tagline")}`;
}

/* ------------------------------------------------------------------ today */

function dailyIndexForToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000); // 0-based day of year
  const total = state.daily?.entries?.length || 0;
  return total ? ((day % total) + total) % total : 0;
}

function markVisit() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.streak.last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.streak = { count: state.streak.last === yesterday ? state.streak.count + 1 : 1, last: today };
  store.saveStreak(state.streak);
}

function renderToday() {
  const host = $("#page-today");
  if (!state.content) return;

  const entry = state.daily?.entries?.[state.dailyIndex ?? 0];
  const streak = state.streak.count > 1
    ? `${t("streak")}: ${state.streak.count} ${t("dayOf")}`
    : "";

  host.innerHTML = `
    <div class="hero">
      <p class="eyebrow">${esc(t("todayVerseFor"))}</p>
      <p class="measure" style="margin-inline:auto">${esc(t("todayIntro"))}</p>
    </div>

    <div class="card measure" style="margin-inline:auto">
      ${entry ? verseBlock(entry, { showOther: true }) : `<p class="muted">${esc(t("searchNone"))}</p>`}
      <div class="btn-row" style="margin-top:1.25rem">
        <button class="btn btn--primary" id="daily-next">${esc(t("nextVerse"))}</button>
        <button class="btn" id="daily-reset">${esc(t("backToToday"))}</button>
        <button class="btn" id="daily-struggle">${esc(t("tellMeWhat"))}</button>
      </div>
      ${streak ? `<p class="muted" style="margin:.9rem 0 0">${esc(streak)}</p>` : ""}
    </div>

    <div class="card measure" style="margin-inline:auto;margin-top:1.25rem;border-color:var(--danger);border-left-width:3px">
      <p style="margin:0"><strong>${esc(t("helpIntro"))}</strong></p>
      <div class="btn-row" style="margin-top:.9rem">
        <button class="btn" data-goto="help">${esc(t("helpHeading"))}</button>
      </div>
    </div>
  `;
}

function verseBlock(entry, { showOther = false } = {}) {
  const primary = L(entry);
  const otherLang = state.lang === "af" ? "en" : "af";
  const other = entry[otherLang];
  const otherLabel = otherLang === "af" ? "Afrikaans" : "English";
  return `
    <div class="verse">
      ${entry.field ? `<span class="verse__field">${esc(L(entry.field))}</span>` : ""}
      <span class="verse__ref">${esc(primary.ref)}</span>
      <p class="verse__text">${esc(primary.text)}</p>
      ${showOther && other ? `
        <div class="verse__alt">
          <span class="verse__ref" lang="${otherLang}">${esc(other.ref)} · ${otherLabel}</span>
          <p class="verse__text" lang="${otherLang}">${esc(other.text)}</p>
        </div>` : ""}
    </div>`;
}

/* --------------------------------------------------------------- struggle */

function filteredTopics() {
  const topics = state.content.topics;
  const q = state.query.trim().toLowerCase();
  return topics.filter((topic) => {
    // "saved" is a pseudo-group, not a real group id, so it must not be
    // applied here -- doing so empties the list before the saved-check runs.
    if (state.group !== "all" && state.group !== "saved" && topic.group !== state.group) return false;
    if (!q) return true;
    // Match in BOTH languages regardless of the interface language: someone
    // reading in Afrikaans still searches "debt", and vice versa. On a
    // bilingual site, searching one language only is a dead end.
    const hay = [
      topic.title.af, topic.title.en,
      topic.intro.af, topic.intro.en,
      ...topic.passages.flatMap((p) => [
        p.af.ref, p.af.text, p.en.ref, p.en.text,
        p.field.af, p.field.en,
      ]),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function renderStruggle() {
  const host = $("#page-struggle");
  if (!state.content) return;

  const groups = state.content.groups;
  const list = filteredTopics();

  host.innerHTML = `
    <div class="hero">
      <h2>${esc(t("struggleHeading"))}</h2>
      <p class="measure" style="margin-inline:auto">${esc(t("struggleIntro"))}</p>
    </div>

    <div class="card" style="margin-bottom:1.5rem">
      <label class="field__label" for="topic-search">${esc(t("searchLabel"))}</label>
      <input class="search" id="topic-search" type="search" autocomplete="off"
             placeholder="${esc(t("searchPlaceholder"))}" value="${esc(state.query)}">
      <div class="chips" style="margin-top:1rem" role="group">
        <button class="chip" data-group="all" aria-pressed="${state.group === "all"}">${esc(t("filterAll"))}</button>
        <button class="chip" data-group="saved" aria-pressed="${state.group === "saved"}">${esc(t("filterSaved"))}</button>
        ${groups.map((g) => `<button class="chip" data-group="${esc(g.id)}" aria-pressed="${state.group === g.id}">${esc(L(g))}</button>`).join("")}
      </div>
    </div>

    <div id="topic-results"></div>
  `;

  renderTopicResults();
}

function renderTopicResults() {
  const host = $("#topic-results");
  if (!host) return;

  let list = filteredTopics();
  if (state.group === "saved") list = list.filter((x) => state.saved.includes(x.slug));

  if (!list.length) {
    host.innerHTML = `<p class="muted center" style="padding:2rem 0">${esc(t("searchNone"))}</p>`;
    return;
  }

  // When no group filter is active, show topics under their group headings so
  // the library reads as a map rather than one long undifferentiated list.
  if (state.group === "all" && !state.query) {
    host.innerHTML = state.content.groups
      .map((group) => {
        const topics = list.filter((x) => x.group === group.id);
        if (!topics.length) return "";
        return `
          <section class="group-block">
            <div class="group-block__head">
              <h2>${esc(L(group))}</h2>
              <p>${esc(L(group.blurb))}</p>
            </div>
            <div class="topic-grid">${topics.map(topicCard).join("")}</div>
          </section>`;
      })
      .join("");
    return;
  }

  host.innerHTML = `<div class="topic-grid">${list.map(topicCard).join("")}</div>`;
}

function topicCard(topic) {
  const isSaved = state.saved.includes(topic.slug);
  return `
    <button class="topic-card" data-topic="${esc(topic.slug)}" aria-pressed="${state.topic === topic.slug}">
      <span class="topic-card__name">${isSaved ? "★ " : ""}${esc(L(topic.title))}</span>
      <span class="topic-card__meta">${esc(L(state.content.groups.find((g) => g.id === topic.group)))} · ${topic.passages.length}</span>
    </button>`;
}

/* ----------------------------------------------------------------- reader */

function renderReader() {
  const host = $("#page-reader");
  if (!host || !state.content || !state.topic) return;
  const topic = state.content.topics.find((x) => x.slug === state.topic);
  if (!topic) return;

  if (state.passage >= topic.passages.length) state.passage = 0;
  const passage = topic.passages[state.passage];
  const isSaved = state.saved.includes(topic.slug);
  const otherLang = state.lang === "af" ? "en" : "af";

  host.innerHTML = `
    <article class="card">
      <header class="reader__head">
        <p class="eyebrow">${esc(L(state.content.groups.find((g) => g.id === topic.group)))}</p>
        <h2>${esc(L(topic.title))}</h2>
        <p class="muted">${esc(L(topic.intro))}</p>
      </header>

      ${verseBlock(passage, { showOther: true })}

      <section class="reader__section">
        <h3>${esc(t("whatSays"))}</h3>
        <p>${esc(L(topic.pastoral).reflect)}</p>
      </section>

      <section class="reader__section">
        <h3>${esc(t("prayer"))}</h3>
        <div class="prayer-box"><p style="margin:0">${esc(L(topic.pastoral).prayer)}</p></div>
      </section>

      <section class="reader__section reader__section--step">
        <h3>${esc(t("step"))}</h3>
        <div class="step-box"><p style="margin:0">${esc(L(topic.pastoral).step)}</p></div>
      </section>

      <div class="btn-row" style="margin-top:1.5rem">
        ${state.lang === "en" ? `<button class="btn" data-speak="en">${esc(t("readAloud"))}</button>` : ""}
        <button class="btn" data-alt="${esc(otherLang)}">${esc(t("showOther"))}</button>
        <button class="btn" id="toggle-saved" data-topic="${esc(topic.slug)}">${esc(isSaved ? t("savedTopic") : t("saveTopic"))}</button>
        <button class="btn" data-journal="${esc(topic.slug)}">${esc(t("writeHere"))}</button>
      </div>

      <nav class="pager">
        <button class="btn" id="prev-passage" ${topic.passages.length < 2 ? "disabled" : ""}>${esc(t("prev"))}</button>
        <span class="pager__pos">${state.passage + 1} ${esc(t("verseOf"))} ${topic.passages.length}</span>
        <button class="btn" id="next-passage" ${topic.passages.length < 2 ? "disabled" : ""}>${esc(t("next"))}</button>
      </nav>
    </article>
  `;
}

function openTopic(slug, { passage = 0 } = {}) {
  const topic = state.content?.topics.find((x) => x.slug === slug);
  if (!topic) return;
  state.topic = slug;
  state.passage = state.positions[slug] ?? passage;
  if (state.passage >= topic.passages.length) state.passage = 0;
  // Keep the slug in the URL so a particular topic can be linked to directly.
  setPage("struggle", { topic: slug, keepScroll: false });
  renderTopicResults();
  renderReader();
  $("#page-reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stepPassage(delta) {
  const topic = state.content?.topics.find((x) => x.slug === state.topic);
  if (!topic || topic.passages.length < 2) return;
  state.passage = (state.passage + delta + topic.passages.length) % topic.passages.length;
  state.positions[state.topic] = state.passage;
  store.savePositions(state.positions);
  renderReader();
}

/* ---------------------------------------------------------------- journal */

function renderJournal() {
  const host = $("#page-journal");
  if (!host) return;

  const dateFmt = new Intl.DateTimeFormat(state.lang === "af" ? "af-ZA" : "en-ZA", {
    dateStyle: "medium", timeStyle: "short",
  });

  host.innerHTML = `
    <div class="hero">
      <h2>${esc(t("journalHeading"))}</h2>
      <p class="measure" style="margin-inline:auto">${esc(t("journalIntro"))}</p>
    </div>

    <div class="card measure" style="margin-inline:auto">
      <div class="card" style="background:var(--bg-alt);box-shadow:none;margin-bottom:1.25rem">
        <h3 style="font-family:var(--sans);font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${esc(t("promptsHeading"))}</h3>
        <div class="prompt-list">
          ${t("prompts").map((p) => `<button class="prompt-btn" data-prompt="${esc(p)}">${esc(p)}</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="journal-input">${esc(t("journalLabel"))}</label>
        <textarea id="journal-input" placeholder="${esc(t("journalPlaceholder"))}"></textarea>
        <p class="field__hint">${esc(t("journalIntro"))}</p>
      </div>

      <div class="btn-row">
        <button class="btn btn--primary" id="journal-save">${esc(t("saveEntry"))}</button>
        <button class="btn" id="journal-export">${esc(t("export"))}</button>
      </div>
      <p class="muted" id="journal-status" role="status" aria-live="polite" style="margin-top:.75rem"></p>
    </div>

    <div class="measure" style="margin:1.5rem auto 0">
      ${state.journal.length
        ? state.journal.map((entry) => `
            <div class="journal-entry">
              <div class="journal-entry__meta">
                <time datetime="${esc(entry.at)}">${esc(dateFmt.format(new Date(entry.at)))}</time>
                <button class="journal-entry__del" data-delete="${esc(entry.id)}" aria-label="${esc(t("delete"))}">${esc(t("delete"))}</button>
              </div>
              <p class="journal-entry__text">${esc(entry.text)}</p>
            </div>`).join("")
        : `<p class="muted center">${esc(t("noEntries"))}</p>`}
    </div>
  `;
}

/* ------------------------------------------------------------------- help */

function renderHelp() {
  const host = $("#page-help");
  if (!state.help?.cards?.length) {
    if (host && state.help) host.innerHTML = `<div class="hero"><h2>${esc(t("helpHeading"))}</h2></div>`;
    return;
  }

  const emergency = state.help.emergency || [];
  const cards = state.help.cards.filter((c) =>
    !c.mode || c.mode === "both" || (state.helpMode === "someone" ? c.mode === "other" : c.mode === "me")
  );

  host.innerHTML = `
    <div class="hero">
      <h2>${esc(t("helpHeading"))}</h2>
      <p class="measure" style="margin-inline:auto">${esc(t("helpIntro"))}</p>
    </div>

    <div class="emergency measure" style="margin-inline:auto">
      <h3>${esc(t("emergencyHeading"))}</h3>
      <p style="margin:0 0 .5rem">${esc(t("helpNote"))}</p>
      <ul>
        ${emergency.map((c) => `<li><strong>${esc(L(c.name))}</strong> — <a href="tel:${esc(c.tel.replace(/\s/g, ""))}">${esc(c.tel)}</a></li>`).join("")}
      </ul>
    </div>

    <div class="chips measure" style="margin-inline:auto" role="group">
      <button class="chip" data-helpmode="me" aria-pressed="${state.helpMode === "me"}">${esc(t("helpMe"))}</button>
      <button class="chip" data-helpmode="someone" aria-pressed="${state.helpMode === "someone"}">${esc(t("helpSomeone"))}</button>
    </div>

    <div class="help-list measure" style="margin-inline:auto">
      ${cards.map((card) => `
        <div class="help-item">
          <div class="help-item__name">${esc(L(card.name))}</div>
          <p class="help-item__desc">${esc(L(card.desc))}</p>
          ${(card.numbers || []).map((n) => `
            <a class="help-item__num" href="tel:${esc(n.tel.replace(/\s/g, ""))}">${esc(n.tel)}</a>`).join("")}
          ${(card.sms || []).map((n) => `<div class="help-item__meta">SMS ${esc(n)}</div>`).join("")}
          ${(card.hours || []).map((h) => `<div class="help-item__meta">${esc(L(h))}</div>`).join("")}
          ${card.operator ? `<div class="help-item__operator">${esc(L(card.operator))}</div>` : ""}
          ${card.verified ? `<div class="help-item__meta">${esc(t("verified"))} ${esc(card.verified)}</div>` : ""}
        </div>`).join("")}
    </div>
  `;
}

/* ------------------------------------------------------------------ share */

function renderShare() {
  const host = $("#page-share");
  if (!host) return;
  const help = state.help?.cards?.[0];
  const entry = state.daily?.entries?.[state.dailyIndex ?? 0];

  const cards = [];
  if (state.topic) {
    const topic = state.content.topics.find((x) => x.slug === state.topic);
    if (topic) {
      // Share can render before the reader has clamped state.passage, so pick
      // the verse defensively rather than indexing off the end of the array.
      const idx = Math.min(state.passage, topic.passages.length - 1);
      const verse = topic.passages[idx];
      cards.push({
        title: t("sharePrayer"),
        text: `${L(topic.pastoral).prayer}\n\n— ${t("brand")}`,
      });
      cards.push({
        title: t("shareCardVerse"),
        text: `${L(verse).text}\n— ${L(verse).ref}`,
      });
    }
  } else if (entry) {
    cards.push({ title: t("shareCardVerse"), text: `${L(entry).text}\n— ${L(entry).ref}` });
  }
  if (help) {
    cards.push({
      title: t("shareCardHelp"),
      text: `${L(help.name)}\n${(help.numbers || []).map((n) => n.tel).join(" · ")}\n\n${t("helpNote")}`,
    });
  }

  host.innerHTML = `
    <div class="hero">
      <h2>${esc(t("shareHeading"))}</h2>
      <p class="measure" style="margin-inline:auto">${esc(t("shareIntro"))}</p>
    </div>
    <div class="share-grid measure" style="margin-inline:auto">
      ${cards.map((c, i) => `
        <div class="share-card">
          <h3>${esc(c.title)}</h3>
          <p style="white-space:pre-wrap">${esc(c.text)}</p>
          <div class="btn-row">
            <button class="btn" data-share-copy="${i}">${esc(t("shareCopy"))}</button>
            <a class="btn" data-share-wa="${i}" href="#">${esc(t("shareWhatsApp"))}</a>
            <a class="btn" data-share-sms="${i}" href="#">${esc(t("shareSms"))}</a>
          </div>
        </div>`).join("")}
    </div>
  `;

  // Cards are rendered escaped; the share actions re-read the same source text
  // from state so nothing depends on scraping the DOM back out.
  $("#page-share").dataset.cards = JSON.stringify(cards);
}

/* ------------------------------------------------------------------ about */

function renderAbout() {
  const host = $("#page-about");
  if (!host || !state.content) return;
  const copy = ABOUT[state.lang];
  const sources = state.content.sources || {};

  host.innerHTML = `
    <div class="hero"><h2>${esc(t("aboutHeading"))}</h2></div>

    <div class="prose measure" style="margin-inline:auto">
      <h3>${esc(t("aboutWhat"))}</h3>
      ${copy.what.map((p) => `<p>${esc(p)}</p>`).join("")}

      <h3>${esc(t("aboutPrivacy"))}</h3>
      ${copy.privacy.map((p) => `<p>${esc(p)}</p>`).join("")}

      <h3>${esc(t("aboutSources"))}</h3>
      <div class="source-note">
        <p style="margin:0 0 .5rem">${esc(state.lang === "af"
          ? "Alle Skrifwerk is werklik uit openbare-domein-vertalings opgehaal, nooit met die hand getik nie."
          : "All Scripture text is fetched from public-domain translations, never hand-typed.")}</p>
        <ul style="margin:0;padding-left:1.1rem">
          <li>${esc(sources.af?.label || "")} — <a href="${esc(sources.af?.url || "#")}" rel="noopener">${esc(sources.af?.via || "")}</a></li>
          <li>${esc(sources.en?.label || "")} — <a href="${esc(sources.en?.url || "#")}" rel="noopener">${esc(sources.en?.via || "")}</a></li>
        </ul>
      </div>

      <h3>${esc(t("aboutLimits"))}</h3>
      ${copy.limits.map((p) => `<p>${esc(p)}</p>`).join("")}

      <h3>${esc(t("aboutImages"))}</h3>
      ${renderImageCredits()}
    </div>
  `;
}

/* Image credits.
   Two of the four photographs are CC BY-SA, which legally requires attribution
   and that modified copies keep the same licence, so the credit is rendered
   from data/credits.json on the page rather than only living in the repo. */
function renderImageCredits() {
  const images = state.credits?.images || [];
  if (!images.length) return "";
  const licences = state.credits.licences || {};
  return `
    <ul class="credits">
      ${images.map((img) => `
        <li>
          <span class="credits__subject">${esc(L(img.subject))}</span><br>
          <span class="muted">${esc(t("imageBy"))} ${esc(img.artist)} · ${esc(L(licences[img.licence] || { [state.lang]: img.licence }))} · <a href="${esc(img.page)}" rel="noopener">${esc(img.licence)}</a></span>
        </li>`).join("")}
    </ul>`;
}

/* ----------------------------------------------------------------- footer */

function renderFooter() {
  $("#footer-note").textContent = t("footerNote");
  $("#footer-rights").textContent = t("rights");
}

/* ------------------------------------------------------------ interaction */

function bindGlobal() {
  document.addEventListener("click", (e) => {
    const lang = e.target.closest("[data-lang]");
    if (lang) { setLanguage(lang.dataset.lang); return; }

    const nav = e.target.closest("[data-page]");
    if (nav) { e.preventDefault(); setPage(nav.dataset.page); return; }

    const chip = e.target.closest(".chip[data-group]");
    if (chip) { state.group = chip.dataset.group; state.query = ""; renderStruggle(); return; }

    // Order matters: the save button and the journal link also carry
    // data-topic, so their specific handlers must be tested before the
    // generic "open this topic" handler, or they open the topic instead.
    const save = e.target.closest("#toggle-saved");
    if (save) {
      state.saved = store.toggleSavedTopic(save.dataset.topic, state.saved);
      renderReader();
      renderTopicResults();
      toast(t("savedTopic"));
      return;
    }

    const journalLink = e.target.closest("[data-journal]");
    if (journalLink) { setPage("journal"); return; }

    const card = e.target.closest("[data-topic]");
    if (card) { openTopic(card.dataset.topic); return; }

    if (e.target.closest("#prev-passage")) return stepPassage(-1);
    if (e.target.closest("#next-passage")) return stepPassage(1);

    if (e.target.closest("#daily-next")) {
      const total = state.daily.entries.length;
      if (total) state.dailyIndex = ((state.dailyIndex ?? 0) + 1) % total;
      renderToday();
      return;
    }
    if (e.target.closest("#daily-reset")) { state.dailyIndex = dailyIndexForToday(); renderToday(); return; }
    if (e.target.closest("#daily-struggle")) return setPage("struggle");

    const helpMode = e.target.closest("[data-helpmode]");
    if (helpMode) { state.helpMode = helpMode.dataset.helpmode; renderHelp(); return; }

    const prompt = e.target.closest("[data-prompt]");
    if (prompt) {
      const box = $("#journal-input");
      if (box) { box.value = box.value ? `${box.value}\n${prompt.dataset.prompt}\n` : `${prompt.dataset.prompt}\n`; box.focus(); }
      return;
    }

    if (e.target.closest("#journal-save")) return saveJournal();
    if (e.target.closest("#journal-export")) return exportJournal();

    const del = e.target.closest("[data-delete]");
    if (del) {
      if (confirm(t("confirmDelete"))) { state.journal = store.removeEntry(del.dataset.delete); renderJournal(); }
      return;
    }

    // Read aloud is English-only. Afrikaans text-to-speech is unintelligible on
    // most system voices, which made the feature actively harmful rather than
    // merely unhelpful, so the button is not offered at all in Afrikaans.
    const speak = e.target.closest("[data-speak]");
    if (speak) return speakVerse(speak.dataset.speak);

    // Separate from read-aloud: this only reveals the other-language text.
    // Previously it carried data-speak, so choosing to *see* the Afrikaans also
    // started reading it aloud in a mangled accent.
    const alt = e.target.closest("[data-alt]");
    if (alt) return showAltLang(alt.dataset.alt);

    const copy = e.target.closest("[data-share-copy]");
    if (copy) return shareText("copy", Number(copy.dataset.shareCopy));
    const wa = e.target.closest("[data-share-wa]");
    // These are anchors for keyboard/touch parity with the buttons, so stop the
    // default "#" navigation before handing off to WhatsApp.
    if (wa) { e.preventDefault(); return shareText("wa", Number(wa.dataset.shareWa)); }
    const sms = e.target.closest("[data-share-sms]");
    if (sms) { e.preventDefault(); return shareText("sms", Number(sms.dataset.shareSms)); }
  });

  // Arrow keys move between nav links, matching the tablist pattern. The
  // original site had this and it is genuinely easier with a keyboard.
  $(".nav__bar").addEventListener("keydown", (e) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const links = $$(".nav__link");
    const i = links.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? links[0]
      : e.key === "End" ? links[links.length - 1]
      : links[(i + (e.key === "ArrowRight" ? 1 : -1) + links.length) % links.length];
    next.focus();
    setPage(next.dataset.page);
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "topic-search") {
      state.query = e.target.value;
      state.group = "all";
      renderStruggle();
      const box = $("#topic-search");
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    }
  });

  window.addEventListener("hashchange", () => {
    setPage(routeFromHash());
    const slug = routeTopicFromHash();
    if (slug && slug !== state.topic) openTopic(slug);
  });

  window.addEventListener("online", () => { state.online = true; renderNav(); });
  window.addEventListener("offline", () => { state.online = false; renderNav(); });
}

function setLanguage(lang) {
  if (!STRINGS[lang] || lang === state.lang) return;
  state.lang = lang;
  store.setLang(lang);
  render();
  if (state.page === "struggle" && state.topic) renderReader();
}

function saveJournal() {
  const box = $("#journal-input");
  const status = $("#journal-status");
  if (!box) return;
  const text = box.value.trim();
  if (!text) return;
  state.journal = store.addEntry(text);
  box.value = "";
  if (status) status.textContent = t("saved");
  renderJournal();
  const again = $("#journal-status");
  if (again) again.textContent = t("saved");
}

function exportJournal() {
  const payload = {
    app: "Pad van Genade",
    exported: new Date().toISOString(),
    language: state.lang,
    journal: state.journal,
    savedTopics: state.saved.map((slug) => state.content.topics.find((x) => x.slug === slug)?.title[state.lang] ?? slug),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pad-van-genade-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function speakVerse(lang) {
  if (lang !== "en") return;
  const topic = state.content?.topics.find((x) => x.slug === state.topic);
  if (!topic) return;
  const passage = topic.passages[state.passage];
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(passage.en.text);
  utter.lang = "en-ZA";
  utter.rate = 0.95;
  speechSynthesis.speak(utter);
}

/* Bring the other-language rendering of the verse into view. Purely visual:
   no speech, so it cannot hijack the "read aloud" action. */
function showAltLang() {
  const alt = $("#page-reader .verse__alt");
  if (!alt) return;
  alt.scrollIntoView({ behavior: "smooth", block: "center" });
  alt.classList.remove("is-flagged");
  // Restart the animation so repeated presses replay it.
  void alt.offsetWidth;
  alt.classList.add("is-flagged");
}

function shareText(kind, index) {
  const host = $("#page-share");
  const cards = JSON.parse(host?.dataset.cards || "[]");
  const text = cards[index]?.text;
  if (!text) return;

  if (kind === "wa") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  } else if (kind === "sms") {
    window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
  } else {
    navigator.clipboard?.writeText(text).then(() => toast(t("shareCopied"))).catch(() => toast(t("shareCopied")));
  }
}

let toastTimer;
function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.dataset.show = "true";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.dataset.show = "false"), 2400);
}

/* ------------------------------------------------------------------ shell */

function renderShell() {
  document.getElementById("app").innerHTML = `
    <a class="skip-link" href="#main">${esc(STRINGS[state.lang].skipToContent)}</a>

    <header class="masthead">
      <div class="wrap masthead__row">
        <div class="masthead__panel">
          <p class="masthead__eyebrow" id="mast-eyebrow"></p>
          <h1 id="brand-name"></h1>
          <p class="masthead__tag" id="brand-tag"></p>
          <p class="masthead__tag" id="mast-tag" style="margin-top:.75rem;font-family:var(--sans);font-size:.95rem"></p>
          <div class="masthead__actions">
            <span class="chip" id="offline-badge" hidden style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff"></span>
            <button class="btn masthead__cta" data-page="struggle" id="hero-cta"></button>
          </div>
        </div>
      </div>
    </header>

    <nav class="nav" aria-label="Main">
      <div class="wrap nav__bar">
        <div class="nav__inner" id="nav-inner"></div>
        <div class="langswitch" id="lang-switch"></div>
      </div>
    </nav>

    <main id="main">
      <div class="wrap">
        <section class="page" id="page-today"></section>
        <section class="page" id="page-struggle" hidden></section>
        <section class="page" id="page-reader" hidden></section>
        <section class="page" id="page-journal" hidden></section>
        <section class="page" id="page-help" hidden></section>
        <section class="page" id="page-share" hidden></section>
        <section class="page" id="page-about" hidden></section>
      </div>
    </main>

    <footer class="footer">
      <div class="wrap footer__inner">
        <p class="footer__note" id="footer-note"></p>
        <div>
          <div class="footer__links">
            <a href="#/help" data-page="help">${esc(STRINGS[state.lang].navHelp)}</a>
            <a href="#/about" data-page="about">${esc(STRINGS[state.lang].navAbout)}</a>
          </div>
          <p class="muted" style="margin:.5rem 0 0" id="footer-rights"></p>
        </div>
      </div>
    </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;
}

function renderFatal(err) {
  console.error(err);
  document.getElementById("app").innerHTML = `
    <main class="wrap" style="padding-block:4rem">
      <div class="card measure" style="margin-inline:auto">
        <h2>${esc(state.lang === "af" ? "Iets het fout gegaan" : "Something went wrong")}</h2>
        <p>${esc(state.lang === "af"
          ? "Die bladsy kon nie laai nie. Laai die bladsy weer of probeer later."
          : "The page could not load. Reload, or try again later.")}</p>
        <pre class="muted" style="white-space:pre-wrap;overflow:auto">${esc(String(err))}</pre>
      </div>
    </main>`;
}

function registerSW() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* Offline support is a bonus, not a requirement. */
    });
  }
}

boot();