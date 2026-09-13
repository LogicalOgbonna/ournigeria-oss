import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import {
  createSchema,
  dateEncodingError,
  gateSchema,
  parseOrThrow,
  patchSchema,
} from "../admin-elections.schemas";

const base = { office: "presidential", year: 2027 };

describe("admin elections schemas", () => {
  it("accepts a minimal nationwide event and applies defaults", () => {
    const v = parseOrThrow(createSchema, base);
    expect(v).toMatchObject({ round: "general", datePrecision: "year", excludedStates: [] });
  });

  it("rejects the 'other' office (D10.6) with a named field error", () => {
    expect(() => parseOrThrow(createSchema, { ...base, office: "other" })).toThrow(BadRequestException);
    expect(() => parseOrThrow(createSchema, { ...base, office: "other" })).toThrow(/^office:/);
  });

  it("rejects an unknown round", () => {
    expect(() => parseOrThrow(createSchema, { ...base, round: "second-leg" })).toThrow(/^round:/);
  });

  it("date encoding: year precision must not carry a date", () => {
    expect(() => parseOrThrow(createSchema, { ...base, electionDate: "2027-01-16" })).toThrow(/^electionDate:/);
  });

  it("date encoding: month precision must store day 01", () => {
    expect(() =>
      parseOrThrow(createSchema, { ...base, datePrecision: "month", electionDate: "2027-01-16" }),
    ).toThrow(/first of the month/);
    const ok = parseOrThrow(createSchema, { ...base, datePrecision: "month", electionDate: "2027-01-01" });
    expect(ok.electionDate).toBe("2027-01-01");
  });

  it("date encoding: day precision requires a full date", () => {
    expect(() => parseOrThrow(createSchema, { ...base, datePrecision: "day" })).toThrow(/requires electionDate/);
    const ok = parseOrThrow(createSchema, { ...base, datePrecision: "day", electionDate: "2027-01-16" });
    expect(ok.electionDate).toBe("2027-01-16");
  });

  it("dateEncodingError has no year-equality clause (E1.2: cycle year != poll year)", () => {
    // A Dec 2026 event postponed into Jan 2027 keeps year 2026 — the date's
    // calendar year may legally differ from the cycle year.
    expect(dateEncodingError("day", "2027-01-16")).toBeNull();
  });

  it("patch strips published and status (they move only through verbs)", () => {
    const v = parseOrThrow(patchSchema, { label: "Osun Governorship", published: true, status: "concluded" });
    expect(v).toEqual({ label: "Osun Governorship" });
  });

  it("patch strips the identity fields office/year/round/slug (E1.2)", () => {
    const v = parseOrThrow(patchSchema, { office: "gubernatorial", year: 2031, round: "rerun", slug: "x", label: "l" });
    expect(v).toEqual({ label: "l" });
  });

  it("excludedStates must be unique", () => {
    expect(() => parseOrThrow(createSchema, { ...base, excludedStates: ["osun", "OSUN"] })).toThrow(/unique/);
  });

  it("gate body is a bare boolean", () => {
    expect(parseOrThrow(gateSchema, { enabled: false })).toEqual({ enabled: false });
    expect(() => parseOrThrow(gateSchema, { enabled: "false" })).toThrow(/^enabled:/);
  });

  it("sourceUrl pins the http(s) scheme", () => {
    expect(() => parseOrThrow(createSchema, { ...base, sourceUrl: "javascript:alert(1)" })).toThrow(/^sourceUrl:/);
  });
});
