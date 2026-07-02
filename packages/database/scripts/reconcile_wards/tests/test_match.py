from reconcile_wards.match import match_one, resolve_constituency_lga
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
