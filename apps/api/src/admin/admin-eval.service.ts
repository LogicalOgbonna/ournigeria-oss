import { Injectable } from "@nestjs/common";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

@Injectable()
export class AdminEvalService {
  private evalDir: string;
  private resultsDir: string;

  constructor() {
    const candidates = [
      join(process.cwd(), "packages", "evaluation"),
      join(process.cwd(), "..", "..", "packages", "evaluation"),
    ];
    this.evalDir = candidates.find((d) => existsSync(d)) || candidates[0];
    this.resultsDir = join(this.evalDir, "results");
  }

  getOverview() {
    const evalFiles = this.listEvalFiles();
    const summary = this.readJson(join(this.resultsDir, "_summary.json"));

    const files = evalFiles.map((filename) => {
      const source = this.readJson(join(this.evalDir, filename));
      const result = this.readJson(join(this.resultsDir, filename));
      const data = result || source;
      const questions: any[] = data?.questions ?? [];
      const totalQuestions = questions.length;
      const hasResults = questions.some((q: any) => q.answer !== undefined);

      if (hasResults) {
        const passed = questions.filter((q: any) => q.pass === true).length;
        const failed = questions.filter(
          (q: any) => q.pass === false && !q.answer?.startsWith("ERROR:"),
        ).length;
        const errors = questions.filter((q: any) =>
          q.answer?.startsWith("ERROR:"),
        ).length;
        const totalTime = questions.reduce(
          (s: number, q: any) => s + (q.response_time_ms || 0),
          0,
        );
        const byDifficulty: Record<
          string,
          { total: number; passed: number }
        > = {};
        for (const q of questions) {
          const d = q.difficulty || "unknown";
          if (!byDifficulty[d]) byDifficulty[d] = { total: 0, passed: 0 };
          byDifficulty[d].total++;
          if (q.pass) byDifficulty[d].passed++;
        }

        return {
          name: filename,
          label: data?.name || filename.replace(".json", ""),
          totalQuestions,
          hasResults: true,
          passed,
          failed,
          errors,
          passRate:
            totalQuestions > 0
              ? Math.round((passed / totalQuestions) * 1000) / 10
              : 0,
          avgResponseTimeMs:
            totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
          byDifficulty,
        };
      }

      const byDifficulty: Record<
        string,
        { total: number; passed: number }
      > = {};
      for (const q of questions) {
        const d = q.difficulty || "unknown";
        if (!byDifficulty[d]) byDifficulty[d] = { total: 0, passed: 0 };
        byDifficulty[d].total++;
      }

      return {
        name: filename,
        label: data?.name || filename.replace(".json", ""),
        totalQuestions,
        hasResults: false,
        passed: 0,
        failed: 0,
        errors: 0,
        passRate: 0,
        avgResponseTimeMs: 0,
        byDifficulty,
      };
    });

    return { hasResults: files.some((f) => f.hasResults), summary, files };
  }

  getFile(filename: string) {
    if (filename.includes("..") || filename.includes("/")) {
      throw { status: 400, message: "Invalid filename" };
    }
    const result = this.readJson(join(this.resultsDir, filename));
    if (result) return result;
    return this.readJson(join(this.evalDir, filename));
  }

  private listEvalFiles(): string[] {
    if (!existsSync(this.evalDir)) return [];
    return readdirSync(this.evalDir).filter(
      (f) => f.endsWith(".json") && f !== "package.json",
    );
  }

  private readJson(filePath: string): any | null {
    if (!existsSync(filePath)) return null;
    try {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      return null;
    }
  }
}
