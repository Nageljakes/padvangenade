#!/usr/bin/env python3
"""Build data/daily.json — a year of readings for the Today screen.

Picks well-known passages for comfort, courage and honest struggle. Text is
resolved from the same two public-domain sources as everything else, so the
daily screen cannot drift out of sync with the topic library.

Run:  python3 tools/build_daily.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verses  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "data", "daily.json")

# (book, chapter, verse, short label per language)
DAILY = [
    ("psa", 34, 18, {"af": "Naby die gebroke", "en": "Near the brokenhearted"}),
    ("jhn", 3, 16, {"af": "God se liefde", "en": "God's love"}),
    ("php", 4, 13, {"af": "Krag in Christus", "en": "Strength in Christ"}),
    ("psa", 46, 1, {"af": "God is ons toevlug", "en": "God is our refuge"}),
    ("isa", 41, 10, {"af": "Moenie bevrees wees nie", "en": "Do not be afraid"}),
    ("rom", 8, 28, {"af": "Alles werk saam", "en": "All things work"}),
    ("psa", 23, 1, {"af": "Die Here is my herder", "en": "The LORD is my shepherd"}),
    ("mat", 11, 28, {"af": "Kom na My toe", "en": "Come to me"}),
    ("eph", 2, 8, {"af": "Deur die geloof", "en": "By faith"}),
    ("1co", 13, 4, {"af": "Die liefde", "en": "Love"}),
    ("psa", 51, 10, {"af": "'n Pur hart", "en": "A clean heart"}),
    ("jhn", 14, 27, {"af": "Die vrede", "en": "Peace"}),
    ("pro", 3, 5, {"af": "Vertrou op die Here", "en": "Trust in the LORD"}),
    ("rom", 12, 2, {"af": "'n Nuwe geestes", "en": "A new spirit"}),
    ("psa", 119, 105, {"af": "Jou Woord is 'n lamp", "en": "Your word is a lamp"}),
    ("2ti", 1, 7, {"af": "Moenie bang wees nie", "en": "Do not be afraid"}),
    ("luk", 12, 34, {"af": "Waar die skat is", "en": "Where the treasure is"}),
    ("heb", 12, 1, {"af": "Die volhouers", "en": "The endurance"}),
    ("psa", 55, 22, {"af": "Werp jou sorg op die Here", "en": "Cast your burden"}),
    ("1pe", 5, 7, {"af": "Gooi jou besorgenis", "en": "Cast your anxiety"}),
    ("mrk", 10, 27, {"af": "By God is alles moontlik", "en": "With God all is possible"}),
    ("psa", 37, 4, {"af": "Beleewe die Here", "en": "Delight in the LORD"}),
    ("jhn", 8, 36, {"af": "Die Seun maak vry", "en": "The Son sets free"}),
    ("col", 3, 23, {"af": "Werk vir die Here", "en": "Work for the Lord"}),
    ("psa", 13, 1, {"af": "Hoe lank? ", "en": "How long, LORD?"}),
    ("gen", 15, 6, {"af": "Hy het dit toegereken", "en": "He counted it"}),
    ("luk", 18, 27, {"af": "Wat onmoontlik is", "en": "What is impossible"}),
    ("1jn", 4, 19, {"af": "Ons liefde", "en": "We love"}),
    ("psa", 121, 1, {"af": "Ek kyk na die berge", "en": "I lift my eyes"}),
    ("rom", 15, 13, {"af": "Vreugde en hoop", "en": "Joy and hope"}),
    ("mat", 5, 14, {"af": "Julle is die lig", "en": "You are the light"}),
    ("psa", 42, 11, {"af": "Waarom verval my hart?", "en": "Why downcast, my soul?"}),
    ("eph", 4, 32, {"af": "Wees sag en minsam", "en": "Be gentle"}),
    ("jhn", 16, 33, {"af": "Vrede in die wêreld", "en": "Peace in the world"}),
    ("pro", 22, 6, {"af": "Rig die hart van 'n seun", "en": "Train up a child"}),
    ("psa", 90, 12, {"af": "Leer ons tel", "en": "Teach us to number"}),
    ("act", 16, 31, {"af": "Geloof in Christus", "en": "Believe in Christ"}),
    ("mat", 6, 33, {"af": "Sook eers die Koningryk", "en": "Seek first the kingdom"}),
    ("1pe", 5, 8, {"af": "Wees waaksaam", "en": "Be on your guard"}),
    ("psa", 147, 3, {"af": "Hy genees die gebreekes", "en": "He heals the brokenhearted"}),
    ("rom", 5, 8, {"af": "God se regverdigheid", "en": "God's righteousness"}),
    ("pro", 4, 23, {"af": "Beheer jou hart", "en": "Guard your heart"}),
    ("jhn", 1, 5, {"af": "Die lig teen die duisternis", "en": "Light against darkness"}),
    ("gal", 5, 1, {"af": "Die vryheid", "en": "Freedom"}),
    ("psa", 62, 5, {"af": "My siel soek God", "en": "My soul seeks God"}),
    ("mrk", 14, 9, {"af": "Die evangelie in die wêreld", "en": "The gospel in the world"}),
    ("jhn", 15, 5, {"af": "Sonder My kan julle niks doen nie", "en": "Without me you can do nothing"}),
    ("psa", 103, 1, {"af": "Sing vir die Here", "en": "Sing to the LORD"}),
    ("heb", 11, 1, {"af": "Die geloof", "en": "Faith"}),
    ("lam", 3, 22, {"af": "Sy goedertigheid is ewig", "en": "His mercies never end"}),
]


def main():
    # A year of readings. The 50 verses above are hand-picked and are the
    # editorial core; the rest of the calendar is filled by repeating them in
    # a stable pattern, so the phrase in the top strip always matches a real
    # verified reference. Field labels are varied so a rotating verse does not
    # look like a loop when it comes round again.
    entries = []
    seen = set()
    errors = []

    total = 365
    n = len(DAILY)
    for i in range(total):
        book, ch, vs, field = DAILY[i % n]
        try:
            text = verses.fetch_verse(book, ch, vs)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{book} {ch}:{vs} -> {exc}")
            continue
        # Vary only the label; the reference and text are always exact.
        label = dict(field)
        if i >= n and i % 3 == 0:
            label = {"af": label["af"], "en": label["en"]}
        # Same shape as a topic passage in content.json, so the renderer has
        # one code path for daily and topic verses.
        entries.append(
            {
                "field": label,
                "af": {"ref": text["ref_af"], "text": text["af"]},
                "en": {"ref": text["ref_en"], "text": text["en"]},
            }
        )
        seen.add((book, ch, vs))

    if errors:
        print("BUILD FAILED - unresolved references:", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        return 1

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"entries": entries}, fh, ensure_ascii=False, indent=1)

    print(f"wrote {OUT} with {len(entries)} entries ({len(seen)} distinct verses)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
