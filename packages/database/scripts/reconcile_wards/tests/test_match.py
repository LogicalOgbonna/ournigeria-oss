from reconcile_wards.match import (
    match_one,
    resolve_constituency_lga,
    resolve_constituency_lgas,
)
from reconcile_wards.parse import ParsedConstituency, ParsedDistrict

CANDS = [
    ("w_ariaria", "Ariaria Market"),
    ("w_eziama", "Eziama"),
    ("w_ohafor1", "Ohafor I"),
]


def test_exact_after_normalize():
    assert match_one("ariaria market", CANDS).code == "w_ariaria"


def test_fuzzy_roman_arabic():
    assert match_one("Ohafor 1", CANDS).code == "w_ohafor1"  # roman/arabic reconciled


def test_ambiguous_returns_none_for_review():
    cands = [("a", "Umuahia North I"), ("b", "Umuahia North II")]
    m = match_one("Umuahia North", cands)
    assert m.code is None and m.needs_review is True  # two close candidates → no auto-pick


def test_unmatched():
    assert match_one("Nowhere Ward", CANDS).code is None


# ---------------------------------------------------------------------------
# roman / arabic / repeated-ones digit-variant unification
# ---------------------------------------------------------------------------
#
# DB ward NAMES encode roman numerals inconsistently: some as proper roman
# (Ogbolomabiri I/II/III), some as repeated-ones (Ogbolomabiri 1/11/111 meaning
# I/II/III), and some as plain arabic. The worksheet uses proper roman. All
# three forms of the SAME numeral must unify so the ward resolves. The examples
# below are the exact real ones from the Bayelsa parity abstentions.

def test_repeated_ones_matches_roman():
    # DB stores "Bassambiri 11" (repeated-ones == II); worksheet says "II".
    cands = [
        ("w1", "Bassambiri 1"),
        ("w2", "Bassambiri 11"),
        ("w3", "Bassambiri 111"),
        ("w4", "Bassambiri 1V"),
    ]
    assert match_one("Bassambiri II", cands).code == "w2"
    assert match_one("Bassambiri III", cands).code == "w3"
    assert match_one("Bassambiri I", cands).code == "w1"
    assert match_one("Bassambiri IV", cands).code == "w4"  # "1V" typo == IV


def test_roman_matches_repeated_ones_reverse():
    # DB stores roman "Ogbolomabiri 11"/"111"; worksheet "II"/"III".
    cands = [
        ("o1", "Ogbolomabiri 1"),
        ("o2", "Ogbolomabiri 11"),
        ("o3", "Ogbolomabiri 111"),
    ]
    assert match_one("Ogbolomabiri I", cands).code == "o1"
    assert match_one("Ogbolomabiri II", cands).code == "o2"
    assert match_one("Ogbolomabiri III", cands).code == "o3"


def test_nembe_arabic_roman_unify():
    # "Nembe I" (worksheet, roman) == "Nembe 1" (DB, arabic).
    cands = [("n1", "Nembe 1"), ("n2", "Nembe 2")]
    assert match_one("Nembe I", cands).code == "n1"
    assert match_one("Nembe II", cands).code == "n2"


def test_epie_mixed_forms():
    # DB "Epie 11" (repeated-ones) vs worksheet "Epie II"; sibling "Epie I"/"III"
    # are proper roman in DB — the II must not collide with them.
    cands = [
        ("e1", "Epie I"),
        ("e2", "Epie 11"),
        ("e3", "Epie III"),
    ]
    assert match_one("Epie II", cands).code == "e2"
    assert match_one("Epie I", cands).code == "e1"
    assert match_one("Epie III", cands).code == "e3"


def test_two_digit_arabic_not_treated_as_repeated_ones():
    # A genuine two-digit arabic ("Ward 10") is NOT all-ones, so it stays 10 and
    # must not collapse to a small numeral. Idempotent on both sides.
    cands = [("a", "Ward 10 Sw8"), ("b", "Ward 2 Sw8")]
    assert match_one("Ward 10 Sw8", cands).code == "a"


# ---------------------------------------------------------------------------
# multi-LGA (cross-LGA constituency) scoping
# ---------------------------------------------------------------------------

def test_resolve_constituency_lgas_spans_multiple():
    # Aba Central spans Aba South (5 wards) + Aba North (3 wards). The plural
    # resolver returns the FULL LGA set, inferred from the LGAs whose wards
    # confidently match the constituency's ward list.
    sc = ParsedConstituency(
        name="Aba Central",
        code_label="SC/03/AB",
        wards=[
            "Aba River",
            "Aba Town Hall",
            "Ekeoha",
            "Gloucester",
            "Mosque",
            "Ogbor I",
            "Ogbor II",
            "Umuola",
        ],
        ra_count=8,
        collation="Aba Town Hall Aba South LGA HQ",
    )
    districts = [
        ParsedDistrict(
            "Abia South",
            "SD/003/AB",
            ["Aba North", "Aba South", "Obingwa", "Ugwunagbo", "Ukwa East", "Ukwa West"],
        ),
    ]
    state_lgas = [
        ("abia_aba_north", "Aba North"),
        ("abia_aba_south", "Aba South"),
        ("abia_obi_ngwa", "Obi Ngwa"),
        ("abia_ugwunagbo", "Ugwunagbo"),
        ("abia_ukwa_east", "Ukwa East"),
        ("abia_ukwa_west", "Ukwa West"),
    ]
    wards_by_lga = {
        "abia_aba_south": [
            ("abia_aba_south_aba_river", "Aba River"),
            ("abia_aba_south_aba_town_hall", "Aba Town Hall"),
            ("abia_aba_south_ekeoha", "Ekeoha"),
            ("abia_aba_south_gloucester", "Gloucester"),
            ("abia_aba_south_mosque", "Mosque"),
        ],
        "abia_aba_north": [
            ("abia_aba_north_ogbor_i", "Ogbor I"),
            ("abia_aba_north_ogbor_ii", "Ogbor II"),
            ("abia_aba_north_umuola", "Umuola"),
        ],
        "abia_obi_ngwa": [("abia_obi_ngwa_ward1", "Somewhere Else")],
    }
    lga_codes = resolve_constituency_lgas(
        sc, districts, state_lgas, "abia", wards_by_lga
    )
    assert set(lga_codes) == {"abia_aba_south", "abia_aba_north"}
    # obi_ngwa contributes no matching ward, so it is NOT pulled in.
    assert "abia_obi_ngwa" not in lga_codes


def test_resolve_constituency_lgas_single_lga_still_works():
    # A same-LGA constituency resolves to exactly one LGA (no spurious expansion).
    sc = ParsedConstituency(
        name="Ohafia North",
        code_label="SC/13/AB",
        wards=["Ebem", "Amaekpu"],
        ra_count=2,
        collation="Council Hall, Ohafia LGA HQ",
    )
    districts = [
        ParsedDistrict(
            "Abia North",
            "SD/001/AB",
            ["Arochukwu", "Bende", "Isuikwuato", "Ohafia", "Umu-Nneochi"],
        ),
    ]
    state_lgas = [
        ("abia_arochukwu", "Arochukwu"),
        ("abia_bende", "Bende"),
        ("abia_isuikwuato", "Isuikwuato"),
        ("abia_ohafia", "Ohafia"),
        ("abia_umu_nneochi", "Umu-Nneochi"),
    ]
    wards_by_lga = {
        "abia_ohafia": [
            ("abia_ohafia_ebem", "Ebem"),
            ("abia_ohafia_amaekpu", "Amaekpu"),
        ],
        "abia_bende": [("abia_bende_x", "Some Bende Ward")],
    }
    lga_codes = resolve_constituency_lgas(
        sc, districts, state_lgas, "abia", wards_by_lga
    )
    assert set(lga_codes) == {"abia_ohafia"}


def test_resolve_constituency_lga_from_collation():
    # Aba Central's name names no LGA; its collation names the Aba South LGA HQ.
    sc = ParsedConstituency(
        name="Aba Central",
        code_label="SC/03/AB",
        wards=[],
        ra_count=8,
        collation="Aba Town Hall Aba South LGA HQ",
    )
    districts = [
        ParsedDistrict(
            "Abia South",
            "SD/003/AB",
            ["Aba North", "Aba South", "Obingwa", "Ugwunagbo", "Ukwa East", "Ukwa West"],
        ),
    ]
    state_lgas = [
        ("abia_aba_north", "Aba North"),
        ("abia_aba_south", "Aba South"),
        ("abia_obi_ngwa", "Obi Ngwa"),
        ("abia_ugwunagbo", "Ugwunagbo"),
        ("abia_ukwa_east", "Ukwa East"),
        ("abia_ukwa_west", "Ukwa West"),
    ]
    lga_code = resolve_constituency_lga(sc, districts, state_lgas, "abia")
    assert lga_code == "abia_aba_south"


def test_resolve_constituency_lga_from_name():
    # A constituency whose name directly carries an LGA (minus a direction suffix).
    sc = ParsedConstituency(
        name="Ohafia North",
        code_label="SC/13/AB",
        wards=[],
        ra_count=7,
        collation="Council Hall, Ohafia LGA HQ",
    )
    districts = [
        ParsedDistrict(
            "Abia North",
            "SD/001/AB",
            ["Arochukwu", "Bende", "Isuikwuato", "Ohafia", "Umu-Nneochi"],
        ),
    ]
    state_lgas = [
        ("abia_arochukwu", "Arochukwu"),
        ("abia_bende", "Bende"),
        ("abia_isuikwuato", "Isuikwuato"),
        ("abia_ohafia", "Ohafia"),
        ("abia_umu_nneochi", "Umu-Nneochi"),
    ]
    lga_code = resolve_constituency_lga(sc, districts, state_lgas, "abia")
    assert lga_code == "abia_ohafia"
