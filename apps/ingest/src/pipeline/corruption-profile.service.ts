import { Injectable, Logger } from "@nestjs/common";
import { S3Service } from "../s3/s3.service";
import {
  type CaseStatus,
  type OfficialProfile,
  type ParsedAmount,
  extractStatus,
  extractProfile,
  extractTotalAmountAlleged,
  extractAgency,
} from "./corruption-extractors";
import { DiscoveredFile } from "./pipeline.types";

export interface OfficialProfileData {
  official: string;
  status: CaseStatus;
  profile: OfficialProfile;
  agencies: string[];
  amountAlleged: ParsedAmount | null;
}

/** Key S3 files per official used for profile extraction. */
const PROFILE_FILES = [
  "overview.md",
  "case_outcome.md",
  "charges.md",
  "financial_details.md",
  "arrest_and_investigation.md",
] as const;

@Injectable()
export class CorruptionProfileService {
  private readonly logger = new Logger(CorruptionProfileService.name);
  private profiles = new Map<string, OfficialProfileData>();

  constructor(private readonly s3: S3Service) {}

  async buildProfiles(files: DiscoveredFile[]): Promise<void> {
    // Group files by official
    const officialFiles = new Map<string, Map<string, string>>();

    for (const file of files) {
      const official = file.identity?.official as string | undefined;
      const filename = file.identity?.filename as string | undefined;
      if (!official || official === "_index" || !filename) continue;
      if (!file.s3Key) continue;

      // Only download profile-relevant files
      if (!PROFILE_FILES.some((pf) => filename === pf)) continue;

      if (!officialFiles.has(official)) {
        officialFiles.set(official, new Map());
      }
      officialFiles.get(official)!.set(filename, file.s3Key);
    }

    this.logger.log(
      `Building profiles for ${officialFiles.size} officials...`,
    );

    // Process sequentially to avoid S3 rate limits
    let processed = 0;
    for (const [official, fileMap] of officialFiles) {
      try {
        const texts = new Map<string, string>();

        for (const [filename, s3Key] of fileMap) {
          try {
            const content = await this.s3.downloadAsString(s3Key);
            texts.set(filename, content);
          } catch {
            // File may not exist for this official; skip
          }
        }

        // Extract status from case_outcome (preferred) or overview
        const caseOutcomeText = texts.get("case_outcome.md") ?? "";
        const overviewText = texts.get("overview.md") ?? "";
        const combinedStatusText = caseOutcomeText || overviewText;
        const status = extractStatus(combinedStatusText);

        // Extract profile from overview
        const profile = extractProfile(overviewText);

        // Extract agencies from arrest_and_investigation + overview
        const investigationText =
          texts.get("arrest_and_investigation.md") ?? "";
        const agencyText = `${overviewText}\n${investigationText}`;
        const agencies = extractAgency(agencyText);

        // Extract total amount from charges + financial_details
        const chargesText = texts.get("charges.md") ?? null;
        const financialText = texts.get("financial_details.md") ?? null;
        const amountAlleged = extractTotalAmountAlleged(
          chargesText,
          financialText,
        );

        this.profiles.set(official, {
          official,
          status,
          profile,
          agencies,
          amountAlleged,
        });

        processed++;
        if (processed % 50 === 0) {
          this.logger.log(`Processed ${processed}/${officialFiles.size} profiles`);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to build profile for ${official}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(
      `Built ${this.profiles.size} profiles (${officialFiles.size} officials scanned)`,
    );
  }

  getProfile(official: string): OfficialProfileData | undefined {
    return this.profiles.get(official);
  }

  getAllProfiles(): Map<string, OfficialProfileData> {
    return this.profiles;
  }

  get profileCount(): number {
    return this.profiles.size;
  }

  clear(): void {
    this.profiles.clear();
  }
}
