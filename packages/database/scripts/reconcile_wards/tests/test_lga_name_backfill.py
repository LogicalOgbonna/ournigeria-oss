"""The name-derived whole-LGA backfill must be strict.

Every case here is drawn from a real row in the seed. The refusal tests matter
more than the mapping tests: a wrong assignment tells a citizen the wrong person
represents them, so the pass has to decline anything it cannot prove.
"""

from __future__ import annotations

import lga_name_backfill as bf


def lga(code, name, state):
    return {"code": code, "name": name, "state_code": state}


def sc(code, name, state):
    return {"code": code, "name": name, "type": "state", "state_code": state}


def ward(code, lga_code):
    return {"code": code, "name": code, "lga_code": lga_code}


def test_exact_name_match_maps_every_ward():
    plan = bf.plan_backfill(
        [sc("state_kano_wudil", "Wudil", "kano")],
        [lga("kano_wudil", "Wudil", "kano")],
        [ward("kano_wudil_w1", "kano_wudil"), ward("kano_wudil_w2", "kano_wudil")],
        [],
    )
    assert plan.additions == [
        ("state_kano_wudil", "kano_wudil_w1", "medium"),
        ("state_kano_wudil", "kano_wudil_w2", "medium"),
    ]
    assert plan.mapped_lgas[0]["rule"] == "exact"


def test_merged_seat_maps_both_lgas():
    plan = bf.plan_backfill(
        [sc("state_oyo_saki_east_and_atisbo", "Saki East/Atisbo", "oyo")],
        [lga("oyo_saki_east", "Saki East", "oyo"), lga("oyo_atisbo", "Atisbo", "oyo")],
        [ward("oyo_saki_east_w1", "oyo_saki_east"), ward("oyo_atisbo_w1", "oyo_atisbo")],
        [],
    )
    assert {a[1] for a in plan.additions} == {"oyo_saki_east_w1", "oyo_atisbo_w1"}
    assert all(a[0] == "state_oyo_saki_east_and_atisbo" for a in plan.additions)


def test_merged_seat_borrows_the_shared_prefix():
    """`Ibarapa Central/North` means Ibarapa Central + Ibarapa North, not `North`."""
    plan = bf.plan_backfill(
        [sc("state_oyo_ibarapa", "Ibarapa Central/North", "oyo")],
        [
            lga("oyo_ibarapa_central", "Ibarapa Central", "oyo"),
            lga("oyo_ibarapa_north", "Ibarapa North", "oyo"),
        ],
        [ward("oyo_ic_w1", "oyo_ibarapa_central"), ward("oyo_in_w1", "oyo_ibarapa_north")],
        [],
    )
    assert {a[1] for a in plan.additions} == {"oyo_ic_w1", "oyo_in_w1"}
    assert plan.mapped_lgas[0]["rule"] == "merged_prefix"


def test_bare_part_is_tried_before_the_borrowed_prefix():
    """`Saki East/Atisbo` must read Atisbo as itself, not as `Saki Atisbo`."""
    assert bf._merged_parts("Saki East/Atisbo") == [("Saki East",), ("Atisbo", "Saki Atisbo")]
    assert bf._merged_parts("Ibarapa Central/North") == [
        ("Ibarapa Central",),
        ("North", "Ibarapa North"),
    ]


def test_a_seat_naming_the_same_lga_twice_is_refused():
    """Guards a degenerate `X/X` name from double-claiming one LGA."""
    plan = bf.plan_backfill(
        [sc("state_x_dup", "Alpha/Alpha", "x")],
        [lga("x_alpha", "Alpha", "x")],
        [ward("x_alpha_w1", "x_alpha")],
        [],
    )
    assert plan.additions == []


# --- refusals -------------------------------------------------------------


def test_refuses_lga_split_into_numbered_seats():
    """Ikom I / Ikom II. Only INEC knows which ward is in which."""
    plan = bf.plan_backfill(
        [
            sc("state_cross_river_ikom_i", "Ikom I", "cross_river"),
            sc("state_cross_river_ikom_ii", "Ikom II", "cross_river"),
        ],
        [lga("cross_river_ikom", "Ikom", "cross_river")],
        [ward("cross_river_ikom_abanyum", "cross_river_ikom")],
        [],
    )
    assert plan.additions == []
    assert plan.refused[0]["reason"] == "lga_split_into_numbered_seats"


def test_refuses_arabic_numbered_seats_too():
    plan = bf.plan_backfill(
        [sc("a", "Bama 1", "borno"), sc("b", "Bama 2", "borno")],
        [lga("borno_bama", "Bama", "borno")],
        [ward("borno_bama_w1", "borno_bama")],
        [],
    )
    assert plan.additions == []
    assert plan.refused[0]["reason"] == "lga_split_into_numbered_seats"


def test_refuses_lga_claimed_by_two_seats():
    """Oyo carries both `Iwajowa` and `Kajola/Iwajowa` — genuinely ambiguous."""
    plan = bf.plan_backfill(
        [
            sc("state_oyo_iwajowa", "Iwajowa", "oyo"),
            sc("state_oyo_kajola", "Kajola/Iwajowa", "oyo"),
        ],
        [lga("oyo_iwajowa", "Iwajowa", "oyo"), lga("oyo_kajola", "Kajola", "oyo")],
        [ward("oyo_iwajowa_w1", "oyo_iwajowa"), ward("oyo_kajola_w1", "oyo_kajola")],
        [],
    )
    # Iwajowa is refused...
    refusal = next(r for r in plan.refused if r["lga_code"] == "oyo_iwajowa")
    assert refusal["reason"] == "multiple_seats_claim_this_lga"
    assert "oyo_iwajowa_w1" not in {a[1] for a in plan.additions}
    # ...but Kajola is unambiguous either way and still maps.
    assert ("state_oyo_kajola", "oyo_kajola_w1", "medium") in plan.additions


def test_refuses_when_a_ward_already_belongs_to_another_seat():
    plan = bf.plan_backfill(
        [sc("state_x_alpha", "Alpha", "x"), sc("state_x_other", "Other", "x")],
        [lga("x_alpha", "Alpha", "x")],
        [ward("x_alpha_w1", "x_alpha"), ward("x_alpha_w2", "x_alpha")],
        [{"constituency_code": "state_x_other", "ward_code": "x_alpha_w1"}],
    )
    assert plan.additions == []
    assert plan.refused[0]["reason"] == "wards_already_owned_by_another_seat"


def test_never_re_adds_a_ward_already_mapped_to_the_same_seat():
    plan = bf.plan_backfill(
        [sc("state_kano_wudil", "Wudil", "kano")],
        [lga("kano_wudil", "Wudil", "kano")],
        [ward("kano_wudil_w1", "kano_wudil"), ward("kano_wudil_w2", "kano_wudil")],
        [{"constituency_code": "state_kano_wudil", "ward_code": "kano_wudil_w1"}],
    )
    assert plan.additions == [("state_kano_wudil", "kano_wudil_w2", "medium")]


def test_federal_and_senatorial_seats_are_ignored():
    plan = bf.plan_backfill(
        [
            {"code": "fed_x_alpha", "name": "Alpha", "type": "federal", "state_code": "x"},
            {"code": "sen_x_alpha", "name": "Alpha", "type": "senatorial", "state_code": "x"},
        ],
        [lga("x_alpha", "Alpha", "x")],
        [ward("x_alpha_w1", "x_alpha")],
        [],
    )
    assert plan.additions == []


def test_a_federal_mapping_does_not_block_the_state_backfill():
    """Ward already in a federal seat is still free for its state seat."""
    plan = bf.plan_backfill(
        [
            sc("state_x_alpha", "Alpha", "x"),
            {"code": "fed_x_big", "name": "Big", "type": "federal", "state_code": "x"},
        ],
        [lga("x_alpha", "Alpha", "x")],
        [ward("x_alpha_w1", "x_alpha")],
        [{"constituency_code": "fed_x_big", "ward_code": "x_alpha_w1"}],
    )
    assert plan.additions == [("state_x_alpha", "x_alpha_w1", "medium")]


def test_name_matching_stays_strict_on_spelling_drift():
    """LGA `Atakunmosa East` vs seat `Atakumosa East/West` — one letter apart.

    Must refuse. Fuzzy resolution is a separate, human-gated pass.
    """
    plan = bf.plan_backfill(
        [sc("state_osun_atak", "Atakumosa East/West", "osun")],
        [
            lga("osun_atakunmosa_east", "Atakunmosa East", "osun"),
            lga("osun_atakunmosa_west", "Atakunmosa West", "osun"),
        ],
        [ward("osun_ae_w1", "osun_atakunmosa_east")],
        [],
    )
    assert plan.additions == []


def test_hyphen_and_case_differences_are_tolerated():
    plan = bf.plan_backfill(
        [sc("state_kebbi_danko", "danko wasagu", "kebbi")],
        [lga("kebbi_danko_wasagu", "Danko-Wasagu", "kebbi")],
        [ward("kebbi_dw_w1", "kebbi_danko_wasagu")],
        [],
    )
    assert plan.additions == [("state_kebbi_danko", "kebbi_dw_w1", "medium")]


def test_malformed_seat_name_claims_nothing():
    """Ogun's truncated `Ijebu North II (ago-Iwoye/Oru/Awa` must not resolve."""
    plan = bf.plan_backfill(
        [sc("state_ogun_bad", "Ijebu North II (ago-Iwoye/Oru/Awa", "ogun")],
        [lga("ogun_ijebu_north", "Ijebu North", "ogun")],
        [ward("ogun_ijn_w1", "ogun_ijebu_north")],
        [],
    )
    assert plan.additions == []
