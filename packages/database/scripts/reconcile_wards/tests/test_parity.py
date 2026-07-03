"""Parity trust-anchor: prove the reconcile_wards pipeline reproduces the
known-good, worksheet-sourced ward mappings that a prior (manual/old-ingest)
pass already wrote into the seed for EBONYI and BAYELSA — before we trust it on
fresh states.

What "trustworthy" means here, precisely:

1. **No contradiction (hard assert).** For every existing worksheet-sourced
   ``(constituency_code, ward_code)`` pair, the pipeline must NEVER map that
   ward to a *different* constituency. It may reproduce the pair, or it may
   abstain (hold the ward for review / fail to resolve its LGA) — but it must
   never actively assert a conflicting mapping. This is the property that makes
   the auto-generated proposals safe to apply.

2. **High reproduction, closed discrepancy set (hard assert).** The pipeline
   reproduces the large majority of existing pairs directly. The pairs it does
   NOT reproduce are all *abstentions* (see below), never contradictions, and
   they are enumerated per state as an explicit, closed allow-list so a future
   regression that drops a currently-reproduced mapping fails this test.

3. **Net-new coverage (printed, not asserted).** The pipeline additionally
   proposes mappings the old method missed (e.g. Ebonyi's previously-unmapped
   Abakaliki North/South, Ezza South, Ikwo North, Ivo). These are surfaced for
   eyeballing but do not gate the test.

Why exact ``proposed ⊇ existing`` does NOT hold (documented, not silently
loosened): the new matcher is deliberately stricter than the old ingest. The
remaining non-reproduced pairs are all *abstentions*, not wrong mappings, and
stem from one residual quirk:

  * **Spelling-variant / unresolved-LGA constituencies** — some SC entries
    (e.g. Ebonyi Afikpo North East/West, Ishielu South "Nkomoro", Bayelsa Brass
    III, Sagbama III, Southern Ijaw III) either don't resolve to a DB LGA or
    name their RAs with a spelling that differs from the DB ward name
    (``Nkomoro`` vs DB ``Nkomor``, ``Umuchima`` vs ``Umic Hima``). Those don't
    clear the ACCEPT threshold and are held for the human residual worklist.

    These are DB-side data-quality issues to fix in a separate cleanup task, not
    parser/matcher faults, and the safe behaviour is exactly the abstention the
    pipeline performs.

Previously a SECOND quirk — **repeated-ones roman/arabic DB ward codes**
(``Bassambiri 11`` / ``Ogbolomabiri 111`` / ``Epie 11`` meaning II/III) — also
caused abstentions because the fuzzy matcher treated ``1`` / ``11`` / ``111`` as
mutually ambiguous. The matcher now unifies roman, arabic, and repeated-ones
numeral variants (``II`` == ``2`` == ``11``), so those pairs are reproduced and
have been pruned from the allow-list below.

The allow-lists below pin the current abstention set so it can only shrink (an
improvement) without a deliberate test update, and can never silently grow.

Requires the local docker DB (``ournigeria_db``) and network access to fetch the
INEC workbooks; skips cleanly when either is unavailable.
"""

from __future__ import annotations

import json

import pytest

from reconcile_wards.cli import reconcile_state
from reconcile_wards.paths import SEED_DIR

CONSTITUENCY_WARDS = SEED_DIR / "constituency-wards.json"

# --- Known, explainable abstentions (existing pairs the stricter pipeline does
# --- NOT reproduce). Each is an abstention, never a contradiction (asserted
# --- separately). This set may SHRINK freely (matcher improvement); if it
# --- GROWS, this test fails so a regression is caught.
ALLOWED_MISSING: dict[str, set[tuple[str, str]]] = {
    "ebonyi": {
        # Afikpo North East/West: the DB stores these wards under an
        # "afikpo_north_" LGA prefix while the worksheet spells the RA names
        # differently (Itim/Nkpoghoro/Ohaisu…) — spelling-variant abstentions
        # that need DB-side data cleanup, not matcher loosening.
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_itim_afikpo"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_nkpoghoro_afikpo"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_ohaisu_afikpo_a"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_ohaisu_afikpo_b"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_ugwuegu_afikpo"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_uwana_afikpo_1"),
        ("state_ebonyi_afikpo_north_east", "ebonyi_afikpo_north_uwana_afikpo_ii"),
        ("state_ebonyi_afikpo_north_west", "ebonyi_afikpo_north_amata_akpoha"),
        ("state_ebonyi_afikpo_north_west", "ebonyi_afikpo_north_amogu_akpoha"),
        ("state_ebonyi_afikpo_north_west", "ebonyi_afikpo_north_ezeke_amasiri"),
        ("state_ebonyi_afikpo_north_west", "ebonyi_afikpo_north_ibii_oziza_afikpo"),
        ("state_ebonyi_afikpo_north_west", "ebonyi_afikpo_north_poperi_amasiri"),
        # Ishielu South "Ezzagu II (Nkomoro)": worksheet Nkomoro vs DB Nkomor —
        # a spelling difference under ACCEPT.
        ("state_ebonyi_ishielu_south", "ebonyi_ishielu_ezzagu_nkomor"),
        # Izzi East Mgbalaku/Inyimagu I/II: worksheet & DB carry different
        # compound spellings; held for review.
        ("state_ebonyi_izzi_east", "ebonyi_izzi_mgbalaku_inyimagu_i"),
        ("state_ebonyi_izzi_east", "ebonyi_izzi_mgbalaku_inyimagu_ii"),
        # Ohaozara West "Umuchima" vs DB "Umic Hima": spelling-variant.
        ("state_ebonyi_ohaozara_west", "ebonyi_ohaozara_umic_hima"),
    },
    "bayelsa": {
        # Brass III / Sagbama III / Southern Ijaw III: unresolved-LGA
        # (roman-suffixed constituencies whose LGA the collation doesn't pin)
        # + spelling variants (Konsho vs kongho, Adoni, Central Boma). These are
        # data-quality abstentions, never contradictions.
        ("state_bayelsa_brass_iii", "bayelsa_brass_konsho"),
        ("state_bayelsa_brass_iii", "bayelsa_brass_os_inibiri"),
        ("state_bayelsa_sagbama_iii", "bayelsa_sagbama_adoni"),
        ("state_bayelsa_southern_ijaw_iii", "bayelsa_southern_ijaw_central_boma_i"),
        ("state_bayelsa_southern_ijaw_iii", "bayelsa_southern_ijaw_central_boma_ii"),
    },
}

# Minimum share of existing worksheet-sourced pairs the pipeline must reproduce.
# Actuals after roman/arabic/repeated-ones unification + multi-LGA scoping:
# ebonyi 85.8% (97/113), bayelsa 95.2% (100/105).
# (Was ebonyi 83.2% / bayelsa 86.7% before the matcher improvements.)
MIN_REPRODUCTION_RATE = 0.85

# (workbook name, seed source slug)
STATES = [("EBONYI", "ebonyi"), ("BAYELSA", "bayelsa")]


def _db_available() -> bool:
    import subprocess

    try:
        subprocess.run(
            ["docker", "exec", "ournigeria_db", "true"],
            capture_output=True,
            check=True,
            timeout=15,
        )
        return True
    except Exception:
        return False


def _existing_pairs(source: str) -> set[tuple[str, str]]:
    rows = json.loads(CONSTITUENCY_WARDS.read_text())
    return {
        (r["constituency_code"], r["ward_code"])
        for r in rows
        if r.get("source") == source
    }


def _proposed_pairs(workbook: str) -> set[tuple[str, str]]:
    """Run the read-only pipeline and return its proposed
    ``(constituency_code, ward_code)`` set."""
    _, _, additions, _, _, _ = reconcile_state(workbook)
    return {(c, w) for c, w, _conf in additions}


@pytest.fixture(scope="module")
def db_guard():
    if not _db_available():
        pytest.skip("ournigeria_db docker container not available")


@pytest.mark.parametrize("workbook,slug", STATES)
def test_pipeline_never_contradicts_known_good(workbook, slug, db_guard, capsys):
    """HARD: the pipeline never maps a known-good ward to a *different*
    constituency than the existing worksheet-sourced seed says."""
    source = f"inec_{slug}_sc_worksheet"
    existing = _existing_pairs(source)
    proposed = _proposed_pairs(workbook)

    # ward_code -> constituency_code, from the trusted existing mappings.
    existing_ward_owner = {w: c for c, w in existing}
    # ward_code -> constituency_code, as the pipeline proposes.
    proposed_ward_owner: dict[str, str] = {}
    for c, w in proposed:
        proposed_ward_owner.setdefault(w, c)

    contradictions = [
        (w, existing_ward_owner[w], proposed_ward_owner[w])
        for w in existing_ward_owner
        if w in proposed_ward_owner
        and proposed_ward_owner[w] != existing_ward_owner[w]
    ]

    with capsys.disabled():
        print(
            f"\n[{workbook}] contradictions (known-good ward mapped elsewhere): "
            f"{len(contradictions)}"
        )
        for w, exp, got in contradictions:
            print(f"    ward {w}: seed->{exp}  pipeline->{got}")

    assert not contradictions, (
        f"{workbook}: pipeline maps known-good wards to the wrong constituency: "
        f"{contradictions}"
    )


@pytest.mark.parametrize("workbook,slug", STATES)
def test_pipeline_reproduces_known_good(workbook, slug, db_guard, capsys):
    """HARD: proposed reproduces the large majority of existing pairs; any pair
    it does not reproduce is in the documented allow-list of abstentions, and
    the reproduction rate clears the floor. Net-new coverage is printed."""
    source = f"inec_{slug}_sc_worksheet"
    existing = _existing_pairs(source)
    proposed = _proposed_pairs(workbook)

    reproduced = existing & proposed
    missing = existing - proposed
    net_new = proposed - existing
    allowed = ALLOWED_MISSING.get(slug, set())

    rate = len(reproduced) / len(existing) if existing else 0.0
    existing_ccs = {c for c, _w in existing}
    net_new_ccs = sorted({c for c, _w in net_new if c not in existing_ccs})

    with capsys.disabled():
        print(f"\n[{workbook}] parity:")
        print(f"    existing worksheet pairs : {len(existing)}")
        print(f"    proposed pairs           : {len(proposed)}")
        print(f"    reproduced               : {len(reproduced)} ({rate * 100:.1f}%)")
        print(f"    missing (abstentions)    : {len(missing)}")
        print(f"    net-new pairs            : {len(net_new)}")
        if net_new_ccs:
            print("    net-new constituencies now covered (old method missed):")
            for c in net_new_ccs:
                print(f"        {c}")

    # Every non-reproduced existing pair must be a documented abstention.
    unexpected_missing = missing - allowed
    assert not unexpected_missing, (
        f"{workbook}: pipeline stopped reproducing known-good pairs not in the "
        f"documented allow-list (regression?): {sorted(unexpected_missing)}"
    )

    # Allow-list may shrink (improvement) but a stale entry that is now actually
    # reproduced should be pruned; flag it so the allow-list stays honest.
    stale_allowed = allowed & proposed
    assert not stale_allowed, (
        f"{workbook}: these ALLOWED_MISSING pairs are now reproduced — prune "
        f"them from the allow-list: {sorted(stale_allowed)}"
    )

    assert rate >= MIN_REPRODUCTION_RATE, (
        f"{workbook}: reproduction rate {rate:.1%} below floor "
        f"{MIN_REPRODUCTION_RATE:.0%}"
    )
