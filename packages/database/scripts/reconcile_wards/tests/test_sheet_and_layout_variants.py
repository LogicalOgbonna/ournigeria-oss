"""INEC's workbooks are inconsistent, and each inconsistency cost us a state.

Every case here is a real workbook shape that produced either a crash or a
silent zero-ward parse before it was handled. They are pinned because the cost
of regressing one is an entire state quietly reporting no data.
"""

from __future__ import annotations

import pytest

from reconcile_wards.cli import _sheet
from reconcile_wards.fetch import _name_variants
from reconcile_wards.parse import _ANY_COMP_RE, _LGA_COMP_RE, _RA_COMP_RE, parse_sc_rows


class FakeSheet:
    def __init__(self, title):
        self.title = title


class FakeBook:
    """Minimal stand-in for an openpyxl workbook: names in, sheet out."""

    def __init__(self, *names):
        self.sheetnames = list(names)

    def __getitem__(self, name):
        assert name in self.sheetnames
        return FakeSheet(name)


# --- worksheet naming ------------------------------------------------------


@pytest.mark.parametrize(
    "workbook,names,expected",
    [
        ("ABIA", ["ABIA SD", "ABIA FC", "ABIA SC"], "ABIA SC"),          # state-prefixed
        ("BAYELSA", ["SD", "FC", "SC"], "SC"),                            # bare
        ("ONDO", ["SD", "FC", "SC ONDO"], "SC ONDO"),                     # state-SUFFIXED
        ("BENUE", ["SENATORIAL", "FEDERAL CONSTITUENCIES", "STATE CONSTITUENCY"],
         "STATE CONSTITUENCY"),                                           # full words, plural FC
        ("KWARA", ["SENATORIAL", "FEDERAL CONSTITUENCY", "STATE CONSTITUENCY"],
         "STATE CONSTITUENCY"),                                           # full words, singular
    ],
)
def test_sc_sheet_resolves_across_naming_variants(workbook, names, expected):
    assert _sheet(FakeBook(*names), workbook, "SC").title == expected


def test_fc_does_not_match_an_fct_sheet():
    """A substring match would let `FC` grab a sheet named `FCT`."""
    with pytest.raises(KeyError):
        _sheet(FakeBook("SD", "FCT SUMMARY"), "KANO", "FC")


def test_sc_does_not_match_a_sheet_merely_ending_in_those_letters():
    with pytest.raises(KeyError):
        _sheet(FakeBook("SD", "FC", "PUS/WSC"), "KANO", "SC")


def test_missing_sheet_raises_with_the_sheet_list():
    with pytest.raises(KeyError, match="FCT"):
        _sheet(FakeBook("SD", "FC"), "FCT", "SC")


# --- workbook filename -----------------------------------------------------


def test_imo_title_case_filename_is_tried():
    """Every state uploads SHOUTED except Imo, which is `Imo.xlsx`."""
    assert "Imo" in _name_variants("IMO")


def test_variants_are_deduplicated_and_start_with_the_given_name():
    variants = _name_variants("ABIA")
    assert variants[0] == "ABIA"
    assert len(variants) == len(set(variants))


# --- composition header ----------------------------------------------------


@pytest.mark.parametrize(
    "header,ra,any_comp",
    [
        ("RA COMPOSITION", True, True),    # most states
        ("COMPOSITION", True, True),       # GOMBE / KOGI
        ("LGA COMPOSITION", False, True),  # BAUCHI's mislabelled SC column
        ("NO. OF RAs", False, False),
        ("NAME OF STATE CONSTITUENCY & CODE", False, False),
    ],
)
def test_composition_header_matchers(header, ra, any_comp):
    assert bool(_RA_COMP_RE.search(header)) is ra
    assert bool(_ANY_COMP_RE.search(header)) is any_comp
    # The SD/FC matcher must stay narrow whatever the SC ones accept.
    assert bool(_LGA_COMP_RE.search(header)) is (header == "LGA COMPOSITION")


# --- sheet layouts ---------------------------------------------------------


def test_gombe_layout_bare_header_and_shifted_column():
    """GOMBE writes a bare "COMPOSITION" AND carries an extra empty column.

    Missing the header pushed the parser onto fixed indices, which then read the
    empty column — 0 wards, no error. Gombe is the worst-covered state in the
    country, so this silently hid its entire ward set.
    """
    rows = [
        [None, None, "GOMBE STATE", None, None, None, None, None],
        [None, None, "STATE CONSTITUENCIES", None, None, None, None, None],
        ["S/N", "NAME OF STATE CONSTITUENCY & CODE", None, "COMPOSITION",
         "NO. OF RAs", "NO. OF PUs", "COLLATION CENTRE", None],
        ["1", "Akko West\n SC/370/GM", None, "Kashere, Pindiga, Tumu", "3", "100",
         "GSS Pindiga", None],
    ]
    parsed = parse_sc_rows(rows)
    assert len(parsed) == 1
    assert parsed[0].name == "Akko West"
    assert parsed[0].wards == ["Kashere", "Pindiga", "Tumu"]
    assert parsed[0].ra_count == 3


def test_bauchi_layout_ward_column_mislabelled_as_lga_composition():
    """BAUCHI heads its SC ward column "LGA COMPOSITION".

    The contents are registration areas — Pali's four are one LGA's wards, not
    four LGAs — so on an SC sheet that column is the ward list regardless of the
    label.
    """
    rows = [
        ["BAUCHI STATE", None, None, None, None, None, None],
        ["S/N", "NAME OF STATE CONSTITUENCY & CODE", None, "LGA COMPOSITION",
         "NO OF RAs", "NO OF PUs", "COLLATION"],
        ["1", "Pali \n\nSC/106/BA", None, "Alkaleri, Gar, Gwaram, Pali", "4", "119",
         "INEC Office LGA Council, Alkaleri"],
    ]
    parsed = parse_sc_rows(rows)
    assert len(parsed) == 1
    assert parsed[0].wards == ["Alkaleri", "Gar", "Gwaram", "Pali"]


def test_standard_layout_still_parses():
    """ABIA-style: composition at index 2, code embedded in the name cell."""
    rows = [
        ["S/N", "NAME OF STATE CONSTITUENCY & CODE", "RA COMPOSITION", "NO OF RAs",
         "NO OF PUs", "NAME OF COLLATION CENTRE"],
        ["1", "Aba North SC/01/AB", "Ariaria Market, Eziama", "2", "403", "Council Hall"],
    ]
    parsed = parse_sc_rows(rows)
    assert parsed[0].name == "Aba North"
    assert parsed[0].code_label == "SC/01/AB"
    assert parsed[0].wards == ["Ariaria Market", "Eziama"]
