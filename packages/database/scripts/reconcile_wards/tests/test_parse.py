from reconcile_wards.parse import parse_sc_rows, parse_lga_rows
from reconcile_wards.tests.fixtures.abia_sc_sample import ABIA_SC_ROWS
from reconcile_wards.tests.fixtures.abia_sd_sample import ABIA_SD_ROWS
from reconcile_wards.tests.fixtures.borno_sc_sample import BORNO_SC_ROWS


def test_parses_state_constituencies():
    out = parse_sc_rows(ABIA_SC_ROWS)
    names = {c.name for c in out}
    assert "Aba Central" in names  # sub-LGA constituency present
    aba = next(c for c in out if c.name == "Aba Central")
    assert aba.code_label == "SC/03/AB"  # code extracted, junk stripped
    assert "Aba River" in aba.wards  # RA COMPOSITION split on commas
    assert aba.ra_count == len(aba.wards)  # count-check holds


def test_parses_all_24_constituencies_count_consistent():
    out = parse_sc_rows(ABIA_SC_ROWS)
    assert len(out) == 24
    for c in out:
        assert c.ra_count == len(c.wards), f"{c.name}: ra_count {c.ra_count} != {len(c.wards)} wards"


def test_parses_borno_sc_with_separate_code_column():
    # BORNO has a dedicated CODE column that shifts RA COMPOSITION + counts
    # right by one relative to ABIA. Header-driven parsing must map by label,
    # not fixed index, so this recovers instead of reading CODE as wards.
    out = parse_sc_rows(BORNO_SC_ROWS)
    assert len(out) >= 6

    abadam = next(c for c in out if c.name == "Abadam")
    assert abadam.code_label == "SC/190/BO"  # code from the CODE column
    assert "Arege" in abadam.wards  # real ward, not a code fragment

    # Count-check holds for every constituency whose source RA COMPOSITION is
    # clean. Abadam is the one genuine source quirk in this window: INEC typed a
    # period instead of a comma between two wards ("Jabullam. Kudokurgu"), so it
    # parses 9 wards vs an ra_count of 10 — the pipeline surfaces that as a
    # count_mismatch downstream, it is NOT a column-mapping failure. Every other
    # constituency (RA count taken from the correct, shifted column) must hold.
    clean = [c for c in out if c.name != "Abadam"]
    assert len(clean) >= 5
    for c in clean:
        assert c.ra_count == len(c.wards), (
            f"{c.name}: ra_count {c.ra_count} != {len(c.wards)} wards"
        )


def test_parses_senatorial_district_lgas():
    out = parse_lga_rows(ABIA_SD_ROWS)
    names = {d.name for d in out}
    assert "Abia North" in names
    north = next(d for d in out if d.name == "Abia North")
    assert north.code_label == "SD/001/AB"
    assert "Arochukwu" in north.lgas  # LGA COMPOSITION carried under merged name cell
    assert "TOTAL" not in north.lgas  # TOTAL rows skipped
