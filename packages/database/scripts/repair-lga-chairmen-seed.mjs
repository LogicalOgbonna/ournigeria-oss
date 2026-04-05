import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const seedDir = "/Users/arinzeogbonna/Work/personal/spending/packages/database/seed";
const chairmenPath = join(seedDir, "officials-lga-chairmen.json");

const INAUGURATION_FIXES = {
  taraba: {
    start_date: "2023-11-22",
    source_url:
      "https://leadership.ng/taraba-gov-sworns-in-16-lg-chairmen-for-3-year-tenure/",
    source_date: "2023-11-22",
    confidence: "medium",
  },
  yobe: {
    start_date: "2024-06-10",
    source_url: "https://independent.ng/just-in-buni-swears-in-newly-elected-lg-chairmen/",
    source_date: "2024-06-10",
    confidence: "medium",
  },
};

const chairmen = JSON.parse(readFileSync(chairmenPath, "utf8"));

const repaired = chairmen.map((official) => {
  const position = { ...official.position };

  if (["chairman", "vice_chairman"].includes(position.role)) {
    // LGA-scoped roles must resolve through lga_code only.
    position.state_code = null;
  }

  if (!position.start_date && position.lga_code) {
    const stateCode = position.lga_code.split("_")[0];
    const fix = INAUGURATION_FIXES[stateCode];

    if (fix) {
      position.start_date = fix.start_date;
      position.source_type = "news";
      position.source_url = fix.source_url;
      position.source_date = fix.source_date;
      position.confidence = fix.confidence;
    }
  }

  return {
    ...official,
    position,
  };
});

writeFileSync(chairmenPath, `${JSON.stringify(repaired, null, 2)}\n`);
