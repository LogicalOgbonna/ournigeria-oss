import { Injectable, Logger } from "@nestjs/common";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { elapsed } from "../lib/timing.utils";
import { ITextExtractor, ExtractContext } from "./extractor.interface";

@Injectable()
export class DocxExtractor implements ITextExtractor {
  readonly supportedTypes = ["docx", "doc"];
  private readonly logger = new Logger(DocxExtractor.name);

  async extract(filePath: string, _context?: ExtractContext): Promise<string> {
    const docxStart = Date.now();
    const stat = fs.statSync(filePath);
    this.logger.log(`DOCX file (${(stat.size / 1024).toFixed(0)} KB)`);

    const tmpFile = path.join(os.tmpdir(), `docx_extract_${Date.now()}.txt`);
    const textParts: string[] = [];

    try {
      const fileList = execSync(
        String.raw`unzip -l "${filePath}" | grep "word/.*\.xml"`,
        { encoding: "utf-8", maxBuffer: 1024 * 1024 },
      );

      const xmlFiles = fileList
        .split("\n")
        .map((line: string) => line.trim().split(/\s+/).pop() ?? "")
        .filter(
          (name: string) =>
            name.startsWith("word/document") && name.endsWith(".xml"),
        );

      if (xmlFiles.length === 0) {
        xmlFiles.push("word/document.xml");
      }

      this.logger.log(`Found XML parts: ${xmlFiles.join(", ")}`);

      for (const xmlFile of xmlFiles) {
        try {
          execSync(
            String.raw`unzip -p "${filePath}" "${xmlFile}" | sed -e 's/<\/w:p>/\n/g' -e 's/<w:tab\/>/\t/g' -e 's/<[^>]*>//g' -e 's/&amp;/\&/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' > "${tmpFile}"`,
            { shell: "/bin/sh" },
          );

          const text = fs.readFileSync(tmpFile, "utf-8").trim();
          if (text.length > 0) {
            textParts.push(text);
            this.logger.log(`${xmlFile}: ${text.length} chars extracted`);
          }
        } catch (err) {
          this.logger.warn(
            `Failed to extract ${xmlFile}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `unzip listing failed: ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // ignore cleanup errors
      }
    }

    const fullText = textParts.join("\n\n");
    this.logger.log(
      `DOCX extraction done (${elapsed(docxStart)}, ${fullText.length} chars)`,
    );
    return fullText;
  }
}
