#!/usr/bin/env python3
"""Verse text extraction for Pad van Genade.

Two public-domain sources:
  Afrikaans: Die Bybel in Afrikaans (1953), via Wordproject (bibles/af_2).
  English:   Berean Standard Bible, CC0, via scrollmapper/bible_databases.

Both are cached on disk under tools/cache/ so the build is repeatable and
offline after the first run. Nothing here is hand-written: every string in
verses.json came out of one of these two texts.

This module is used by tools/build.py only.
"""

import json
import os
import re
import html as htmlmod
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
os.makedirs(CACHE, exist_ok=True)

WORDPROJECT_AF = "https://www.wordproject.org/bibles/af_2"
BSB_JSON_URL = (
    "https://raw.githubusercontent.com/scrollmapper/bible_databases/"
    "master/sources/en/BSB/BSB.json"
)

# slug -> (Wordproject book number, BSB book index)
BOOKS = {
    "gen": (1, 0), "exo": (2, 1), "lev": (3, 2), "num": (4, 3), "deu": (5, 4),
    "jos": (6, 5), "jdg": (7, 6), "rut": (8, 7), "1sa": (9, 8), "2sa": (10, 9),
    "1ki": (11, 10), "2ki": (12, 11), "1ch": (13, 12), "2ch": (14, 13),
    "ezr": (15, 14), "neh": (16, 15), "est": (17, 16), "job": (18, 17),
    "psa": (19, 18), "pro": (20, 19), "ecc": (21, 20), "sng": (22, 21),
    "isa": (23, 22), "jer": (24, 23), "lam": (25, 24), "ezk": (26, 25),
    "dan": (27, 26), "hos": (28, 27), "jol": (29, 28), "amo": (30, 29),
    "oba": (31, 30), "jon": (32, 31), "mic": (33, 32), "nam": (34, 33),
    "hab": (35, 34), "zep": (36, 35), "hag": (37, 36), "zec": (38, 37),
    "mal": (39, 38), "mat": (40, 39), "mrk": (41, 40), "luk": (42, 41),
    "jhn": (43, 42), "act": (44, 43), "rom": (45, 44), "1co": (46, 45),
    "2co": (47, 46), "gal": (48, 47), "eph": (49, 48), "php": (50, 49),
    "col": (51, 50), "1th": (52, 51), "2th": (53, 52), "1ti": (54, 53),
    "2ti": (55, 54), "tit": (56, 55), "phm": (57, 56), "heb": (58, 57),
    "jas": (59, 58), "1pe": (60, 59), "2pe": (61, 60), "1jn": (62, 61),
    "2jn": (63, 62), "3jn": (64, 63), "jud": (65, 64), "rev": (66, 65),
}

# Display names. Afrikaans names are the Wordproject book headings, English the
# BSB book names, so the reference renders in the reader's own language.
NAMES_AF = {
    "gen": "Genesis", "exo": "Eksodus", "lev": "Levitikus", "num": "Numeri",
    "deu": "Deuteronomium", "jos": "Josua", "jdg": "Rigters", "rut": "Rut",
    "1sa": "1 Samuel", "2sa": "2 Samuel", "1ki": "1 Konings", "2ki": "2 Konings",
    "1ch": "1 Kronieke", "2ch": "2 Kronieke", "ezr": "Esra", "neh": "Nehemiah",
    "est": "Ester", "job": "Job", "psa": "Psalms", "pro": "Spreuke",
    "ecc": "Prediker", "sng": "Hooglied", "isa": "Jesaja", "jer": "Jeremia",
    "lam": "Klaagliedere", "ezk": "Esegiël", "dan": "Daniël", "hos": "Hosea",
    "jol": "Joël", "amo": "Amos", "oba": "Obadja", "jon": "Jona", "mic": "Miga",
    "nam": "Nahum", "hab": "Habakuk", "zep": "Sefanja", "hag": "Haggai",
    "zec": "Sagaria", "mal": "Maleagi", "mat": "Matteus", "mrk": "Markus",
    "luk": "Lukas", "jhn": "Johannes", "act": "Handelinge", "rom": "Romeine",
    "1co": "1 Korintiërs", "2co": "2 Korintiërs", "gal": "Galasiërs",
    "eph": "Effesiërs", "php": "Filippense", "col": "Kolossense",
    "1th": "1 Tessalonisense", "2th": "2 Tessalonisense", "1ti": "1 Timoteus",
    "2ti": "2 Timoteus", "tit": "Titus", "phm": "Filemon", "heb": "Hebreërs",
    "jas": "Jakobus", "1pe": "1 Petrus", "2pe": "2 Petrus", "1jn": "1 Johannes",
    "2jn": "2 Johannes", "3jn": "3 Johannes", "jud": "Judas", "rev": "Openbaring",
}

NAMES_EN = {
    "gen": "Genesis", "exo": "Exodus", "lev": "Leviticus", "num": "Numbers",
    "deu": "Deuteronomy", "jos": "Joshua", "jdg": "Judges", "rut": "Ruth",
    "1sa": "1 Samuel", "2sa": "2 Samuel", "1ki": "1 Kings", "2ki": "2 Kings",
    "1ch": "1 Chronicles", "2ch": "2 Chronicles", "ezr": "Ezra",
    "neh": "Nehemiah", "est": "Esther", "job": "Job", "psa": "Psalms",
    "pro": "Proverbs", "ecc": "Ecclesiastes", "sng": "Song of Songs",
    "isa": "Isaiah", "jer": "Jeremiah", "lam": "Lamentations",
    "ezk": "Ezekiel", "dan": "Daniel", "hos": "Hosea", "jol": "Joel",
    "amo": "Amos", "oba": "Obadiah", "jon": "Jonah", "mic": "Micah",
    "nam": "Nahum", "hab": "Habakkuk", "zep": "Zephaniah", "hag": "Haggai",
    "zec": "Zechariah", "mal": "Malachi", "mat": "Matthew", "mrk": "Mark",
    "luk": "Luke", "jhn": "John", "act": "Acts", "rom": "Romans",
    "1co": "1 Corinthians", "2co": "2 Corinthians", "gal": "Galatians",
    "eph": "Ephesians", "php": "Philippians", "col": "Colossians",
    "1th": "1 Thessalonians", "2th": "2 Thessalonians", "1ti": "1 Timothy",
    "2ti": "2 Timothy", "tit": "Titus", "phm": "Philemon",
    "heb": "Hebrews", "jas": "James", "1pe": "1 Peter", "2pe": "2 Peter",
    "1jn": "1 John", "2jn": "2 John", "3jn": "3 John", "jud": "Jude",
    "rev": "Revelation",
}

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64)"}

# Longest chapter in either source is Psalm 119 (176 verses). Anything above
# this in the parsed stream is chapter-heading residue, not a verse number.
MAX_VERSE = 200


def _cache_path(kind, key):
    return os.path.join(CACHE, f"{kind}-{key}.json")


def _load_cache(kind, key):
    p = _cache_path(kind, key)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as fh:
            return json.load(fh)
    return None


def _save_cache(kind, key, value):
    with open(_cache_path(kind, key), "w", encoding="utf-8") as fh:
        json.dump(value, fh, ensure_ascii=False)


def _fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"fetch failed: {url}: {last}")


# --------------------------------------------------------------------------
# Afrikaans (Wordproject, 1953)
# --------------------------------------------------------------------------

def af_chapter(book_slug, chapter):
    """Return {verse_number: text} for one chapter of the Afrikaans Bible.

    Keys are always ints: JSON round-trips turn them into strings, so the
    cached form is normalised on the way out.
    """
    key = f"af-{book_slug}-{chapter}"
    cached = _load_cache("af", key)
    if cached is not None:
        return {int(k): v for k, v in cached.items()}

    number, _ = BOOKS[book_slug]
    raw = _fetch(f"{WORDPROJECT_AF}/{number:02d}/{chapter}.htm")
    m = re.search(r'<div class="textBody" id="textBody">(.*)', raw, re.S)
    body = m.group(1) if m else raw

    # Verse markers are <span class="verse" id="18">18 </span>, except verse 1,
    # which Wordproject emits as a malformed comment -- the literal is
    # `<!--span class="verse" id="1">1 </span-->`: the opening `<` is swallowed
    # by the comment opener, so the tag never closes. Matching only the
    # well-formed shape silently dropped verse 1 from every chapter. Handle both
    # shapes, then discard whatever comments remain.
    body = re.sub(
        r"<!--\s*<?span class=\"verse\" id=\"(\d+)\">\s*\d+\s*</span\s*-->",
        r"\1",
        body,
    )
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    body = re.sub(r"<span class=\"verse\" id=\"(\d+)\">\s*\d+\s*</span>", r"\1", body)

    # Drop the chapter heading outright ("Hoofstuk 34"). Its trailing number is
    # otherwise read as a verse marker, which both invents a phantom verse and
    # leaves the psalm superscription stranded as text.
    body = re.sub(r"<h3>.*?</h3>", " ", body, flags=re.S | re.I)

    # Poetic books carry an inline superscript such as "(34:19)" at the head of
    # each verse. Strip it, but only when the chapter number matches, so real
    # numbers inside the text survive.
    # The superscript's chapter number does not always match the page: Job 41
    # is numbered "(40:20)" throughout, and one marker even ships with the
    # closing bracket missing ("(40:23"). So match the shape generically and
    # make both brackets optional rather than anchoring on `chapter`.
    body = re.sub(r"\(?\d{1,3}:\d{1,3}\)?", " ", body)
    body = re.sub(r"<br\s*/?>", " ", body)
    body = re.sub(r"<[^>]+>", "", body)
    text = re.sub(r"\s+", " ", htmlmod.unescape(body)).strip()

    verses = {}
    parts = re.split(r"(\d+)", text)
    for i in range(1, len(parts) - 1, 2):
        val = parts[i + 1].strip()
        # Strip the site footer that trails the last verse of the chapter.
        val = re.split(r"(Wordproject®|<h4)", val)[0].strip()
        val = re.sub(r"\s*(Hoofstuk|Chapter)\s*\d*\s*$", "", val).strip()
        # A bare "(" or ":" is punctuation residue from a stripped superscript
        # or separator, never a verse.
        if len(val) <= 1:
            continue
        number = int(parts[i])
        # The psalm superscription ("'n Psalm van Dawid") sits in the chapter
        # heading, and once the heading is stripped it lands as a stray high
        # number (34:27 for Psalm 34). A real verse never has a number far
        # above its chapter length, so anything past MAX_VERSE is heading
        # residue rather than a verse.
        if number > MAX_VERSE:
            continue
        verses[number] = val

    _save_cache("af", key, {str(k): v for k, v in verses.items()})
    return verses


# --------------------------------------------------------------------------
# English (Berean Standard Bible, CC0)
# --------------------------------------------------------------------------

def _bsb_book():
    cached = _load_cache("bsb", "books")
    if cached is not None:
        return cached
    raw = _fetch(BSB_JSON_URL)
    books = json.loads(raw)["books"]
    out = []
    for b in books:
        chapters = {}
        for c in b["chapters"]:
            verses = {str(v["verse"]): v["text"].strip() for v in c["verses"]}
            chapters[str(c["chapter"])] = verses
        out.append(chapters)
    _save_cache("bsb", "books", out)
    return out


def en_verse(book_slug, chapter, verse):
    _, idx = BOOKS[book_slug]
    return _bsb_book()[idx][str(chapter)][str(verse)]


def reference(book_slug, chapter, verse, lang):
    """Format a human-readable reference, e.g. 'Psalm 34:18' / 'Psalms 34:18'."""
    names = NAMES_AF if lang == "af" else NAMES_EN
    name = names[book_slug]
    # English convention: "1 John 4:8" not "1 John"; Afrikaans "1 Johannes".
    return f"{name} {chapter}:{verse}"


def fetch_verse(book_slug, chapter, verse):
    """Return {'af': text, 'en': text, 'ref_af': str, 'ref_en': str}."""
    af = af_chapter(book_slug, chapter).get(verse)
    if not af:
        raise KeyError(f"Afrikaans verse not found: {book_slug} {chapter}:{verse}")
    return {
        "af": af.strip(),
        "en": en_verse(book_slug, chapter, verse).strip(),
        "ref_af": reference(book_slug, chapter, verse, "af"),
        "ref_en": reference(book_slug, chapter, verse, "en"),
    }