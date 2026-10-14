#!/usr/bin/env python3
"""Build the Pad van Genade data bundle.

Reads tools/content.src.json, resolves every passage to real text from the two
public-domain sources via tools/verses.py, and writes the flat JSON the site
ships. Fails loudly on a bad reference rather than emitting a placeholder, so a
missing verse can never reach a reader.

Run:  python3 tools/build.py
"""

import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verses  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "content.src.json")
OUT = os.path.join(ROOT, "data", "content.json")
# Base URL used only for the absolute links search engines need in a sitemap.
# This must match where the site is actually served, or the sitemap advertises
# a domain that does not exist. Override with PVG_SITE when deploying elsewhere.
SITE = os.environ.get(
    "PVG_SITE", "https://nageljakes.github.io/padvangenade"
).rstrip("/")
SITEMAP = os.path.join(ROOT, "sitemap.xml")

# Attribution is written into the bundle itself so the running site can always
# name its sources, and so a future editor cannot quietly change them.
SOURCES = {
    "af": {
        "label": "Die Bybel in Afrikaans (1953)",
        "via": "Wordproject",
        "url": "https://www.wordproject.org/bibles/af_2/",
    },
    "en": {
        "label": "Berean Standard Bible",
        "via": "CC0 / scrollmapper",
        "url": "https://github.com/scrollmapper/bible_databases",
    },
}


def main():
    with open(SRC, encoding="utf-8") as fh:
        src = json.load(fh)

    group_ids = {g["id"] for g in src["groups"]}
    out_groups = []
    for g in src["groups"]:
        out_groups.append(
            {
                "id": g["id"],
                "af": g["af"],
                "en": g["en"],
                "blurb": g["blurb"],
            }
        )

    out_topics = []
    errors = []
    seen = set()

    for t in src["topics"]:
        slug = t["slug"]
        if slug in seen:
            errors.append(f"duplicate topic slug: {slug}")
            continue
        seen.add(slug)
        if t["group"] not in group_ids:
            errors.append(f"{slug}: unknown group '{t['group']}'")
            continue

        passages = []
        for p in t["passages"]:
            book, ch, vs = p["book"], int(p["ch"]), int(p["vs"])
            try:
                text = verses.fetch_verse(book, ch, vs)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{slug}: {book} {ch}:{vs} -> {exc}")
                continue
            passages.append(
                {
                    "field": p["field"],
                    "af": {"ref": text["ref_af"], "text": text["af"]},
                    "en": {"ref": text["ref_en"], "text": text["en"]},
                }
            )

        if not passages:
            continue

        pastoral = t["pastoral"]
        out_topics.append(
            {
                "slug": slug,
                "group": t["group"],
                "title": t["title"],
                "intro": t["intro"],
                "pastoral": pastoral,
                "passages": passages,
            }
        )

    if errors:
        print("BUILD FAILED - unresolved references:", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        return 1

    bundle = {
        "version": 2,
        "sources": SOURCES,
        "groups": out_groups,
        "topics": out_topics,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(bundle, fh, ensure_ascii=False, indent=1)

    n_verses = sum(len(t["passages"]) for t in out_topics)
    print(f"wrote {OUT}")
    print(f"  {len(out_groups)} groups, {len(out_topics)} topics, {n_verses} passages")
    print(f"  af: {SOURCES['af']['label']} | en: {SOURCES['en']['label']}")

    write_sitemap(out_topics)
    return 0


def write_sitemap(topics):
    """Generate sitemap.xml from the built topic list so it can never drift."""
    today = datetime.date.today().isoformat()
    urls = [f"{SITE}/", f"{SITE}/#/help", f"{SITE}/#/about"]
    urls += [f"{SITE}/#/struggle/{t['slug']}" for t in topics]
    body = "\n".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in urls)
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n"
        "</urlset>\n"
    )
    with open(SITEMAP, "w", encoding="utf-8") as fh:
        fh.write(xml)
    print(f"wrote {SITEMAP} with {len(urls)} urls")


if __name__ == "__main__":
    sys.exit(main())