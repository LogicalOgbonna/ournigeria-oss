from reconcile_wards.apply import (
    apply_additions,
    apply_senatorial_additions,
    emit_corrections_migration,
)


def _existing():
    return [
        {
            "constituency_code": "state_x_a",
            "ward_code": "w1",
            "source": "inec_exact_lga",
            "source_url": "old",
            "source_date": "2019-02",
            "confidence": "medium",
        },
        {
            "constituency_code": "state_x_a",
            "ward_code": "w2",
            "source": "inec_exact_lga",
            "source_url": "old",
            "source_date": "2019-02",
            "confidence": "medium",
        },
    ]


def test_apply_additions_adds_new_pairs():
    existing = _existing()
    new = [("state_x_a", "w3", "high"), ("state_x_b", "w4", "high")]
    merged = apply_additions(
        existing, new, source="inec_x_sc_worksheet", source_url="http://x"
    )
    pairs = {(r["constituency_code"], r["ward_code"]) for r in merged}
    assert ("state_x_a", "w3") in pairs
    assert ("state_x_b", "w4") in pairs


def test_apply_additions_no_duplicate_existing():
    existing = _existing()
    new = [("state_x_a", "w1", "high")]  # already present
    merged = apply_additions(
        existing, new, source="inec_x_sc_worksheet", source_url="http://x"
    )
    w1 = [r for r in merged if r["ward_code"] == "w1"]
    assert len(w1) == 1
    # existing row untouched (source not overwritten)
    assert w1[0]["source"] == "inec_exact_lga"


def test_apply_additions_leaves_unrelated_untouched():
    existing = _existing()
    new = [("state_x_a", "w3", "high")]
    merged = apply_additions(
        existing, new, source="inec_x_sc_worksheet", source_url="http://x"
    )
    w2 = [r for r in merged if r["ward_code"] == "w2"][0]
    assert w2 == existing[1]  # unchanged


def test_apply_additions_new_row_shape():
    merged = apply_additions(
        [], [("state_x_a", "w3", "high")], source="inec_x_sc_worksheet", source_url="http://x"
    )
    row = merged[0]
    assert set(row.keys()) == {
        "constituency_code",
        "ward_code",
        "source",
        "source_url",
        "source_date",
        "confidence",
    }
    assert row["source"] == "inec_x_sc_worksheet"
    assert row["source_url"] == "http://x"
    assert row["confidence"] == "high"


def test_apply_senatorial_additions():
    existing = [
        {
            "senatorial_district_code": "sen_x_north",
            "lga_code": "lga_a",
            "source": "geojson",
            "source_url": None,
            "source_date": None,
            "confidence": "high",
        }
    ]
    new = [("sen_x_north", "lga_b", "high")]
    merged = apply_senatorial_additions(
        existing, new, source="inec_x_sd_worksheet", source_url="http://x"
    )
    pairs = {(r["senatorial_district_code"], r["lga_code"]) for r in merged}
    assert ("sen_x_north", "lga_b") in pairs
    assert ("sen_x_north", "lga_a") in pairs  # existing kept
    assert len([r for r in merged if r["lga_code"] == "lga_a"]) == 1


def test_emit_corrections_migration_only_for_conflicts():
    assert emit_corrections_migration([]) is None
    sql = emit_corrections_migration(
        [
            {
                "tier": "state",
                "ward_code": "w1",
                "existing_constituency": "state_x_other",
                "proposed_constituency": "state_x_a",
            }
        ]
    )
    assert sql is not None
    assert "DELETE" in sql.upper()
    assert "w1" in sql
    assert "state_x_other" in sql


def test_emit_corrections_skips_unresolved_proposed():
    """A conflict whose proposed constituency did not resolve to a code
    (proposed_constituency is None) must NOT emit a DELETE — deleting the
    existing mapping would orphan the ward with nothing to replace it."""
    conflicts = [
        {
            "tier": "state",
            "ward_code": "w_orphan",
            "existing_constituency": "state_kano_shanono",
            "proposed_constituency": None,
        },
        {
            "tier": "state",
            "ward_code": "w_real",
            "existing_constituency": "state_x_other",
            "proposed_constituency": "state_x_a",
        },
    ]
    sql = emit_corrections_migration(conflicts)
    assert sql is not None
    # the resolvable correction is emitted
    assert "w_real" in sql
    assert "state_x_other" in sql
    # the unresolved one is NOT deleted
    assert "w_orphan" not in sql
    assert "state_kano_shanono" not in sql


def test_emit_corrections_all_unresolved_returns_none():
    """When every conflict is unresolvable, there is nothing safe to delete."""
    conflicts = [
        {
            "tier": "state",
            "ward_code": "w_orphan",
            "existing_constituency": "state_kano_shanono",
            "proposed_constituency": None,
        }
    ]
    assert emit_corrections_migration(conflicts) is None
