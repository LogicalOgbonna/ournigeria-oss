import { extractTotalAmountAlleged } from "./apps/ingest/src/pipeline/corruption-extractors.ts";
import * as fs from "fs";

const text = fs.readFileSync(
  "./packages/source/corruption/Ngozi_Okonjo-Iweala/financial_details.md",
  "utf-8",
);
console.log(extractTotalAmountAlleged(null, text));
