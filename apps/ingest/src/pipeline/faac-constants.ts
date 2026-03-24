/**
 * Static reference data for FAAC pipeline enrichment.
 *
 * State → Zone mapping, oil-producing states, and name normalization
 * helpers used during extraction and chunk building.
 */

/** 36 states + FCT → 6 geopolitical zones */
export const STATE_TO_ZONE: Record<string, string> = {
  Abia: "South East",
  Adamawa: "North East",
  "Akwa Ibom": "South South",
  Anambra: "South East",
  Bauchi: "North East",
  Bayelsa: "South South",
  Benue: "North Central",
  Borno: "North East",
  "Cross River": "South South",
  Delta: "South South",
  Ebonyi: "South East",
  Edo: "South South",
  Ekiti: "South West",
  Enugu: "South East",
  FCT: "North Central",
  Gombe: "North East",
  Imo: "South East",
  Jigawa: "North West",
  Kaduna: "North West",
  Kano: "North West",
  Katsina: "North West",
  Kebbi: "North West",
  Kogi: "North Central",
  Kwara: "North Central",
  Lagos: "South West",
  Nasarawa: "North Central",
  Niger: "North Central",
  Ogun: "South West",
  Ondo: "South West",
  Osun: "South West",
  Oyo: "South West",
  Plateau: "North Central",
  Rivers: "South South",
  Sokoto: "North West",
  Taraba: "North East",
  Yobe: "North East",
  Zamfara: "North West",
};

/** The 9 oil-producing states that receive 13% derivation. */
export const OIL_PRODUCING_STATES = new Set([
  "Abia",
  "Akwa Ibom",
  "Bayelsa",
  "Cross River",
  "Delta",
  "Edo",
  "Imo",
  "Ondo",
  "Rivers",
]);

/**
 * Normalize a PDF state name (uppercase, sometimes hyphenated) to Title Case
 * matching our DB convention.
 *
 * Examples:
 *  "AKWA IBOM" → "Akwa Ibom"
 *  "FCT-ABUJA" → "FCT"
 *  "CROSS RIVER" → "Cross River"
 *  "NASSARAWA" → "Nasarawa"
 */
export function normalizeStateName(raw: string): string {
  const upper = raw.trim().toUpperCase();

  // Common PDF variations
  const STATE_ALIASES: Record<string, string> = {
    "FCT-ABUJA": "FCT",
    "FCT ABUJA": "FCT",
    FCT: "FCT",
    ABUJA: "FCT",
    NASSARAWA: "Nasarawa",
    NASARAWA: "Nasarawa",
    GONGOLA: "Adamawa",
  };

  if (STATE_ALIASES[upper]) return STATE_ALIASES[upper];

  // Title-case generic conversion
  return upper
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Normalize an LGA name from PDF (uppercase, sometimes with slash variants)
 * to a consistent Title Case form.
 *
 * Examples:
 *  "ABA NORTH" → "Aba North"
 *  "OBIO AKPO" → "Obio/Akpor"
 *  "OBIO/AKPOR" → "Obio/Akpor"
 */
export function normalizeLgaName(raw: string): string {
  const upper = raw.trim().toUpperCase();

  const LGA_ALIASES: Record<string, string> = {
    "OBIO AKPO": "Obio/Akpor",
    "OBIO/AKPO": "Obio/Akpor",
    "OBIO AKPOR": "Obio/Akpor",
    "OBIO/AKPOR": "Obio/Akpor",
  };

  if (LGA_ALIASES[upper]) return LGA_ALIASES[upper];

  // Generic title-case, preserving / separators
  return upper
    .toLowerCase()
    .split("/")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join("/");
}

/**
 * Canonical mapping of all 774 Nigerian LGAs to their parent state (uppercase PDF names).
 * Includes PDF-specific spelling variants as aliases.
 * Source: Nigeria's official 774-LGA administrative structure.
 */
export const LGA_TO_STATE: Record<string, string> = {
  // Abia (17 LGAs)
  "ABA NORTH": "ABIA",
  "ABA SOUTH": "ABIA",
  "AROCHUKWU": "ABIA",
  "BENDE": "ABIA",
  "IKWUANO": "ABIA",
  "ISIALA NGWA NORTH": "ABIA",
  "ISIALA NGWA SOUTH": "ABIA",
  "ISIALA NGWA": "ABIA", // PDF alias
  "ISUIKWUATO": "ABIA",
  "OBI NGWA": "ABIA",
  "OBIOMA NGWA": "ABIA", // PDF alias
  "OHAFIA": "ABIA",
  "OSISIOMA": "ABIA",
  "UGWUNAGBO": "ABIA",
  "UKWA EAST": "ABIA",
  "UKWA WEST": "ABIA",
  "UMU-NNEOCHI": "ABIA",
  "NNEOCHI": "ABIA", // PDF alias
  "UMUAHIA NORTH": "ABIA",
  "UMUAHIA": "ABIA", // PDF alias
  "UMUAHIA SOUTH": "ABIA",

  // Adamawa (21 LGAs)
  "DEMSA": "ADAMAWA",
  "FUFORE": "ADAMAWA",
  "GANYE": "ADAMAWA",
  "GIREI": "ADAMAWA",
  "GOMBI": "ADAMAWA",
  "GUYUK": "ADAMAWA",
  "HONG": "ADAMAWA",
  "JADA": "ADAMAWA",
  "LAMURDE": "ADAMAWA",
  "MADAGALI": "ADAMAWA",
  "MAIHA": "ADAMAWA",
  "MAYO BELWA": "ADAMAWA",
  "MAYO-BELWA": "ADAMAWA", // PDF alias
  "MICHIKA": "ADAMAWA",
  "MUBI NORTH": "ADAMAWA",
  "MUBI SOUTH": "ADAMAWA",
  "NUMAN": "ADAMAWA",
  "SHELLENG": "ADAMAWA",
  "SONG": "ADAMAWA",
  "TOUNGO": "ADAMAWA",
  "YOLA NORTH": "ADAMAWA",
  "YOLA-NORTH": "ADAMAWA", // PDF alias
  "YOLA SOUTH": "ADAMAWA",
  "YOLA-SOUTH": "ADAMAWA", // PDF alias

  // Akwa Ibom (31 LGAs)
  "ABAK": "AKWA IBOM",
  "EASTERN OBOLO": "AKWA IBOM",
  "EKET": "AKWA IBOM",
  "ESIT EKET": "AKWA IBOM",
  "EKPE ATAI": "AKWA IBOM", // PDF alias for ESIT EKET
  "ESSIEN UDIM": "AKWA IBOM",
  "ETIM EKPO": "AKWA IBOM",
  "ETINAN": "AKWA IBOM",
  "IBENO": "AKWA IBOM",
  "IBESIKPO ASUTAN": "AKWA IBOM",
  "IBESIKPO": "AKWA IBOM", // PDF alias
  "IBIONO IBOM": "AKWA IBOM",
  "IKA": "AKWA IBOM",
  "IKONO": "AKWA IBOM",
  "IKOT ABASI": "AKWA IBOM",
  "IKOT EKPENE": "AKWA IBOM",
  "INI": "AKWA IBOM",
  "ITU": "AKWA IBOM",
  "MBO": "AKWA IBOM",
  "MKPAT ENIN": "AKWA IBOM",
  "NSIT ATAI": "AKWA IBOM",
  "NSIT IBOM": "AKWA IBOM",
  "NSIT UBIUM": "AKWA IBOM",
  "OBOT AKARA": "AKWA IBOM",
  "OBAT AKARA": "AKWA IBOM", // PDF alias
  "OKOBO": "AKWA IBOM",
  "ONNA": "AKWA IBOM",
  "ORON": "AKWA IBOM",
  "ORUK ANAM": "AKWA IBOM",
  "UDUNG UKO": "AKWA IBOM",
  "UKANAFUN": "AKWA IBOM",
  "URUAN": "AKWA IBOM",
  "URUE OFFONG/ORUKO": "AKWA IBOM",
  "URUE-OFFONG/ORUKO": "AKWA IBOM", // PDF alias
  "URUE OFFONG/ORUK": "AKWA IBOM", // PDF alias (truncated)
  "UQUO": "AKWA IBOM", // PDF alias for NSIT ATAI
  "UYO": "AKWA IBOM",

  // Anambra (21 LGAs)
  "AGUATA": "ANAMBRA",
  "ANAMBRA EAST": "ANAMBRA",
  "ANAMBRA WEST": "ANAMBRA",
  "ANAOCHA": "ANAMBRA",
  "ANIOCHA": "ANAMBRA", // PDF alias for ANAOCHA
  "AWKA NORTH": "ANAMBRA",
  "AWKA SOUTH": "ANAMBRA",
  "AYAMELUM": "ANAMBRA",
  "DUNUKOFIA": "ANAMBRA",
  "EKWUSIGO": "ANAMBRA",
  "EKWUSIGWO": "ANAMBRA", // PDF alias
  "IDEMILI NORTH": "ANAMBRA",
  "IDEMILI SOUTH": "ANAMBRA",
  "IHIALA": "ANAMBRA",
  "NJIKOKA": "ANAMBRA",
  "NNEWI NORTH": "ANAMBRA",
  "NNEWI SOUTH": "ANAMBRA",
  "OGBARU": "ANAMBRA",
  "ONITSHA NORTH": "ANAMBRA",
  "ONISHA NORTH": "ANAMBRA", // PDF alias
  "ONITSHA SOUTH": "ANAMBRA",
  "ONISHA SOUTH": "ANAMBRA", // PDF alias
  "ORUMBA NORTH": "ANAMBRA",
  "ORUMBA SOUTH": "ANAMBRA",
  "OYI": "ANAMBRA",

  // Bauchi (20 LGAs)
  "ALKALERI": "BAUCHI",
  "BAUCHI": "BAUCHI",
  "BOGORO": "BAUCHI",
  "DAMBAN": "BAUCHI",
  "DARAZO": "BAUCHI",
  "DASS": "BAUCHI",
  "GAMAWA": "BAUCHI",
  "GANJUWA": "BAUCHI",
  "GIADE": "BAUCHI",
  "ITAS/GADAU": "BAUCHI",
  "I/GADAU": "BAUCHI", // PDF alias
  "JAMA'ARE": "BAUCHI",
  "KATAGUM": "BAUCHI",
  "KIRFI": "BAUCHI",
  "MISAU": "BAUCHI",
  "NINGI": "BAUCHI",
  "SHIRA": "BAUCHI",
  "TAFAWA BALEWA": "BAUCHI",
  "TAFAWA-BALEWA": "BAUCHI", // PDF alias
  "TORO": "BAUCHI",
  "WARJI": "BAUCHI",
  "ZAKI": "BAUCHI",

  // Bayelsa (8 LGAs)
  "BRASS": "BAYELSA",
  "EKEREMOR": "BAYELSA",
  "EKERMOR": "BAYELSA", // PDF alias
  "KOLOKUMA/OPOKUMA": "BAYELSA",
  "NEMBE": "BAYELSA",
  "OGBIA": "BAYELSA",
  "SAGBAMA": "BAYELSA",
  "SOUTHERN IJAW": "BAYELSA",
  "YENAGOA": "BAYELSA",

  // Benue (23 LGAs)
  "ADO": "BENUE",
  "AGATU": "BENUE",
  "APA": "BENUE",
  "BURUKU": "BENUE",
  "GBOKO": "BENUE",
  "GUMA": "BENUE",
  "GWER EAST": "BENUE",
  "GWER WEST": "BENUE",
  "KATSINA ALA": "BENUE",
  "KATSINA-ALA": "BENUE", // PDF alias
  "KONSHISHA": "BENUE",
  "KWANDE": "BENUE",
  "LOGO": "BENUE",
  "MAKURDI": "BENUE",
  "OBI": "BENUE", // Also in Nasarawa — ambiguous
  "OGBADIBO": "BENUE",
  "OHIMINI": "BENUE",
  "OJU": "BENUE",
  "OKPOKWU": "BENUE",
  "OTUKPO": "BENUE",
  "TARKA": "BENUE",
  "UKUM": "BENUE",
  "USHONGO": "BENUE",
  "VANDEIKYA": "BENUE",

  // Borno (27 LGAs)
  "ABADAM": "BORNO",
  "ABADAN": "BORNO", // PDF alias
  "ASKIRA/UBA": "BORNO",
  "ASKIRA UBA": "BORNO", // PDF alias
  "BAMA": "BORNO",
  "BAYO": "BORNO",
  "BIU": "BORNO",
  "CHIBOK": "BORNO",
  "DAMBOA": "BORNO",
  "DIKWA": "BORNO",
  "GUBIO": "BORNO",
  "GUZAMALA": "BORNO",
  "GWOZA": "BORNO",
  "HAWUL": "BORNO",
  "JERE": "BORNO",
  "KAGA": "BORNO",
  "KALA/BALGE": "BORNO",
  "KALA BALGE": "BORNO", // PDF alias
  "KONDUGA": "BORNO",
  "KUKAWA": "BORNO",
  "KWAYA KUSAR": "BORNO",
  "MAFA": "BORNO",
  "MAGUMERI": "BORNO",
  "MAIDUGURI": "BORNO",
  "MAIDUGURI METRO": "BORNO", // PDF alias
  "MARTE": "BORNO",
  "MOBBAR": "BORNO",
  "MONGUNO": "BORNO",
  "NGALA": "BORNO",
  "NGANZAI": "BORNO",
  "SHANI": "BORNO",

  // Cross River (18 LGAs)
  "ABI": "CROSS RIVER",
  "AKAMKPA": "CROSS RIVER",
  "AKPABUYO": "CROSS RIVER",
  "BAKASSI": "CROSS RIVER",
  "BEKWARRA": "CROSS RIVER",
  "BEKWARA": "CROSS RIVER", // PDF alias
  "BIASE": "CROSS RIVER",
  "BOKI": "CROSS RIVER",
  "CALABAR MUNICIPAL": "CROSS RIVER",
  "CALABAR SOUTH": "CROSS RIVER",
  "ETUNG": "CROSS RIVER",
  "IKOM": "CROSS RIVER",
  "OBANLIKU": "CROSS RIVER",
  "OBUBRA": "CROSS RIVER",
  "OBUDU": "CROSS RIVER",
  "ODUKPANI": "CROSS RIVER",
  "OGOJA": "CROSS RIVER",
  "OGAJA": "CROSS RIVER", // PDF alias
  "YAKURR": "CROSS RIVER",
  "YALA": "CROSS RIVER",

  // Delta (25 LGAs)
  "ANIOCHA NORTH": "DELTA",
  "ANIOCHA SOUTH": "DELTA",
  "BOMADI": "DELTA",
  "BURUTU": "DELTA",
  "ETHIOPE EAST": "DELTA",
  "ETHIOPE WEST": "DELTA",
  "IKA NORTH EAST": "DELTA",
  "IKA SOUTH": "DELTA",
  "ISOKO NORTH": "DELTA",
  "ISOKO SOUTH": "DELTA",
  "NDOKWA EAST": "DELTA",
  "NDOKWA WEST": "DELTA",
  "OKPE": "DELTA",
  "OSHIMILI NORTH": "DELTA",
  "OSHIMILI SOUTH": "DELTA",
  "PATANI": "DELTA",
  "SAPELE": "DELTA",
  "UDU": "DELTA",
  "UGHELLI NORTH": "DELTA",
  "UGHELLI SOUTH": "DELTA",
  "UKWUANI": "DELTA",
  "UVWIE": "DELTA",
  "WARRI NORTH": "DELTA",
  "WARRI SOUTH": "DELTA",
  "WARRI SOUTH WEST": "DELTA",
  "WARRI SOUTH-WEST": "DELTA", // PDF alias

  // Ebonyi (13 LGAs)
  "ABAKALIKI": "EBONYI",
  "AFIKPO NORTH": "EBONYI",
  "AFIKPO SOUTH": "EBONYI",
  "EBONYI": "EBONYI",
  "EZZA NORTH": "EBONYI",
  "EZZA SOUTH": "EBONYI",
  "IKWO": "EBONYI",
  "ISHIELU": "EBONYI",
  "IVO": "EBONYI",
  "IZZI": "EBONYI",
  "OHAOZARA": "EBONYI",
  "OHAUKWU": "EBONYI",
  "ONICHA": "EBONYI",

  // Edo (18 LGAs)
  "AKOKO EDO": "EDO",
  "EGOR": "EDO",
  "ESAN CENTRAL": "EDO",
  "ESAN NORTH EAST": "EDO",
  "ESAN SOUTH EAST": "EDO",
  "ESAN WEST": "EDO",
  "ETSAKO CENTRAL": "EDO",
  "ETSAKO EAST": "EDO",
  "ETSAKO WEST": "EDO",
  "IGUEBEN": "EDO",
  "IKPOBA OKHA": "EDO",
  "OREDO": "EDO",
  "ORHIONMWON": "EDO",
  "ORHIONWON": "EDO", // PDF alias
  "OVIA NORTH EAST": "EDO",
  "OVIA SOUTH WEST": "EDO",
  "OWAN EAST": "EDO",
  "OWAN WEST": "EDO",
  "UHUNMWONDE": "EDO",
  "UHUNMWODE": "EDO", // PDF alias

  // Ekiti (16 LGAs)
  "ADO EKITI": "EKITI",
  "ADO-EKITI": "EKITI", // PDF alias
  "EFON": "EKITI",
  "EKITI EAST": "EKITI",
  "EKITI SOUTH WEST": "EKITI",
  "EKITI WEST": "EKITI",
  "EMURE": "EKITI",
  "GBONYIN": "EKITI",
  "AIYEKIRE": "EKITI", // PDF alias for GBONYIN
  "IDO-OSI": "EKITI",
  "IJERO": "EKITI",
  "IKERE": "EKITI",
  "IKOLE": "EKITI",
  "ILEJEMEJE": "EKITI",
  "ILEJEMEJI": "EKITI", // PDF alias
  "IREPODUN/IFELODUN": "EKITI",
  "ISE/ORUN": "EKITI",
  "MOBA": "EKITI",
  "OYE": "EKITI",

  // Enugu (17 LGAs)
  "ANINRI": "ENUGU",
  "AWGU": "ENUGU",
  "AGWU": "ENUGU", // PDF alias
  "ENUGU EAST": "ENUGU",
  "ENUGU NORTH": "ENUGU",
  "ENUGU SOUTH": "ENUGU",
  "EZEAGU": "ENUGU",
  "IGBO ETITI": "ENUGU",
  "IGBO EZE NORTH": "ENUGU",
  "IGBO EZE SOUTH": "ENUGU",
  "ISI UZO": "ENUGU",
  "ISI-UZO": "ENUGU", // PDF alias
  "NKANU EAST": "ENUGU",
  "NKANU WEST": "ENUGU",
  "NSUKKA": "ENUGU",
  "OJI RIVER": "ENUGU",
  "OJI-RIVER": "ENUGU", // PDF alias
  "UDENU": "ENUGU",
  "UDI": "ENUGU",
  "UZO UWANI": "ENUGU",
  "UZO-UWANI": "ENUGU", // PDF alias

  // FCT (6 LGAs)
  "ABAJI": "FCT-ABUJA",
  "ABUJA MUNICIPAL": "FCT-ABUJA",
  "ABUJA": "FCT-ABUJA", // PDF alias
  "FCT ABUJA": "FCT-ABUJA", // PDF alias
  "BWARI": "FCT-ABUJA",
  "GWAGWALADA": "FCT-ABUJA",
  "KUJE": "FCT-ABUJA",
  "KWALI": "FCT-ABUJA",

  // Gombe (11 LGAs)
  "AKKO": "GOMBE",
  "BALANGA": "GOMBE",
  "BILLIRI": "GOMBE",
  "DUKKU": "GOMBE",
  "FUNAKAYE": "GOMBE",
  "GOMBE": "GOMBE",
  "KALTUNGO": "GOMBE",
  "KWAMI": "GOMBE",
  "NAFADA": "GOMBE",
  "SHONGOM": "GOMBE",
  "SHOMGOM": "GOMBE", // PDF alias
  "YAMALTU/DEBA": "GOMBE",

  // Imo (27 LGAs)
  "ABOH MBAISE": "IMO",
  "AHIAZU MBAISE": "IMO",
  "EHIME MBANO": "IMO",
  "EZINIHITTE MBAISE": "IMO",
  "EZINIHITTE": "IMO", // PDF alias
  "IDEATO NORTH": "IMO",
  "IDEATO SOUTH": "IMO",
  "IHITTE/UBOMA": "IMO",
  "IHITTE UBOMA": "IMO", // PDF alias
  "IKEDURU": "IMO",
  "ISIALA MBANO": "IMO",
  "ISU": "IMO",
  "MBAITOLI": "IMO",
  "NGOR OKPALA": "IMO",
  "NGOR/OKPALA": "IMO", // PDF alias
  "NJABA": "IMO",
  "NKWERRE": "IMO",
  "NWANGELE": "IMO",
  "NKWANGELE": "IMO", // PDF alias
  "OBOWO": "IMO",
  "OGUTA": "IMO",
  "OHAJI/EGBEMA": "IMO",
  "OKIGWE": "IMO",
  "ONUIMO": "IMO",
  "ORLU": "IMO",
  "ORSU": "IMO",
  "ORU EAST": "IMO",
  "ORU": "IMO", // PDF alias for ORU EAST
  "ORU WEST": "IMO",
  "OWERRI MUNICIPAL": "IMO",
  "OWERRI NORTH": "IMO",
  "OWERRI WEST": "IMO",

  // Jigawa (27 LGAs)
  "AUYO": "JIGAWA",
  "BABURA": "JIGAWA",
  "BIRINIWA": "JIGAWA",
  "BIRNIWA": "JIGAWA", // PDF alias
  "BIRNIN KUDU": "JIGAWA",
  "BUJI": "JIGAWA",
  "DUTSE": "JIGAWA",
  "GAGARAWA": "JIGAWA",
  "GARKI": "JIGAWA",
  "GUMEL": "JIGAWA",
  "GURI": "JIGAWA",
  "GWARAM": "JIGAWA",
  "GWIWA": "JIGAWA",
  "HADEJIA": "JIGAWA",
  "JAHUN": "JIGAWA",
  "KAFIN HAUSA": "JIGAWA",
  "KAUGAMA": "JIGAWA",
  "KAZAURE": "JIGAWA",
  "KIRI KASAMA": "JIGAWA",
  "KIRI-KASAMMA": "JIGAWA", // PDF alias
  "KIYAWA": "JIGAWA",
  "MAIGATARI": "JIGAWA",
  "MALAM MADORI": "JIGAWA",
  "MIGA": "JIGAWA",
  "RINGIM": "JIGAWA",
  "RONI": "JIGAWA",
  "SULE TANKARKAR": "JIGAWA",
  "SULE TAKARKAR": "JIGAWA", // PDF alias
  "TAURA": "JIGAWA",
  "YANKWASHI": "JIGAWA",

  // Kaduna (23 LGAs)
  "BIRNIN GWARI": "KADUNA",
  "CHIKUN": "KADUNA",
  "GIWA": "KADUNA",
  "IGABI": "KADUNA",
  "IKARA": "KADUNA",
  "JABA": "KADUNA",
  "JEMA'A": "KADUNA",
  "KACHIA": "KADUNA",
  "KADUNA NORTH": "KADUNA",
  "KADUNA SOUTH": "KADUNA",
  "KAGARKO": "KADUNA",
  "KAJURU": "KADUNA",
  "KAURA": "KADUNA",
  "KAURU": "KADUNA",
  "KUBAU": "KADUNA",
  "KUDAN": "KADUNA",
  "LERE": "KADUNA",
  "MAKARFI": "KADUNA",
  "SABON GARI": "KADUNA",
  "SANGA": "KADUNA",
  "SOBA": "KADUNA",
  "ZANGON KATAF": "KADUNA",
  "ZARIA": "KADUNA",

  // Kano (44 LGAs)
  "AJINGI": "KANO",
  "ALBASU": "KANO",
  "BAGWAI": "KANO",
  "BEBEJI": "KANO",
  "BICHI": "KANO",
  "BUNKURE": "KANO",
  "DALA": "KANO",
  "DAMBATTA": "KANO",
  "DANBATTA": "KANO", // PDF alias
  "DAWAKIN KUDU": "KANO",
  "DAWAKIN TOFA": "KANO",
  "DOGUWA": "KANO",
  "FAGGE": "KANO",
  "GABASAWA": "KANO",
  "GARKO": "KANO",
  "GARUN MALAM": "KANO",
  "GARUN MALLAM": "KANO", // PDF alias
  "GAYA": "KANO",
  "GEZAWA": "KANO",
  "GWALE": "KANO",
  "GWARZO": "KANO",
  "KABO": "KANO",
  "KANO MUNICIPAL": "KANO",
  "KARAYE": "KANO",
  "KIBIYA": "KANO",
  "KIRU": "KANO",
  "KUMBOTSO": "KANO",
  "KUNCHI": "KANO",
  "KURA": "KANO",
  "MADOBI": "KANO",
  "MAKODA": "KANO",
  "MINJIBIR": "KANO",
  "NASARAWA": "KANO", // Also in Nasarawa state — ambiguous
  "NASSARAWA": "KANO", // PDF alias
  "RANO": "KANO",
  "RIMIN GADO": "KANO",
  "ROGO": "KANO",
  "SHANONO": "KANO",
  "SUMAILA": "KANO",
  "TAKAI": "KANO",
  "TARAUNI": "KANO",
  "TOFA": "KANO",
  "TSANYAWA": "KANO",
  "TUDUN WADA": "KANO",
  "UNGOGO": "KANO",
  "WARAWA": "KANO",
  "WUDIL": "KANO",

  // Katsina (34 LGAs)
  "BAKORI": "KATSINA",
  "BATAGARAWA": "KATSINA",
  "BATSARI": "KATSINA",
  "BAURE": "KATSINA",
  "BINDAWA": "KATSINA",
  "CHARANCHI": "KATSINA",
  "DAN MUSA": "KATSINA",
  "DAN-MUSA": "KATSINA", // PDF alias
  "DANDUME": "KATSINA",
  "DANJA": "KATSINA",
  "DAURA": "KATSINA",
  "DUTSI": "KATSINA",
  "DUTSIN-MA": "KATSINA",
  "DUTSINMA": "KATSINA", // PDF alias
  "FASKARI": "KATSINA",
  "FUNTUA": "KATSINA",
  "INGAWA": "KATSINA",
  "JIBIA": "KATSINA",
  "KAFUR": "KATSINA",
  "KAITA": "KATSINA",
  "KANKARA": "KATSINA",
  "KANKIA": "KATSINA",
  "KATSINA": "KATSINA",
  "KURFI": "KATSINA",
  "KUSADA": "KATSINA",
  "MAI'ADUA": "KATSINA",
  "MAIADUA": "KATSINA", // PDF alias
  "MALUMFASHI": "KATSINA",
  "MANI": "KATSINA",
  "MASHI": "KATSINA",
  "MATAZU": "KATSINA",
  "MATAZUU": "KATSINA", // PDF alias
  "MUSAWA": "KATSINA",
  "RIMI": "KATSINA",
  "SABUWA": "KATSINA",
  "SAFANA": "KATSINA",
  "SANDAMU": "KATSINA",
  "ZANGO": "KATSINA",

  // Kebbi (21 LGAs)
  "ALIERO": "KEBBI",
  "ALIERU": "KEBBI", // PDF alias
  "AREWA DANDI": "KEBBI",
  "AREWA": "KEBBI", // PDF alias
  "ARGUNGU": "KEBBI",
  "AUGIE": "KEBBI",
  "BAGUDO": "KEBBI",
  "BIRNIN KEBBI": "KEBBI",
  "BIRNIN -KEBBI": "KEBBI", // PDF alias
  "BUNZA": "KEBBI",
  "DANDI": "KEBBI",
  "DANDI KAMBA": "KEBBI", // PDF alias
  "DANKO-WASAGU": "KEBBI",
  "DANKO /WASAGU": "KEBBI", // PDF alias
  "DANKO": "KEBBI", // PDF alias
  "FAKAI": "KEBBI",
  "GWANDU": "KEBBI",
  "JEGA": "KEBBI",
  "KALGO": "KEBBI",
  "KOKO/BESSE": "KEBBI",
  "MAIYAMA": "KEBBI",
  "NGASKI": "KEBBI",
  "SAKABA": "KEBBI",
  "SHANGA": "KEBBI",
  "SURU": "KEBBI",
  "YAURI": "KEBBI",
  "ZURU": "KEBBI",

  // Kogi (21 LGAs)
  "ADAVI": "KOGI",
  "AJAOKUTA": "KOGI",
  "ANKPA": "KOGI",
  "BASSA": "KOGI", // Also in Plateau — ambiguous
  "DEKINA": "KOGI",
  "IBAJI": "KOGI",
  "IDAH": "KOGI",
  "IGALAMELA ODOLU": "KOGI",
  "IGALAMELA": "KOGI", // PDF alias
  "IJUMU": "KOGI",
  "KABBA/BUNU": "KOGI",
  "KOGI": "KOGI",
  "LOKOJA": "KOGI",
  "KOTON KARFE": "KOGI", // PDF alias for LOKOJA
  "MOPA-MURO": "KOGI",
  "OFU": "KOGI",
  "OGORI/MAGONGO": "KOGI",
  "OKEHI": "KOGI",
  "OKENE": "KOGI",
  "OLAMABORO": "KOGI",
  "OMALA": "KOGI",
  "YAGBA EAST": "KOGI",
  "YAGBA WEST": "KOGI",

  // Kwara (16 LGAs)
  "ASA": "KWARA",
  "BARUTEN": "KWARA",
  "EDU": "KWARA",
  "EKITI": "KWARA",
  "IFELODUN": "KWARA", // Also in Osun — ambiguous
  "ILORIN EAST": "KWARA",
  "ILORIN SOUTH": "KWARA",
  "ILORIN WEST": "KWARA",
  "IREPODUN": "KWARA", // Also in Osun — ambiguous
  "ISIN": "KWARA",
  "OSIN": "KWARA", // PDF alias for ISIN
  "KAIAMA": "KWARA",
  "KAI AMA": "KWARA", // PDF alias
  "MORO": "KWARA",
  "OFFA": "KWARA",
  "OKE-ERO": "KWARA",
  "OYUN": "KWARA",
  "PATEGI": "KWARA",

  // Lagos (20 LGAs)
  "AGEGE": "LAGOS",
  "AJEROMI-IFELODUN": "LAGOS",
  "AJEROMI/IFELODUN": "LAGOS", // PDF alias
  "ALIMOSHO": "LAGOS",
  "AMUWO-ODOFIN": "LAGOS",
  "AMOWO-ODOFIN": "LAGOS", // PDF alias
  "APAPA": "LAGOS",
  "BADAGRY": "LAGOS",
  "EPE": "LAGOS",
  "ETI-OSA": "LAGOS",
  "IBEJU-LEKKI": "LAGOS",
  "IBEJU/LEKKI": "LAGOS", // PDF alias
  "IFAKO-IJAIYE": "LAGOS",
  "IFAKO/IJAYE": "LAGOS", // PDF alias
  "IKEJA": "LAGOS",
  "IKORODU": "LAGOS",
  "KOSOFE": "LAGOS",
  "LAGOS ISLAND": "LAGOS",
  "LAGOS MAINLAND": "LAGOS",
  "MUSHIN": "LAGOS",
  "OJO": "LAGOS",
  "OSHODI-ISOLO": "LAGOS",
  "OSHODI/ISOLO": "LAGOS", // PDF alias
  "SOMOLU": "LAGOS",
  "SURULERE": "LAGOS", // Also in Oyo — ambiguous

  // Nasarawa (13 LGAs)
  "AKWANGA": "NASARAWA",
  "AWE": "NASARAWA",
  "DOMA": "NASARAWA",
  "KARU": "NASARAWA",
  "KEANA": "NASARAWA",
  "KEFFI": "NASARAWA",
  "KOKONA": "NASARAWA",
  "LAFIA": "NASARAWA",
  "NASARAWA EGGON": "NASARAWA",
  "NASARAWA EGON": "NASARAWA", // PDF alias
  "TOTO": "NASARAWA",
  "WAMBA": "NASARAWA",

  // Niger (25 LGAs)
  "AGAIE": "NIGER",
  "AGWARA": "NIGER",
  "BIDA": "NIGER",
  "BORGU": "NIGER",
  "BOSSO": "NIGER",
  "CHANCHAGA": "NIGER",
  "MINNA": "NIGER", // PDF alias for CHANCHAGA
  "EDATI": "NIGER",
  "GBAKO": "NIGER",
  "GURARA": "NIGER",
  "KATCHA": "NIGER",
  "KONTAGORA": "NIGER",
  "LAPAI": "NIGER",
  "LAVUN": "NIGER",
  "MAGAMA": "NIGER",
  "MARIGA": "NIGER",
  "MASHEGU": "NIGER",
  "MOKWA": "NIGER",
  "MUNYA": "NIGER",
  "MUYA": "NIGER", // PDF alias
  "PAIKORO": "NIGER",
  "RAFI": "NIGER",
  "RIJAU": "NIGER",
  "SHIRORO": "NIGER",
  "SULEJA": "NIGER",
  "TAFA": "NIGER",
  "WUSHISHI": "NIGER",

  // Ogun (20 LGAs)
  "ABEOKUTA NORTH": "OGUN",
  "ABEOKUTA SOUTH": "OGUN",
  "ADO-ODO/OTA": "OGUN",
  "EWEKORO": "OGUN",
  "IFO": "OGUN",
  "IJEBU EAST": "OGUN",
  "IJEBU NORTH": "OGUN",
  "IJEBU NORTH EAST": "OGUN",
  "IJEBU ODE": "OGUN",
  "IKENNE": "OGUN",
  "IMEKO AFON": "OGUN",
  "IMEKO-AFON": "OGUN", // PDF alias
  "IPOKIA": "OGUN",
  "OBAFEMI OWODE": "OGUN",
  "OBAFEMI/OWODE": "OGUN", // PDF alias
  "ODEDA": "OGUN",
  "ODEDAH": "OGUN", // PDF alias
  "ODOGBOLU": "OGUN",
  "OGUN WATERSIDE": "OGUN",
  "REMO NORTH": "OGUN",
  "SHAGAMU": "OGUN",
  "YEWA NORTH": "OGUN",
  "EGBADO NORTH": "OGUN", // PDF alias for YEWA NORTH
  "YEWA SOUTH": "OGUN",
  "EGBADO SOUTH": "OGUN", // PDF alias for YEWA SOUTH

  // Ondo (18 LGAs)
  "AKOKO NORTH EAST": "ONDO",
  "AKOKO NORTH WEST": "ONDO",
  "AKOKO SOUTH EAST": "ONDO",
  "AKOKO SOUTH WEST": "ONDO",
  "AKURE NORTH": "ONDO",
  "AKURE SOUTH": "ONDO",
  "ESE ODO": "ONDO",
  "ESE-ODO": "ONDO", // PDF alias
  "ESE-EDO": "ONDO", // PDF alias (OCR error)
  "IDANRE": "ONDO",
  "IFEDORE": "ONDO",
  "ILAJE": "ONDO",
  "ILE OLUJI/OKEIGBO": "ONDO",
  "ILE-OLUJI-OKEIGBO": "ONDO", // PDF alias
  "ILE-OLUJI/OKEIGBO": "ONDO", // PDF alias
  "IRELE": "ONDO",
  "ODIGBO": "ONDO",
  "OKITIPUPA": "ONDO",
  "ONDO EAST": "ONDO",
  "ONDO WEST": "ONDO",
  "OSE": "ONDO",
  "OWO": "ONDO",

  // Osun (30 LGAs)
  "AIYEDIRE": "OSUN",
  "ATAKUNMOSA EAST": "OSUN",
  "ATAKUMOSA EAST": "OSUN", // PDF alias
  "ATAKUNMOSA WEST": "OSUN",
  "ATAKUMOSA WEST": "OSUN", // PDF alias
  "AYEDAADE": "OSUN",
  "AIYEDADE": "OSUN", // PDF alias
  "BOLUWADURO": "OSUN",
  "BORIPE": "OSUN",
  "EDE NORTH": "OSUN",
  "EDE SOUTH": "OSUN",
  "EGBEDORE": "OSUN",
  "EJIGBO": "OSUN",
  "IFE CENTRAL": "OSUN",
  "IFE EAST": "OSUN",
  "IFE NORTH": "OSUN",
  "IFE SOUTH": "OSUN",
  "IFEDAYO": "OSUN",
  "ILA": "OSUN",
  "ILESA EAST": "OSUN",
  "ILESHA EAST": "OSUN", // PDF alias
  "ILESA WEST": "OSUN",
  "ILESHA WEST": "OSUN", // PDF alias
  "IREWOLE": "OSUN",
  "ISOKAN": "OSUN",
  "IWO": "OSUN",
  "OBOKUN": "OSUN",
  "ODO-OTIN": "OSUN",
  "OLA-OLUWA": "OSUN",
  "OLORUNDA": "OSUN",
  "ORIADE": "OSUN",
  "OROLU": "OSUN",
  "OSOGBO": "OSUN",

  // Oyo (33 LGAs)
  "AFIJIO": "OYO",
  "AKINYELE": "OYO",
  "ATIBA": "OYO",
  "ATISBO": "OYO",
  "EGBEDA": "OYO",
  "IBADAN NORTH": "OYO",
  "IBADAN NORTH EAST": "OYO",
  "IBADAN NORTH WEST": "OYO",
  "IBADAN SOUTH EAST": "OYO",
  "IBADAN SOUTH WEST": "OYO",
  "IBARAPA CENTRAL": "OYO",
  "IBARAPA EAST": "OYO",
  "IBARAPA NORTH": "OYO",
  "IDO": "OYO",
  "IREPO": "OYO",
  "ISEYIN": "OYO",
  "ITESIWAJU": "OYO",
  "IWAJOWA": "OYO",
  "KAJOLA": "OYO",
  "LAGELU": "OYO",
  "OGBOMOSHO NORTH": "OYO",
  "OGBOMOSHO SOUTH": "OYO",
  "OGO OLUWA": "OYO",
  "OGO-OLUWA": "OYO", // PDF alias
  "OLORUNSOGO": "OYO",
  "OLUYOLE": "OYO",
  "ONA ARA": "OYO",
  "ONA-ARA": "OYO", // PDF alias
  "OORELOPE": "OYO",
  "ORELOPE": "OYO", // PDF alias
  "ORI IRE": "OYO",
  "OYO EAST": "OYO",
  "OYO WEST": "OYO",
  "SAKI EAST": "OYO",
  "SAKI WEST": "OYO",

  // Oyo aliases from PDF
  "IFEDAPO": "OYO", // PDF alias for ATISBO area
  "IFELOJU": "OYO", // PDF alias for IBARAPA EAST area

  // Plateau (17 LGAs)
  "BARKIN LADI": "PLATEAU",
  "BOKKOS": "PLATEAU",
  "JOS EAST": "PLATEAU",
  "JOS NORTH": "PLATEAU",
  "JOS SOUTH": "PLATEAU",
  "KANAM": "PLATEAU",
  "KANKE": "PLATEAU",
  "LANGTANG NORTH": "PLATEAU",
  "LANGTANG SOUTH": "PLATEAU",
  "MANGU": "PLATEAU",
  "MIKANG": "PLATEAU",
  "PANKSHIN": "PLATEAU",
  "QUA'AN PAN": "PLATEAU",
  "QUAN-PAN": "PLATEAU", // PDF alias
  "RIYOM": "PLATEAU",
  "SHENDAM": "PLATEAU",
  "WASE": "PLATEAU",

  // Rivers (23 LGAs)
  "ABUA-ODUAL": "RIVERS",
  "OBUA/ODUAL": "RIVERS", // PDF alias
  "AHOADA EAST": "RIVERS",
  "AHOADA": "RIVERS", // PDF alias for AHOADA EAST
  "AHOADA WEST": "RIVERS",
  "AKUKU-TORU": "RIVERS",
  "AKUKUTORU": "RIVERS", // PDF alias
  "ANDONI": "RIVERS",
  "ASARI-TORU": "RIVERS",
  "ASARITORU": "RIVERS", // PDF alias
  "BONNY": "RIVERS",
  "DEGEMA": "RIVERS",
  "ELEME": "RIVERS",
  "EMOHUA": "RIVERS",
  "ETCHE": "RIVERS",
  "GOKANA": "RIVERS",
  "GONAKA": "RIVERS", // PDF alias
  "IKWERRE": "RIVERS",
  "KHANA": "RIVERS",
  "OBIO/AKPOR": "RIVERS",
  "OGBA/EGBEMA/NDONI": "RIVERS",
  "OGU/BOLO": "RIVERS",
  "OKRIKA": "RIVERS",
  "OMUMA": "RIVERS",
  "OMUMMA": "RIVERS", // PDF alias
  "OPOBO/NKORO": "RIVERS",
  "OYIGBO": "RIVERS",
  "PORT HARCOURT": "RIVERS",
  "TAI": "RIVERS",

  // Sokoto (23 LGAs)
  "BINJI": "SOKOTO",
  "BODINGA": "SOKOTO",
  "DANGE/SHUNI": "SOKOTO",
  "DANGE-SHUNI": "SOKOTO", // PDF alias
  "GADA": "SOKOTO",
  "GORONYO": "SOKOTO",
  "GUDU": "SOKOTO",
  "GWADABAWA": "SOKOTO",
  "ILLELA": "SOKOTO",
  "ISA": "SOKOTO",
  "KEBBE": "SOKOTO",
  "KWARE": "SOKOTO",
  "RABAH": "SOKOTO",
  "SABON BIRNI": "SOKOTO",
  "SHAGARI": "SOKOTO",
  "SILAME": "SOKOTO",
  "SOKOTO NORTH": "SOKOTO",
  "SOKOTO SOUTH": "SOKOTO",
  "TAMBUWAL": "SOKOTO",
  "TANGAZA": "SOKOTO",
  "TURETA": "SOKOTO",
  "WAMAKO": "SOKOTO",
  "WAMAKKO": "SOKOTO", // PDF alias
  "WURNO": "SOKOTO",
  "YABO": "SOKOTO",

  // Taraba (16 LGAs)
  "ARDO KOLA": "TARABA",
  "ARDO-KOLA": "TARABA", // PDF alias
  "BALI": "TARABA",
  "DONGA": "TARABA",
  "GASHAKA": "TARABA",
  "GASSOL": "TARABA",
  "IBI": "TARABA",
  "JALINGO": "TARABA",
  "KARIM LAMIDO": "TARABA",
  "KARIM-LAMIDO": "TARABA", // PDF alias
  "KARIM LAMIDU": "TARABA", // PDF alias
  "KURMI": "TARABA",
  "LAU": "TARABA",
  "SARDAUNA": "TARABA",
  "TAKUM": "TARABA",
  "USSA": "TARABA",
  "WUKARI": "TARABA",
  "YORRO": "TARABA",
  "ZING": "TARABA",

  // Yobe (17 LGAs)
  "BADE": "YOBE",
  "BURSARI": "YOBE",
  "DAMATURU": "YOBE",
  "FIKA": "YOBE",
  "FUNE": "YOBE",
  "GEIDAM": "YOBE",
  "GUJBA": "YOBE",
  "GULANI": "YOBE",
  "GULAMI": "YOBE", // PDF alias
  "JAKUSKO": "YOBE",
  "KARASUWA": "YOBE",
  "MACHINA": "YOBE",
  "NANGERE": "YOBE",
  "NGURU": "YOBE",
  "POTISKUM": "YOBE",
  "TARMUWA": "YOBE",
  "TARMUA": "YOBE", // PDF alias
  "YUNUSARI": "YOBE",
  "YUSUFARI": "YOBE",

  // Zamfara (14 LGAs)
  "ANKA": "ZAMFARA",
  "BAKURA": "ZAMFARA",
  "BIRNIN MAGAJI/KIYAW": "ZAMFARA",
  "BUKKUYUM": "ZAMFARA",
  "BUNGUDU": "ZAMFARA",
  "GUMMI": "ZAMFARA",
  "GUSAU": "ZAMFARA",
  "KAURA NAMODA": "ZAMFARA",
  "MARADUN": "ZAMFARA",
  "MARU": "ZAMFARA",
  "SHINKAFI": "ZAMFARA",
  "TALATA MAFARA": "ZAMFARA",
  "TALATA": "ZAMFARA", // PDF alias
  "TSAFE": "ZAMFARA",
  "ZURMI": "ZAMFARA",
};

/** LGA names that appear in multiple states. Maps name → list of possible states. */
export const AMBIGUOUS_LGAS: Record<string, string[]> = {
  "BASSA": ["KOGI", "PLATEAU"],
  "IFELODUN": ["KWARA", "OSUN"],
  "IREPODUN": ["KWARA", "OSUN"],
  "NASARAWA": ["KANO", "NASARAWA"],
  "NASSARAWA": ["KANO", "NASARAWA"],
  "SURULERE": ["LAGOS", "OYO"],
  "OBI": ["BENUE", "NASARAWA"],
};

/**
 * Resolve an LGA name to its parent state using the canonical mapping.
 * For ambiguous names, uses contextState (nearby state from the same column) to disambiguate.
 * Returns the uppercase state name or null if the LGA is not recognized.
 */
export function resolveLgaState(
  lgaName: string,
  contextState: string | null,
): string | null {
  const upper = lgaName.trim().toUpperCase();
  const state = LGA_TO_STATE[upper];
  if (!state) return null;

  const ambiguous = AMBIGUOUS_LGAS[upper];
  if (ambiguous && contextState) {
    const ctx = contextState.toUpperCase();
    const match = ambiguous.find((s) => s === ctx);
    if (match) return match;
  }
  return state;
}

/** All 6 geopolitical zones. */
export const GEOPOLITICAL_ZONES = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
] as const;

/** Get all states belonging to a given zone. */
export function getStatesInZone(zone: string): string[] {
  return Object.entries(STATE_TO_ZONE)
    .filter(([, z]) => z === zone)
    .map(([state]) => state);
}
