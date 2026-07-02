from reconcile_wards.parse import parse_sc_rows, parse_lga_rows
from reconcile_wards.tests.fixtures.abia_sc_sample import ABIA_SC_ROWS
from reconcile_wards.tests.fixtures.abia_sd_sample import ABIA_SD_ROWS


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


def test_parses_senatorial_district_lgas():
    out = parse_lga_rows(ABIA_SD_ROWS)
    names = {d.name for d in out}
    assert "Abia North" in names
    north = next(d for d in out if d.name == "Abia North")
    assert north.code_label == "SD/001/AB"
    assert "Arochukwu" in north.lgas  # LGA COMPOSITION carried under merged name cell
    assert "TOTAL" not in north.lgas  # TOTAL rows skipped
