import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Mock filesystem for tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_INDEX_PATH = join(__dirname, "..", "content-index.json");

import { loadIndex, saveIndex, addEntry, hasRecentContent, getUncoveredStates } from "../lib/index-manager.js";
import type { ContentIndex } from "../recipes/types.js";

describe("index-manager", () => {
  let originalIndex: string | null = null;

  beforeEach(() => {
    // Save original index if exists
    if (existsSync(TEST_INDEX_PATH)) {
      originalIndex = readFileSync(TEST_INDEX_PATH, "utf-8");
    }
  });

  afterEach(() => {
    // Restore original index
    if (originalIndex !== null) {
      writeFileSync(TEST_INDEX_PATH, originalIndex);
    } else if (existsSync(TEST_INDEX_PATH)) {
      unlinkSync(TEST_INDEX_PATH);
    }
  });

  describe("loadIndex", () => {
    it("returns empty index when file does not exist", () => {
      if (existsSync(TEST_INDEX_PATH)) unlinkSync(TEST_INDEX_PATH);
      const index = loadIndex();
      expect(index.version).toBe(1);
      expect(index.entries).toEqual([]);
    });

    it("loads valid index from disk", () => {
      const testIndex: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "budget-expose",
          params: { state: "Lagos", year: 2024 },
          generatedAt: new Date().toISOString(),
          outputFiles: ["test.md"],
          status: "draft",
        }],
      };
      writeFileSync(TEST_INDEX_PATH, JSON.stringify(testIndex));
      const loaded = loadIndex();
      expect(loaded.entries).toHaveLength(1);
      expect(loaded.entries[0].recipeId).toBe("budget-expose");
    });

    it("rebuilds from corrupt JSON", () => {
      writeFileSync(TEST_INDEX_PATH, "{ invalid json }}}");
      const index = loadIndex();
      expect(index.version).toBe(1);
      expect(Array.isArray(index.entries)).toBe(true);
    });
  });

  describe("addEntry", () => {
    it("adds entry with generated ID", () => {
      const index: ContentIndex = { version: 1, entries: [] };
      const entry = addEntry(index, {
        recipeId: "budget-expose",
        params: { state: "Lagos", year: 2024 },
        generatedAt: new Date().toISOString(),
        outputFiles: ["test.md"],
        status: "draft",
      });
      expect(entry.id).toBeDefined();
      expect(index.entries).toHaveLength(1);
      expect(index.entries[0].id).toBe(entry.id);
    });
  });

  describe("hasRecentContent", () => {
    it("returns false for empty index", () => {
      const index: ContentIndex = { version: 1, entries: [] };
      expect(hasRecentContent(index, "budget-expose", { state: "Lagos" })).toBe(false);
    });

    it("returns true for recent matching entry", () => {
      const index: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "budget-expose",
          params: { state: "Lagos", year: 2024 },
          generatedAt: new Date().toISOString(),
          outputFiles: [],
          status: "draft",
        }],
      };
      expect(hasRecentContent(index, "budget-expose", { state: "Lagos", year: 2024 })).toBe(true);
    });

    it("returns false for old entry beyond threshold", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      const index: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "budget-expose",
          params: { state: "Lagos" },
          generatedAt: oldDate.toISOString(),
          outputFiles: [],
          status: "draft",
        }],
      };
      expect(hasRecentContent(index, "budget-expose", { state: "Lagos" })).toBe(false);
    });

    it("returns false for different recipe", () => {
      const index: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "corruption-impact",
          params: { state: "Lagos" },
          generatedAt: new Date().toISOString(),
          outputFiles: [],
          status: "draft",
        }],
      };
      expect(hasRecentContent(index, "budget-expose", { state: "Lagos" })).toBe(false);
    });

    it("matches case-insensitively on state", () => {
      const index: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "budget-expose",
          params: { state: "Lagos" },
          generatedAt: new Date().toISOString(),
          outputFiles: [],
          status: "draft",
        }],
      };
      expect(hasRecentContent(index, "budget-expose", { state: "lagos" })).toBe(true);
    });
  });

  describe("getUncoveredStates", () => {
    it("returns all states for empty index", () => {
      const index: ContentIndex = { version: 1, entries: [] };
      const allStates = ["Lagos", "Kano", "Rivers"];
      const uncovered = getUncoveredStates(index, "budget-expose", allStates);
      expect(uncovered).toEqual(allStates);
    });

    it("excludes recently covered states", () => {
      const index: ContentIndex = {
        version: 1,
        entries: [{
          id: "test-1",
          recipeId: "budget-expose",
          params: { state: "Lagos" },
          generatedAt: new Date().toISOString(),
          outputFiles: [],
          status: "draft",
        }],
      };
      const allStates = ["Lagos", "Kano", "Rivers"];
      const uncovered = getUncoveredStates(index, "budget-expose", allStates);
      expect(uncovered).toEqual(["Kano", "Rivers"]);
    });
  });
});
