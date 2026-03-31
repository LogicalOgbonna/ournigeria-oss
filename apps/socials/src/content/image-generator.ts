import { Injectable, Logger } from "@nestjs/common";
import { Neo4jService } from "../platforms/neo4j.service.js";

export interface FaacImageResult {
  buffer: Buffer;
  altText: string;
}

interface FaacBreakdown {
  grossStatutory: number;
  deduction: number;
  vat: number;
  emtl: number;
  [key: string]: number;
}

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);

  constructor(private readonly neo4j: Neo4jService) {}

  /**
   * Generate a FAAC allocation infographic for a given LGA.
   * Returns null if data is missing or image generation fails.
   */
  async generateFaacImage(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
  ): Promise<FaacImageResult | null> {
    try {
      // 1. Get structured FAAC data from Neo4j
      const faacData = await this.queryFaacData(
        lgaName,
        stateName,
        month,
        year,
      );
      if (!faacData) {
        this.logger.warn(
          `No FAAC data found for ${lgaName}, ${stateName} ${month} ${year}`,
        );
        return null;
      }

      // 2. Try to get breakdown from pgvector chunk text
      let breakdown: FaacBreakdown | undefined;
      try {
        breakdown = await this.parseBreakdownFromChunks(
          lgaName,
          stateName,
          month,
          year,
        );
      } catch (error) {
        this.logger.warn(
          `Breakdown parse failed for ${lgaName}: ${error instanceof Error ? error.message : error}`,
        );
      }

      // 3. Validate breakdown reconciliation (within 5% of total)
      if (breakdown) {
        const breakdownTotal =
          breakdown.grossStatutory -
          breakdown.deduction +
          breakdown.vat +
          breakdown.emtl;
        const tolerance = faacData.totalAllocation * 0.05;
        if (Math.abs(breakdownTotal - faacData.totalAllocation) > tolerance) {
          this.logger.warn(
            `Breakdown doesn't reconcile: sum=${breakdownTotal}, total=${faacData.totalAllocation}. Using total-only.`,
          );
          breakdown = undefined;
        }
      }

      // 4. Render the image via dynamic import (ESM bridge)
      const { renderFaacAllocationImage } = await import("@ournigeria/content");
      const buffer = await renderFaacAllocationImage({
        lgaName,
        stateName,
        month,
        year,
        totalAllocation: faacData.totalAllocation,
        breakdown,
      });

      // 5. Generate alt text
      const altText = this.generateAltText(
        lgaName,
        stateName,
        month,
        year,
        faacData.totalAllocation,
        breakdown,
      );

      return { buffer, altText };
    } catch (error) {
      this.logger.error(
        `Image generation failed for ${lgaName}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async queryFaacData(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
  ): Promise<{ totalAllocation: number } | null> {
    if (!this.neo4j.enabled) {
      // Fallback: try pgvector tool for total allocation
      return this.queryFaacFromPgvector(lgaName, stateName, month, year);
    }

    try {
      const result = await this.neo4j.executeRead(
        `MATCH (f:FAACAllocation {lga: $lga, state: $state, month: $month, year: $year})
         RETURN f.amount AS totalAllocation
         LIMIT 1`,
        { lga: lgaName, state: stateName, month, year },
      );

      const record = result.records[0];
      if (!record) {
        return this.queryFaacFromPgvector(lgaName, stateName, month, year);
      }

      const amount = record.get("totalAllocation");
      // Neo4j may return Integer objects
      const totalAllocation =
        typeof amount === "object" && amount?.toNumber
          ? amount.toNumber()
          : Number(amount);

      if (!totalAllocation || totalAllocation <= 0) {
        return null;
      }

      return { totalAllocation };
    } catch (error) {
      this.logger.warn(
        `Neo4j query failed, falling back to pgvector: ${error instanceof Error ? error.message : error}`,
      );
      return this.queryFaacFromPgvector(lgaName, stateName, month, year);
    }
  }

  private async queryFaacFromPgvector(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
  ): Promise<{ totalAllocation: number } | null> {
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      const result = (await executeToolCall("faac-search", {
        query: `${lgaName} ${stateName} FAAC allocation ${month} ${year}`,
        state: stateName.toLowerCase(),
        month,
        year,
        lga: lgaName,
      })) as { results?: Array<{ metadata?: { total_allocation?: number } }> };

      const firstResult = result?.results?.[0];
      const total = firstResult?.metadata?.total_allocation;
      if (total && total > 0) {
        return { totalAllocation: total };
      }
      return null;
    } catch (error) {
      this.logger.warn(
        `pgvector FAAC query failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async parseBreakdownFromChunks(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
  ): Promise<FaacBreakdown | undefined> {
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      const result = (await executeToolCall("faac-search", {
        query: `${lgaName} gross statutory deduction VAT EMTL ${month} ${year}`,
        state: stateName.toLowerCase(),
        month,
        year,
        lga: lgaName,
      })) as { results?: Array<{ text?: string }> };

      if (!result?.results?.length) return undefined;

      // Try to parse breakdown from chunk texts
      for (const chunk of result.results) {
        const text = chunk.text ?? "";
        const gross = this.parseAmount(
          text,
          /Gross\s+Statutory.*?([\d,]+(?:\.\d+)?)/i,
        );
        const deduction = this.parseAmount(
          text,
          /Deduction.*?([\d,]+(?:\.\d+)?)/i,
        );
        const vat = this.parseAmount(text, /VAT.*?([\d,]+(?:\.\d+)?)/i);
        const emtl = this.parseAmount(text, /EMTL.*?([\d,]+(?:\.\d+)?)/i);

        if (gross > 0 && vat > 0) {
          return {
            grossStatutory: gross,
            deduction: deduction,
            vat: vat,
            emtl: emtl,
          };
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private parseAmount(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (!match?.[1]) return 0;
    return parseFloat(match[1].replace(/,/g, "")) || 0;
  }

  private generateAltText(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
    totalAllocation: number,
    breakdown?: FaacBreakdown,
  ): string {
    const total = this.formatNaira(totalAllocation);
    let text = `FAAC allocation infographic for ${lgaName} LGA, ${stateName} State. ${month} ${year}. Total allocation: ${total}.`;

    if (breakdown) {
      text += ` Breakdown: Gross Statutory ${this.formatNaira(breakdown.grossStatutory)},`;
      text += ` Deduction ${this.formatNaira(breakdown.deduction)},`;
      text += ` VAT ${this.formatNaira(breakdown.vat)},`;
      text += ` EMTL ${this.formatNaira(breakdown.emtl)}.`;
    }

    return text;
  }

  private formatNaira(value: number): string {
    if (value >= 1_000_000_000)
      return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
    return `₦${value}`;
  }
}
