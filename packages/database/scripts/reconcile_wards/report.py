"""Per-state proposal report + residual worklist.

``build_report`` is pure aggregation over the matched pipeline results;
``write_report`` renders a human-readable Markdown report and a machine-readable
residual JSON into ``reconcile_wards/reports/``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date

from .paths import SCRIPTS_DIR

REPORTS_DIR = SCRIPTS_DIR / "reconcile_wards" / "reports"


@dataclass
class WardResult:
    """One parsed ward name and its resolution against DB ward candidates."""

    parsed_name: str
    ward_code: str | None
    score: float
    needs_review: bool
    candidate: str | None = None


@dataclass
class ConstituencyResult:
    """One parsed SC constituency, resolved to a DB constituency + LGA + wards."""

    constituency_code: str | None
    constituency_name: str
    constituency_type: str
    lga_code: str | None
    ra_count: int | None
    wards: list[WardResult] = field(default_factory=list)


@dataclass
class Report:
    state: str
    total_constituencies: int
    total_wards: int
    matched_count: int
    unmatched_wards: list[dict]
    unmatched_constituencies: list[dict]
    conflicts: list[dict]
    count_mismatches: list[dict]
    residual: list[dict]


def build_report(
    state: str,
    results: list[ConstituencyResult],
    existing_maps: list[tuple[str, str, str]],
) -> Report:
    """Aggregate pipeline results into a :class:`Report`.

    ``existing_maps`` = ``[(constituency_code, ward_code, type), ...]`` already in
    the DB/seed; used to flag conflicts (a proposed (tier, ward) already mapped to
    a *different* constituency).
    """
    # (type, ward_code) -> existing constituency_code
    existing_index: dict[tuple[str, str], str] = {
        (typ, wcode): ccode for ccode, wcode, typ in existing_maps
    }

    total_wards = 0
    matched_count = 0
    unmatched_wards: list[dict] = []
    unmatched_constituencies: list[dict] = []
    conflicts: list[dict] = []
    count_mismatches: list[dict] = []
    residual: list[dict] = []

    for cr in results:
        # A constituency is "unmatched" when we could not resolve its LGA (so no
        # ward candidates were scoped) or its DB code is missing.
        if cr.lga_code is None or cr.constituency_code is None:
            unmatched_constituencies.append(
                {
                    "constituency_code": cr.constituency_code,
                    "constituency_name": cr.constituency_name,
                    "reason": "unresolved_lga"
                    if cr.lga_code is None
                    else "unresolved_constituency",
                }
            )

        matched_here = 0
        for wr in cr.wards:
            total_wards += 1
            if wr.ward_code is not None and not wr.needs_review:
                matched_count += 1
                matched_here += 1
                # conflict: this ward already mapped to a different constituency
                # in the same tier.
                key = (cr.constituency_type, wr.ward_code)
                existing_ccode = existing_index.get(key)
                if existing_ccode and existing_ccode != cr.constituency_code:
                    conflicts.append(
                        {
                            "tier": cr.constituency_type,
                            "ward_code": wr.ward_code,
                            "ward_name": wr.parsed_name,
                            "proposed_constituency": cr.constituency_code,
                            "existing_constituency": existing_ccode,
                        }
                    )
            else:
                entry = {
                    "constituency_code": cr.constituency_code,
                    "constituency_name": cr.constituency_name,
                    "lga_code": cr.lga_code,
                    "ward": wr.parsed_name,
                    "best_candidate": wr.candidate,
                    "score": round(wr.score, 3),
                }
                unmatched_wards.append(entry)
                residual.append(entry)

        # count-check: workbook-declared RA count vs matched wards.
        if cr.ra_count is not None and matched_here != cr.ra_count:
            count_mismatches.append(
                {
                    "constituency_code": cr.constituency_code,
                    "constituency_name": cr.constituency_name,
                    "ra_count": cr.ra_count,
                    "matched": matched_here,
                    "parsed": len(cr.wards),
                }
            )

    return Report(
        state=state,
        total_constituencies=len(results),
        total_wards=total_wards,
        matched_count=matched_count,
        unmatched_wards=unmatched_wards,
        unmatched_constituencies=unmatched_constituencies,
        conflicts=conflicts,
        count_mismatches=count_mismatches,
        residual=residual,
    )


def _pct(n: int, d: int) -> str:
    return f"{(100.0 * n / d):.1f}%" if d else "n/a"


def render_markdown(report: Report, results: list[ConstituencyResult]) -> str:
    r = report
    lines: list[str] = []
    lines.append(f"# Ward reconciliation report — {r.state}")
    lines.append("")
    lines.append(f"- Generated: {date.today().isoformat()}")
    lines.append(f"- Constituencies parsed: {r.total_constituencies}")
    lines.append(
        f"- Wards matched: {r.matched_count} / {r.total_wards} "
        f"({_pct(r.matched_count, r.total_wards)})"
    )
    lines.append(f"- Unmatched wards: {len(r.unmatched_wards)}")
    lines.append(f"- Unmatched constituencies: {len(r.unmatched_constituencies)}")
    lines.append(f"- Conflicts: {len(r.conflicts)}")
    lines.append(f"- Count-check mismatches: {len(r.count_mismatches)}")
    lines.append("")

    lines.append("## Per-constituency")
    lines.append("")
    lines.append("| Constituency | LGA | matched/RA | parsed |")
    lines.append("|---|---|---|---|")
    for cr in results:
        matched = sum(
            1 for w in cr.wards if w.ward_code is not None and not w.needs_review
        )
        ra = "?" if cr.ra_count is None else cr.ra_count
        lines.append(
            f"| {cr.constituency_name} ({cr.constituency_code}) "
            f"| {cr.lga_code or '—'} | {matched}/{ra} | {len(cr.wards)} |"
        )
    lines.append("")

    if r.count_mismatches:
        lines.append("## Count-check mismatches")
        lines.append("")
        for cm in r.count_mismatches:
            lines.append(
                f"- {cm['constituency_name']} ({cm['constituency_code']}): "
                f"matched {cm['matched']} vs RA {cm['ra_count']} "
                f"(parsed {cm['parsed']})"
            )
        lines.append("")

    if r.unmatched_constituencies:
        lines.append("## Unmatched constituencies")
        lines.append("")
        for c in r.unmatched_constituencies:
            lines.append(
                f"- {c['constituency_name']} ({c['constituency_code']}) — {c['reason']}"
            )
        lines.append("")

    if r.conflicts:
        lines.append("## Conflicts (ward already mapped elsewhere in tier)")
        lines.append("")
        for c in r.conflicts:
            lines.append(
                f"- [{c['tier']}] ward {c['ward_code']} ({c['ward_name']}): "
                f"proposed {c['proposed_constituency']} "
                f"vs existing {c['existing_constituency']}"
            )
        lines.append("")

    if r.residual:
        lines.append("## Residual worklist (unmatched wards)")
        lines.append("")
        for w in r.residual:
            lines.append(
                f"- {w['constituency_name']} / {w['lga_code']}: "
                f'"{w["ward"]}" — best "{w["best_candidate"]}" ({w["score"]})'
            )
        lines.append("")

    return "\n".join(lines)


def write_report(
    report: Report, results: list[ConstituencyResult]
) -> tuple:
    """Write ``<STATE>.md`` + ``<STATE>-residual.json`` into REPORTS_DIR."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    md_path = REPORTS_DIR / f"{report.state}.md"
    json_path = REPORTS_DIR / f"{report.state}-residual.json"
    md_path.write_text(render_markdown(report, results))
    json_path.write_text(
        json.dumps(
            {
                "state": report.state,
                "residual": report.residual,
                "conflicts": report.conflicts,
                "count_mismatches": report.count_mismatches,
                "unmatched_constituencies": report.unmatched_constituencies,
            },
            indent=2,
        )
    )
    return md_path, json_path
