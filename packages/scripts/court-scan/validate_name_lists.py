#!/usr/bin/env python3
"""
Validate courtlistener-lookup's COMMON_TOKENS / honorifics lists against the real
2027 candidate population (.context/party-candidates-2027-primaries.json).

Reports: (a) token frequency across all candidate names — high-frequency tokens
missing from COMMON_TOKENS are namesake-collision risk; (b) what fraction of
candidates would be classified non-distinctive (party matches routed to leads);
(c) candidates whose name is ALL-common (never auto-file — should be common names).

Usage: python3 packages/scripts/court-scan/validate_name_lists.py [--top 40]
"""
import json, re, sys, os
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
JSON_PATH = os.path.join(ROOT, ".context", "party-candidates-2027-primaries.json")

# Mirror of courtlistener-lookup.ts COMMON_TOKENS — keep in sync when tuning.
COMMON = set("""
mohammed muhammed muhammad mohammad ahmed ahmad ali ibrahim musa sani umar usman
abubakar hassan hussain hussein khalid bello abdullahi abdullah abdulla adamu bala
garba yakubu suleiman sulaiman yusuf aliyu abdul lateef ismail isah isa idris shehu
salisu kabiru kabir tanko danjuma aminu nasir mustapha yahaya lawal baba abba
emmanuel john joseph james peter paul samuel david daniel michael anthony sunday
monday victor victoria mary grace blessing donald philip phillip francis patrick
christopher stephen steven george charles richard robert william thomas
solomon felix ifeanyi adekunle adebayo olanrewaju adeleke
smith brown johnson williams jones duke obi eze okafor okeke okoro edet effiong
okon bassey etim asuquo mahmud
""".split())

STOP = set("""
united states america usa us of the v vs et al
chief alhaji alhaja hon honourable honorable sen senator dr barr barrister engr
engineer prof professor arc mr mrs ms miss sir dame otunba oba hrh hrm gen general
col colonel capt captain major air cdre comrade pastor rev reverend elder deacon
evang evangelist prince princess amb ambassador chf rtd jp mni san phd
""".split())

def toks(s):
    s = re.sub(r"[^a-z0-9\s]", " ", (s or "").lower())
    return [t for t in s.split() if t and t not in STOP]

def main():
    top_n = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 40
    d = json.load(open(JSON_PATH))
    names = set()
    for party, arr in d.items():
        if party == "_meta":
            continue
        for c in arr:
            if c.get("candidateName"):
                names.add(c["candidateName"])

    freq = Counter()
    per_name = {}
    for n in names:
        t = toks(n)
        per_name[n] = t
        freq.update(set(t))  # count each token once per person

    total = len(names)
    print(f"population: {total} unique candidate names\n")

    print(f"=== top {top_n} tokens by bearer-count (✗ = NOT in COMMON_TOKENS → collision risk) ===")
    missing = []
    for tok, c in freq.most_common(top_n):
        mark = "  " if tok in COMMON else "✗ "
        if tok not in COMMON and c >= 8:
            missing.append((tok, c))
        print(f"  {mark}{tok:16} {c:4}  ({100*c/total:.1f}%)")

    allc = [n for n, t in per_name.items() if t and all(x in COMMON for x in t)]
    nond = [n for n, t in per_name.items() if len(t) < 2 or all(x in COMMON for x in t)]
    print(f"\nnon-distinctive (never auto-file, leads only): {len(nond)}/{total} ({100*len(nond)/total:.1f}%)")
    print("sample all-common names:", ", ".join(sorted(allc)[:12]))

    if missing:
        print(f"\n=== RECOMMEND adding to COMMON_TOKENS (>=8 bearers, not listed) ===")
        print("  " + " ".join(t for t, _ in missing))
    else:
        print("\nno high-frequency tokens missing from COMMON_TOKENS")

if __name__ == "__main__":
    main()
