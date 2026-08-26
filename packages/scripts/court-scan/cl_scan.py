#!/usr/bin/env python3
"""
CourtListener yield/legitimacy scan for 2027 primary candidates.

For each candidate name, queries CourtListener RECAP dockets (type=r, keyless),
then classifies:
  - DEFENDANT_MATCH : candidate's full name matches a non-US party (they are a
                      named party/defendant) -> strong lead (like Odunzeh)
  - FULLTEXT_ONLY   : count>0 but no party name-guard match (named in text /
                      forfeiture / namesake) -> weak lead, human review
  - NONE            : count == 0

Checkpointed: writes .context/cl_scan_<office>.json incrementally; re-run resumes
(skips already-queried names). Paced + 429 backoff for the keyless rate limit.

Usage: python3 .context/cl_scan.py <senatorial|gubernatorial|house_of_reps|presidential|all>
"""
import json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(ROOT, ".context", "party-candidates-2027-primaries.json")
API = "https://www.courtlistener.com/api/rest/v4/search/?type=r&q="
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
TOKEN_PATH = os.path.join(ROOT, ".context", ".courtlistener_token")
TOKEN = open(TOKEN_PATH).read().strip() if os.path.exists(TOKEN_PATH) else ""
PAUSE = 0.5 if TOKEN else 1.3  # authenticated allows faster pacing
STOP = {"united", "states", "america", "usa", "us", "of", "the", "v", "vs"}

def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", (s or "").lower())).strip()

def toks(s):
    return [t for t in norm(s).split(" ") if t and t not in STOP]

def load(etype):
    d = json.load(open(JSON_PATH))
    seen = {}
    for party, arr in d.items():
        if party == "_meta":
            continue
        for c in arr:
            if etype != "all" and c.get("electionType") != etype:
                continue
            n = c.get("candidateName")
            if not n:
                continue
            k = norm(n)
            if k not in seen:
                seen[k] = {"name": n, "parties": set(), "states": set(), "electionType": c.get("electionType")}
            seen[k]["parties"].add(party)
            if c.get("stateCode"):
                seen[k]["states"].add(c["stateCode"])
    return list(seen.values())

def search(name):
    url = API + urllib.parse.quote(f'"{name}"')
    hdr = {"User-Agent": UA}
    if TOKEN:
        hdr["Authorization"] = f"Token {TOKEN}"
    req = urllib.request.Request(url, headers=hdr)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(5 * (attempt + 1)); continue
            raise
        except Exception:
            time.sleep(3); continue
    raise RuntimeError("rate-limited/failed after retries")

def guard(cand, party_names):
    """Every token of candidate name appears in some single party's tokens."""
    ct = toks(cand)
    if not ct:
        return None
    for p in party_names:
        pt = set(toks(p))
        if pt and all(t in pt for t in ct):
            return p
    return None

def main():
    etype = sys.argv[1] if len(sys.argv) > 1 else "all"
    out = os.path.join(ROOT, ".context", f"cl_scan_{etype}.json")
    state = json.load(open(out)) if os.path.exists(out) else {"electionType": etype, "results": {}}
    targets = load(etype)
    todo = [t for t in targets if norm(t["name"]) not in state["results"]]
    print(f"[{etype}] {len(targets)} names, {len(todo)} to query (resume)...", flush=True)

    for i, t in enumerate(todo):
        try:
            d = search(t["name"])
        except Exception as e:
            print(f"  ABORT at {t['name']}: {e}. Progress saved; re-run to resume.", flush=True)
            break
        cnt = d.get("count") or 0
        rec = {"name": t["name"], "electionType": t["electionType"],
               "parties": sorted(t["parties"]), "states": sorted(t["states"]),
               "count": cnt, "bucket": "NONE", "hits": []}
        if cnt:
            for r in (d.get("results") or [])[:25]:
                pn = r.get("party") or []
                m = guard(t["name"], pn) if pn else None
                hit = {"caseName": r.get("caseName"), "court": r.get("court"),
                       "court_id": r.get("court_id"), "docketNumber": r.get("docketNumber"),
                       "dateFiled": r.get("dateFiled"), "party": pn,
                       "url": "https://www.courtlistener.com" + (r.get("docket_absolute_url") or ""),
                       "defendant_match": m}
                rec["hits"].append(hit)
            rec["bucket"] = "DEFENDANT_MATCH" if any(h["defendant_match"] for h in rec["hits"]) else "FULLTEXT_ONLY"
        state["results"][norm(t["name"])] = rec
        if (i + 1) % 20 == 0:
            json.dump(state, open(out, "w"), indent=1, ensure_ascii=False)
            print(f"  ...{i+1}/{len(todo)}", flush=True)
        time.sleep(PAUSE)
    json.dump(state, open(out, "w"), indent=1, ensure_ascii=False)

    # Post-process: split defendant-matches into CRIMINAL ("United States v. X" —
    # the corruption/conviction signal) vs CIVIL/other (records disputes,
    # defamation, bankruptcies — mostly namesake noise or non-corruption).
    def crim(h):
        return norm(h.get("caseName") or "").startswith("united states v")
    res = list(state["results"].values())
    crim_leads, civ_leads = [], []
    for r in res:
        if r["bucket"] != "DEFENDANT_MATCH":
            continue
        mh = [h for h in r["hits"] if h["defendant_match"]]
        (crim_leads if any(crim(h) for h in mh) else civ_leads).append(r)
    ft = [r for r in res if r["bucket"] == "FULLTEXT_ONLY"]
    none = [r for r in res if r["bucket"] == "NONE"]
    print(f"\n===== [{etype}] queried {len(res)}/{len(targets)} =====")
    print(f"  CRIMINAL defendant-match (US v. <name>) : {len(crim_leads)}  <-- corruption/conviction signal")
    print(f"  CIVIL/other defendant-match            : {len(civ_leads)}  (records/defamation/bankruptcy — mostly namesake)")
    print(f"  FULLTEXT_ONLY (named-in / namesake)    : {len(ft)}")
    print(f"  NONE (no US case)                      : {len(none)}")
    if crim_leads:
        print("\n  --- CRIMINAL leads (the ones that matter) ---")
        for r in crim_leads:
            for h in r["hits"]:
                if h["defendant_match"] and crim(h):
                    print(f"   * {r['name']} [{','.join(r['parties'])}] -> {h['caseName']} ({h['court_id']} {h['docketNumber']})\n     {h['url']}")
    if civ_leads:
        print("\n  --- civil/other defendant-match (context) ---")
        for r in civ_leads:
            hh = next(h for h in r["hits"] if h["defendant_match"])
            print(f"   ~ {r['name']} -> {hh['caseName']} ({hh['court_id']})")
    print(f"\n  json -> {out}")

if __name__ == "__main__":
    main()
