from reconcile_wards.report import build_report, ConstituencyResult, WardResult


def _res(
    code,
    name,
    lga_code,
    ward_results,
    ra_count,
):
    return ConstituencyResult(
        constituency_code=code,
        constituency_name=name,
        constituency_type="state",
        lga_code=lga_code,
        ra_count=ra_count,
        wards=ward_results,
    )


def test_build_report_counts_and_partition():
    results = [
        _res(
            "state_x_a",
            "A",
            "lga_a",
            [
                WardResult("Ward 1", "w1", 1.0, False),
                WardResult("Ward 2", "w2", 0.95, False),
                WardResult("Ward 3", None, 0.4, True),  # unmatched
            ],
            ra_count=3,
        ),
        _res(
            "state_x_b",
            "B",
            "lga_b",
            [
                WardResult("Ward 4", "w4", 1.0, False),
            ],
            ra_count=1,
        ),
    ]
    rep = build_report("XSTATE", results, existing_maps=[])
    assert rep.total_wards == 4
    assert rep.matched_count == 3
    assert len(rep.unmatched_wards) == 1
    # matched + unmatched partitions the total
    assert rep.matched_count + len(rep.unmatched_wards) == rep.total_wards
    # residual carries the unmatched ward for the human worklist
    assert any(r["ward"] == "Ward 3" for r in rep.residual)


def test_build_report_flags_count_mismatch():
    results = [
        _res(
            "state_x_a",
            "A",
            "lga_a",
            [WardResult("Ward 1", "w1", 1.0, False)],
            ra_count=3,  # workbook says 3 RAs but only 1 parsed/matched
        ),
    ]
    rep = build_report("XSTATE", results, existing_maps=[])
    assert any(
        cm["constituency_code"] == "state_x_a" for cm in rep.count_mismatches
    )


def test_build_report_flags_unmatched_constituency():
    results = [_res("state_x_a", "A", None, [], ra_count=None)]  # no LGA resolved
    rep = build_report("XSTATE", results, existing_maps=[])
    assert "state_x_a" in {c["constituency_code"] for c in rep.unmatched_constituencies}


def test_build_report_detects_conflict():
    # Ward w1 already mapped to a DIFFERENT state constituency in the DB.
    existing = [("state_x_other", "w1", "state")]
    results = [
        _res(
            "state_x_a",
            "A",
            "lga_a",
            [WardResult("Ward 1", "w1", 1.0, False)],
            ra_count=1,
        ),
    ]
    rep = build_report("XSTATE", results, existing_maps=existing)
    assert len(rep.conflicts) == 1
    conflict = rep.conflicts[0]
    assert conflict["ward_code"] == "w1"
    assert conflict["proposed_constituency"] == "state_x_a"
    assert conflict["existing_constituency"] == "state_x_other"
