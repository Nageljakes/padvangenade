# Pad van Genade

**'n Christelike hulpmiddel vir mense wat deur stryd gaan.**
*A Christian resource for people who are having a hard time.*

'n Vry, privaat, tweetalige webwerf wat Skrifte, gebed, een praktiese stap vir vandag,
en werklike Suid-Afrikaanse hulplyne aan Christene bied. Alles werk in die blaaier —
geen rekening, geen bediener, geen analities.

A free, private, bilingual site that gives Christians Scripture, prayer, one practical
step for today, and real South African helplines. Everything runs in the browser — no
account, no server, no analytics.

---

## Wat dit is nie

- Nie 'n kerk of gemeente nie.
- Nie 'n mediese of sielkundige diens nie.
- Nie 'n crisisdiens nie — ons kan nie bel nie.

As jy in onmiddellike gevaar is, bel **112** of **10111**.
As jy dink aan selfbeskadiging, bel **0800 567 567** (24 uur) of praat met iemand wat jy vertrou.

---

## Opsomming / At a glance

| | |
|---|---|
| ** tale | Afrikaans + English, met 'n taalwisselaar |
| ** Skrifte | Twee openbare-domein-vertalings (sien hieronder) |
| ** PWA | Installeerbaar, werk aflyn |
| ** Data | Nul bedieners. Alles in `localStorage` op die toestel |
| ** Inhoud | 54+ onderwerpe in 6 groepe, 365 dae se daaglikse verse |
| ** Hulp | 15 geverifieerde SA-dienste |

---

## Die Skrifbronne / Scripture sources

Alle Skrifwerk word **met die hand getik nie** nie. Dit word met die hand uit twee
openbare-domein-vertalings opgehaal tydens die bou, en daarna reg uit die databundel
gelees. Die boumisluk as enige verwysing nie opgelos kan word nie — 'n plaashouer kan
nooit by 'n leser uitkom nie.

All Scripture text is **fetched at build time** from two public-domain translations and
read from the generated data bundle. The build fails loudly rather than emitting a
placeholder, so a broken reference can never reach a reader.

| Taal | Vertaling | Bron |
|---|---|---|
| Afrikaans | Die Bybel in Afrikaans (1953) | [Wordproject](https://www.wordproject.org/bibles/af_2/) |
| English | Berean Standard Bible (CC0) | [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) |

---

## Bou / Building

Die webwerf is 'n **statiese PWA met geen bou-stapie nie** — geen bundler, geen
verpligtingsafhanklikes. Jy kan dit direk op enige statiese gasheer plaas
(GitHub Pages, Netlify, Cloudflare Pages, of enige webbediener).

The site is a **static PWA with no build step** — no bundler, no runtime dependencies.

```bash
# Net vir ontwikkeling
python3 -m http.server 8848
# open http://127.0.0.1:8848
```

Die Python-gereedskap in `tools/` is **slegs vir die databundel** en benod nie 'n webbediener nie.

### Die databundel herbou / Rebuilding the data bundle

```bash
python3 tools/build.py        # -> data/content.json  (onderwerpe + verse)
python3 tools/build_daily.py  # -> data/daily.json    (365 dae)
```

Albei lees uit `tools/verses.py`, wat die Skrifte ophaal en onder
`tools/cache/` plaas. Die eerste loop benod internet; daarna werk dit vanuit die
wapen om die bou te herhaal.

Both read `tools/verses.py`, which fetches Scripture and caches chapters under
`tools/cache/`. The first run needs network; after that the build is repeatable offline.

### Met `content.src.json` werk / Editing content

`tools/content.src.json` is die redakteurbron. Onderwerpe verwys na Skrifte by
**boek/hoofstuk/vers** — jy skryf nooit verse- teks self nie.

`tools/content.src.json` is the editorial source. Topics reference Scripture by
**book/chapter/verse** — you never type verse text yourself.

```jsonc
{
  "slug": "voorbeeld",
  "group": "emosies",                       // verslawing|emosies|geloof|verhoudings|lewe|pyn
  "title": { "af": "…", "en": "…" },
  "intro": { "af": "…", "en": "…" },
  "passages": [
    { "book": "psa", "ch": 34, "vs": 18,     // book slug, chapter, verse
      "field": { "af": "Naby die gebroke", "en": "Near the brokenhearted" } }
  ],
  "pastoral": {
    "af": { "reflect": "…", "prayer": "…", "step": "…" },
    "en": { "reflect": "…", "prayer": "…", "step": "…" }
  }
}
```

Na `python3 tools/build.py` verskyn die onderwerp met **regte** Skrifteks in albei tale.

---

## Struktuur / Layout

```
index.html                 # minimal static shell, no inline JS
manifest.webmanifest       # PWA manifest
sw.js                      # offline-first service worker
assets/                    # icons (SVG + rendered PNGs)
app/css/app.css            # all styling; light + dark are both first-class
app/js/app.js              # application shell and rendering
app/js/i18n.js             # every UI string, both languages
app/js/store.js            # localStorage wrapper, degrades to no-op if blocked
data/content.json          # BUILT — topics + real verse text
data/daily.json            # BUILT — 365 daily readings
data/help.json             # hand-verified helpline directory
tools/verses.py            # Scripture fetch + verse parsing (cached)
tools/build.py             # content.src.json -> data/content.json
tools/build_daily.py       # -> data/daily.json
tools/content.src.json     # editorial source of truth for topics
tools/topics/              # draft topic fragments (merged into content.src.json)
```

---

## Beelde / Images

The masthead carries one photograph, chosen from four per day by the date so the
page changes over the year without flickering between visits. Only the chosen
image is requested; the set totals ~270 KB as WebP.

| Subject | Licence |
|---|---|
| Amphitheatre, Drakensberg (KwaZulu-Natal) | Public domain |
| Table Mountain above cloud at sunrise (Cape Town) | CC0 |
| Sunflower field | CC BY-SA 4.0 |
| Springbok herd, Kgalagadi (Northern Cape) | CC BY-SA 2.0 |

All are reused from Wikimedia Commons, cropped and recompressed for the web with
no content change. The CC BY-SA images require attribution and that modified
copies keep the same licence, so the credit is rendered on the site under
**Oor → Beelde** / **About → Images**, generated from `assets/img/credits.json`.
Full provenance is in `assets/img/CREDITS.md`.

If scripting is unavailable or an image fails, the masthead falls back to the
brand gradient rather than appearing empty.

## Privaatheid / Privacy

Geen bediener. Geen rekening. Geen analities. Jou joernaal, gestoorde onderwerpe en
leesvordering leef slegs in jou blaaier se `localStorage` en word nooit na enige
adres gestuur nie. Jy kan alles van hier af vee.

No server, no account, no analytics. Your journal, saved topics and reading history live
only in your browser's local storage and are never sent anywhere. You can clear it all
from the site.

---

## Toestellings / Configuration

- **Taal**: outomatiese by die eerste besoek (volgens `navigator.language`); daarna
  gerespekteer dit die keuse. `app/js/store.js` → `getLang()`
- **Bron**: die databundel se `sources`-veld word op die Oor-bladsy gewys

---

## Lisensie / Licence

Die kode is vry. Die Skrifte is van openbare-domein-vertalings (sien
[Bronne](#die-skifbronne--scripture-sources)). Hulp- en kontaktinligting moet asseblief
akkuraat gehou word — dit is nie mediese advies nie.

The code is free. Scripture is from public-domain translations. Help and contact
information must be kept accurate — this is not medical advice.