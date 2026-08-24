#!/usr/bin/env python3
"""
OpenSanctions yield scan for 2027 primary candidates.

Filters the primaries JSON by electionType, dedupes names, runs each through the
hosted OpenSanctions /match endpoint (batched), applies the plan's §3.5 token
name-match guard, and reports which candidates carry a REAL serious topic
(sanction / crime.* / debarment / wanted) vs routine role.pep vs no-match.

Usage:
  python3 .context/os_scan.py <electionType> [--out <path>]
    electionType ∈ senatorial | house_of_reps | gubernatorial | presidential | all
Output: human summary to stdout + full JSON to --out (default .context/os_scan_<type>.json)
"""
import json, os, sys, time, urllib.request, urllib.error, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(ROOT, ".context", "party-candidates-2027-primaries.json")
KEY_PATH = os.path.join(ROOT, ".context", ".osanctions_key")
API = "https://api.opensanctions.org/match/default?limit=1&threshold=0.7"
ENTITY_URL = "https://www.opensanctions.org/entities/{}/"
SERIOUS_PREFIXES = ("sanction", "crime", "debarment", "wanted")
BATCH = 50

def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", (s or "").lower())).strip()

def tokens(s):
    return [t for t in norm(s).split(" ") if t]

def guard_pass(cand_name, entity_names):
    """Plan §3.5: every token of the candidate name appears in some entity name."""
    ct = tokens(cand_name)
    if not ct:
        return False
    ent_tokens = set()
    for n in entity_names:
        ent_tokens.update(tokens(n))
    return all(t in ent_tokens for t in ct)

def load_targets(etype):
    d = json.load(open(JSON_PATH))
    seen = {}
    for party, arr in d.items():
        if party == "_meta":
            continue
        for c in arr:
            if etype != "all" and c.get("electionType") != etype:
                continue
            name = c.get("candidateName")
            if not name:
                continue
            key = norm(name)
            if key not in seen:
                seen[key] = {"name": name, "parties": set(), "states": set(),
                             "constituencies": set(), "electionType": c.get("electionType")}
            seen[key]["parties"].add(party)
            if c.get("stateCode"):
                seen[key]["states"].add(c["stateCode"])
            if c.get("constituency"):
                seen[key]["constituencies"].add(c["constituency"])
    return list(seen.values())

def call_match(batch, key):
    queries = {f"q{i}": {"schema": "Person", "properties": {"name": [t["name"]]}}
               for i, t in enumerate(batch)}
    body = json.dumps({"queries": queries}).encode()
    req = urllib.request.Request(API, data=body, method="POST", headers={
        "Authorization": f"ApiKey {key}", "Content-Type": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)["responses"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 * (attempt + 1)); continue
            raise
    raise RuntimeError("rate-limited after retries")

# Countries where Nigerian nationals are commonly subject to fraud/financial-crime
# / sanctions / debarment actions (for the diaspora cross-border rerun).
DIASPORA = ["us", "gb", "ca", "ae", "za", "ie", "au", "de", "it", "my",
            "nl", "es", "sg", "hk", "ch", "fr", "be", "qa", "sa", "in",
            "cn", "gh", "at", "se", "no", "nz"]

def main():
    etype = sys.argv[1] if len(sys.argv) > 1 else "all"
    # Country gate: --countries ng (default) | diaspora | us,gb,ca,...
    countries = ["ng"]
    if "--countries" in sys.argv:
        val = sys.argv[sys.argv.index("--countries") + 1]
        countries = DIASPORA if val == "diaspora" else [c.strip().lower() for c in val.split(",")]
    cset = set(countries)
    tag = "ng" if cset == {"ng"} else ("diaspora" if cset == set(DIASPORA) else "custom")
    out = ".context/os_scan_%s_%s.json" % (etype, tag)
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    key = open(KEY_PATH).read().strip()
    targets = load_targets(etype)
    print(f"[{etype}] {len(targets)} unique names; country-gate={sorted(cset)}; batches of {BATCH}...", flush=True)

    results = []
    for i in range(0, len(targets), BATCH):
        batch = targets[i:i + BATCH]
        resp = call_match(batch, key)
        for j, t in enumerate(batch):
            res = resp[f"q{j}"]["results"]
            rec = {"name": t["name"], "electionType": t["electionType"],
                   "parties": sorted(t["parties"]), "states": sorted(t["states"]),
                   "match": None}
            if res:
                top = res[0]
                p = top.get("properties", {})
                topics = p.get("topics", [])
                ent_names = p.get("name", []) + p.get("alias", [])
                serious = sorted({tp for tp in topics
                                  if tp.startswith(SERIOUS_PREFIXES)})
                rec["match"] = {
                    "id": top.get("id"), "caption": top.get("caption"),
                    "score": round(top.get("score", 0), 3),
                    "matched": top.get("match"),
                    "topics": topics, "serious": serious,
                    "country": p.get("country", []),
                    "datasets": top.get("datasets", []),
                    "guard_pass": guard_pass(t["name"], ent_names),
                    "url": ENTITY_URL.format(top.get("id")),
                }
            results.append(rec)
        print(f"  ...{min(i+BATCH, len(targets))}/{len(targets)}", flush=True)
        time.sleep(0.5)

    # Buckets. CONFIRMED = serious topic AND name-guard passes AND entity is Nigerian.
    # (The country=ng gate is essential: alias collisions pass the token guard —
    #  e.g. an ISWAP entity aliased "Muhammad Khalid Hassan", country iq/sy.)
    def has_serious(r):
        return r["match"] and r["match"]["serious"]
    def in_gate(r):
        return bool(cset & set(r["match"]["country"] or []))
    serious_guard = [r for r in results if has_serious(r) and r["match"]["guard_pass"] and in_gate(r)]
    serious_suspect = [r for r in results if has_serious(r)
                       and not (r["match"]["guard_pass"] and in_gate(r))]
    pep = [r for r in results if r["match"] and not has_serious(r)
           and any(t.startswith("role") for t in r["match"]["topics"])]
    nomatch = [r for r in results if not r["match"]]

    json.dump({"electionType": etype, "total": len(results),
               "serious_guard_pass": serious_guard,
               "serious_suspect_false_positive": serious_suspect,
               "counts": {"total": len(results), "serious_confirmed": len(serious_guard),
                          "serious_suspect": len(serious_suspect), "pep_only": len(pep),
                          "no_match": len(nomatch)}},
              open(os.path.join(ROOT, out), "w"), indent=2, ensure_ascii=False)

    print(f"\n===== [{etype}] SUMMARY =====")
    print(f"  total names          : {len(results)}")
    print(f"  SERIOUS (guard-pass) : {len(serious_guard)}   <-- the real yield")
    print(f"  serious (suspect FP) : {len(serious_suspect)}")
    print(f"  PEP-only (routine)   : {len(pep)}")
    print(f"  no match             : {len(nomatch)}")
    if serious_guard:
        print("\n  --- CONFIRMED serious hits (name-guard passed) ---")
        for r in serious_guard:
            m = r["match"]
            print(f"   * {r['name']}  [{','.join(r['parties'])}]  -> {m['caption']} "
                  f"score={m['score']} {m['serious']} country={m['country']}\n     {m['url']}")
    if serious_suspect:
        print("\n  --- suspect (serious topic but name-guard FAILED = likely false positive) ---")
        for r in serious_suspect:
            m = r["match"]
            print(f"   x {r['name']}  -> {m['caption']} score={m['score']} {m['serious']}")
    print(f"\n  full JSON -> {out}")

if __name__ == "__main__":
    main()
