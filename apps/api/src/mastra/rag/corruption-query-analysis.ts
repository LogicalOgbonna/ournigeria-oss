// ─── Known Officials (surnames for word-boundary matching) ──────

const OFFICIALS_MAP: Record<string, string> = {
  "abayomi olonisakin": "Abayomi Olonisakin",
  olonisakin: "Olonisakin",
  "abba kyari": "Abba Kyari",
  kyari: "Abba Kyari",
  "abba moro": "Abba Moro",
  moro: "Abba Moro",
  "abdulaziz nyako": "Abdulaziz Nyako",
  nyako: "Abdulaziz Nyako",
  "abdulaziz yari": "Abdulaziz Yari",
  yari: "Abdulaziz Yari",
  "abdulfattah ahmed": "Abdulfattah Ahmed",
  ahmed: "Abdulfattah Ahmed",
  "abdullahi adamu": "Abdullahi Adamu",
  adamu: "Abdullahi Adamu",
  "abdullahi dikko inde": "Abdullahi Dikko Inde",
  inde: "Abdullahi Dikko Inde",
  "abdullahi ganduje": "Abdullahi Ganduje",
  ganduje: "Abdullahi Ganduje",
  "abdullahi sule": "Abdullahi Sule",
  sule: "Abdullahi Sule",
  "abdulrasheed bawa": "Abdulrasheed Bawa",
  bawa: "Abdulrasheed Bawa",
  "abdulrasheed maina": "Abdulrasheed Maina",
  maina: "Abdulrasheed Maina",
  "abdulsalami abubakar": "Abdulsalami Abubakar",
  abubakar: "Abdulsalami Abubakar",
  "abubakar audu": "Abubakar Audu",
  audu: "Abubakar Audu",
  "abubakar malami": "Abubakar Malami",
  malami: "Abubakar Malami",
  "abubakar sambo": "Abubakar Sambo",
  sambo: "Abubakar Sambo",
  "achike udenwa": "Achike Udenwa",
  udenwa: "Achike Udenwa",
  "adams oshiomhole": "Adams Oshiomhole",
  oshiomhole: "Adams Oshiomhole",
  "adamu abdullahi": "Adamu Abdullahi",
  abdullahi: "Adamu Abdullahi",
  "adamu muazu": "Adamu Muazu",
  muazu: "Adamu Muazu",
  "adebayo alao-akala": "Adebayo Alao-Akala",
  "alao-akala": "Adebayo Alao-Akala",
  "adebayo shittu": "Adebayo Shittu",
  shittu: "Adebayo Shittu",
  "ademola banu": "Ademola Banu",
  banu: "Ademola Banu",
  "adenike grange": "Adenike Grange",
  grange: "Adenike Grange",
  "adeniyi ademola": "Adeniyi Ademola",
  ademola: "Adeniyi Ademola",
  "adesola nunayon amosu": "Adesola Nunayon Amosu",
  amosu: "Adesola Nunayon Amosu",
  "adewale omirin": "Adewale Omirin",
  omirin: "Adewale Omirin",
  "adeyemi ikuforiji": "Adeyemi Ikuforiji",
  ikuforiji: "Adeyemi Ikuforiji",
  "ahmadu fintiri": "Ahmadu Fintiri",
  fintiri: "Ahmadu Fintiri",
  "ahmadu umaru fintiri": "Ahmadu Umaru Fintiri",
  "ahmed farouk": "Ahmed Farouk",
  farouk: "Ahmed Farouk",
  "ahmed idris": "Ahmed Idris",
  idris: "Ahmed Idris",
  "ahmed makarfi": "Ahmed Makarfi",
  makarfi: "Ahmed Makarfi",
  "akinwumi ambode": "Akinwumi Ambode",
  ambode: "Akinwumi Ambode",
  "akinwunmi ambode": "Akinwunmi Ambode",
  "alex badeh": "Alex Badeh",
  badeh: "Alex Badeh",
  "ali modu sheriff": "Ali Modu Sheriff",
  sheriff: "Ali Modu Sheriff",
  "aliyu akwe doma": "Aliyu Akwe Doma",
  doma: "Aliyu Akwe Doma",
  "aliyu wamakko": "Aliyu Wamakko",
  wamakko: "Aliyu Wamakko",
  "amadu sule": "Amadu Sule",
  "aminu baba-kusa": "Aminu Baba-Kusa",
  "baba-kusa": "Aminu Baba-Kusa",
  "aminu tambuwal": "Aminu Tambuwal",
  tambuwal: "Aminu Tambuwal",
  "aminu wali": "Aminu Wali",
  wali: "Aminu Wali",
  "andrew azazi": "Andrew Azazi",
  azazi: "Andrew Azazi",
  "andrew yakubu": "Andrew Yakubu",
  yakubu: "Andrew Yakubu",
  "anyim pius anyim": "Anyim Pius Anyim",
  anyim: "Anyim Pius Anyim",
  "armayau bichi": "Armayau Bichi",
  bichi: "Armayau Bichi",
  "attahiru bafarawa": "Attahiru Bafarawa",
  bafarawa: "Attahiru Bafarawa",
  "ayo fayose": "Ayo Fayose",
  fayose: "Ayo Fayose",
  "azubuike ihejirika": "Azubuike Ihejirika",
  ihejirika: "Azubuike Ihejirika",
  "babachir lawal": "Babachir Lawal",
  lawal: "Babachir Lawal",
  "babalola borishade": "Babalola Borishade",
  borishade: "Babalola Borishade",
  "bala mohammed": "Bala Mohammed",
  mohammed: "Bala Mohammed",
  "bashir yuguda": "Bashir Yuguda",
  yuguda: "Bashir Yuguda",
  "bassey albert": "Bassey Albert",
  albert: "Bassey Albert",
  "bayo ojo": "Bayo Ojo",
  "bello matawalle": "Bello Matawalle",
  matawalle: "Bello Matawalle",
  "ben ayade": "Ben Ayade",
  ayade: "Ben Ayade",
  "betta edu": "Betta Edu",
  "biodun oyebanji": "Biodun Oyebanji",
  oyebanji: "Biodun Oyebanji",
  "blessing lere-adams": "Blessing Lere-Adams",
  "lere-adams": "Blessing Lere-Adams",
  "bola tinubu": "Bola Tinubu",
  tinubu: "Bola Tinubu",
  "boni haruna": "Boni Haruna",
  haruna: "Boni Haruna",
  "buba marwa": "Buba Marwa",
  marwa: "Buba Marwa",
  "bukola saraki": "Bukola Saraki",
  saraki: "Bukola Saraki",
  "chimaroke nnamani": "Chimaroke Nnamani",
  nnamani: "Chimaroke Nnamani",
  "chinedum orji": "Chinedum Orji",
  orji: "Chinedum Orji",
  "chris alli": "Chris Alli",
  alli: "Chris Alli",
  "chris ngige": "Chris Ngige",
  ngige: "Chris Ngige",
  "christopher enweremadu": "Christopher Enweremadu",
  enweremadu: "Christopher Enweremadu",
  "chuba okadigbo": "Chuba Okadigbo",
  okadigbo: "Chuba Okadigbo",
  "dan etete": "Dan Etete",
  etete: "Dan Etete",
  "danjuma goje": "Danjuma Goje",
  goje: "Danjuma Goje",
  "danjuma mohammed": "Danjuma Mohammed",
  "dapo abiodun": "Dapo Abiodun",
  abiodun: "Dapo Abiodun",
  "darius ishaku": "Darius Ishaku",
  ishaku: "Darius Ishaku",
  "dave umahi": "Dave Umahi",
  umahi: "Dave Umahi",
  "diepreye alamieyeseigha": "Diepreye Alamieyeseigha",
  alamieyeseigha: "Diepreye Alamieyeseigha",
  "diezani alison-madueke": "Diezani Alison-Madueke",
  "alison-madueke": "Diezani Alison-Madueke",
  "dimeji bankole": "Dimeji Bankole",
  bankole: "Dimeji Bankole",
  "dino melaye": "Dino Melaye",
  melaye: "Dino Melaye",
  "donald duke": "Donald Duke",
  duke: "Donald Duke",
  "doyin okupe": "Doyin Okupe",
  okupe: "Doyin Okupe",
  "emeka ihedioha": "Emeka Ihedioha",
  ihedioha: "Emeka Ihedioha",
  "emmanuel uduaghan": "Emmanuel Uduaghan",
  uduaghan: "Emmanuel Uduaghan",
  "farouk lawan": "Farouk Lawan",
  lawan: "Farouk Lawan",
  "felix njoku": "Felix Njoku",
  njoku: "Felix Njoku",
  "femi fani-kayode": "Femi Fani-Kayode",
  "fani-kayode": "Femi Fani-Kayode",
  "femi thomas": "Femi Thomas",
  thomas: "Femi Thomas",
  "fidelis tapgun": "Fidelis Tapgun",
  tapgun: "Fidelis Tapgun",
  "fidet okhiria": "Fidet Okhiria",
  okhiria: "Fidet Okhiria",
  "florence ita-giwa": "Florence Ita-Giwa",
  "ita-giwa": "Florence Ita-Giwa",
  "gabriel aduku": "Gabriel Aduku",
  aduku: "Gabriel Aduku",
  "gabriel suswam": "Gabriel Suswam",
  suswam: "Gabriel Suswam",
  "gbenga daniel": "Gbenga Daniel",
  daniel: "Gbenga Daniel",
  "godswill akpabio": "Godswill Akpabio",
  akpabio: "Godswill Akpabio",
  "godwin emefiele": "Godwin Emefiele",
  emefiele: "Godwin Emefiele",
  "godwin obaseki": "Godwin Obaseki",
  obaseki: "Godwin Obaseki",
  "godwin ojo igbinoba": "Godwin Ojo Igbinoba",
  igbinoba: "Godwin Ojo Igbinoba",
  "goodluck jonathan": "Goodluck Jonathan",
  jonathan: "Goodluck Jonathan",
  "hadi sirika": "Hadi Sirika",
  sirika: "Hadi Sirika",
  "halima shehu": "Halima Shehu",
  shehu: "Halima Shehu",
  "haliru bello": "Haliru Bello",
  bello: "Haliru Bello",
  "hamza al-mustapha": "Hamza Al-Mustapha",
  "al-mustapha": "Hamza Al-Mustapha",
  "hassan arivi saddiq": "Hassan Arivi Saddiq",
  saddiq: "Hassan Arivi Saddiq",
  "hassan lawal": "Hassan Lawal",
  "herman hembe": "Herman Hembe",
  hembe: "Herman Hembe",
  "hope uzodinma": "Hope Uzodinma",
  uzodinma: "Hope Uzodinma",
  "ibikunle amosun": "Ibikunle Amosun",
  amosun: "Ibikunle Amosun",
  "ibrahim babangida": "Ibrahim Babangida",
  babangida: "Ibrahim Babangida",
  "ibrahim kashim": "Ibrahim Kashim",
  kashim: "Ibrahim Kashim",
  "ibrahim magu": "Ibrahim Magu",
  magu: "Ibrahim Magu",
  "ibrahim shekarau": "Ibrahim Shekarau",
  shekarau: "Ibrahim Shekarau",
  "ibrahim shema": "Ibrahim Shema",
  shema: "Ibrahim Shema",
  "ifeanyi okowa": "Ifeanyi Okowa",
  okowa: "Ifeanyi Okowa",
  "ifeanyi ubah": "Ifeanyi Ubah",
  ubah: "Ifeanyi Ubah",
  "ike ekweremadu": "Ike Ekweremadu",
  ekweremadu: "Ike Ekweremadu",
  "ikedi ohakim": "Ikedi Ohakim",
  ohakim: "Ikedi Ohakim",
  "isa pantami": "Isa Pantami",
  pantami: "Isa Pantami",
  "isa yuguda": "Isa Yuguda",
  "ishaya bamaiyi": "Ishaya Bamaiyi",
  bamaiyi: "Ishaya Bamaiyi",
  "ishaya bauka": "Ishaya Bauka",
  bauka: "Ishaya Bauka",
  "iyabo obasanjo-bello": "Iyabo Obasanjo-Bello",
  "obasanjo-bello": "Iyabo Obasanjo-Bello",
  "iyiola omisore": "Iyiola Omisore",
  omisore: "Iyiola Omisore",
  "james bala ngilari": "James Bala Ngilari",
  ngilari: "James Bala Ngilari",
  "james ibori": "James Ibori",
  ibori: "James Ibori",
  "jeremiah useni": "Jeremiah Useni",
  useni: "Jeremiah Useni",
  "jibrin usman": "Jibrin Usman",
  usman: "Jibrin Usman",
  "jide omokore": "Jide Omokore",
  omokore: "Jide Omokore",
  "jimoh olasunkanmi": "Jimoh Olasunkanmi",
  olasunkanmi: "Jimoh Olasunkanmi",
  "jolly nyame": "Jolly Nyame",
  nyame: "Jolly Nyame",
  "jonah jang": "Jonah Jang",
  jang: "Jonah Jang",
  "jonah otunla": "Jonah Otunla",
  otunla: "Jonah Otunla",
  "joshua dariye": "Joshua Dariye",
  dariye: "Joshua Dariye",
  "jumoke akinjide": "Jumoke Akinjide",
  akinjide: "Jumoke Akinjide",
  "kashim shettima": "Kashim Shettima",
  shettima: "Kashim Shettima",
  "kayode fayemi": "Kayode Fayemi",
  fayemi: "Kayode Fayemi",
  "kemebradikumo pondei": "Kemebradikumo Pondei",
  pondei: "Kemebradikumo Pondei",
  "kenneth minimah": "Kenneth Minimah",
  minimah: "Kenneth Minimah",
  "kola aluko": "Kola Aluko",
  aluko: "Kola Aluko",
  "liyel imoke": "Liyel Imoke",
  imoke: "Liyel Imoke",
  "lucky igbinedion": "Lucky Igbinedion",
  igbinedion: "Lucky Igbinedion",
  "martin elechi": "Martin Elechi",
  elechi: "Martin Elechi",
  "maurice iwu": "Maurice Iwu",
  "mele kyari": "Mele Kyari",
  "michael aondoakaa": "Michael Aondoakaa",
  aondoakaa: "Michael Aondoakaa",
  "mike okiro": "Mike Okiro",
  okiro: "Mike Okiro",
  "mohammed abubakar igp": "Mohammed Abubakar IGP",
  "mohammed babagana monguno": "Mohammed Babagana Monguno",
  monguno: "Mohammed Babagana Monguno",
  "mohammed bello adoke": "Mohammed Bello Adoke",
  adoke: "Mohammed Bello Adoke",
  "mohammed yinusa": "Mohammed Yinusa",
  yinusa: "Mohammed Yinusa",
  "muazu babangida aliyu": "Muazu Babangida Aliyu",
  aliyu: "Muazu Babangida Aliyu",
  "muhammadu buhari": "Muhammadu Buhari",
  buhari: "Muhammadu Buhari",
  "murtala nyako": "Murtala Nyako",
  "musa yar adua": "Musa Yar Adua",
  adua: "Musa Yar Adua",
  "musiliu obanikoro": "Musiliu Obanikoro",
  obanikoro: "Musiliu Obanikoro",
  "nasir el-rufai": "Nasir El-Rufai",
  "el-rufai": "Nasir El-Rufai",
  "ndudi elumelu": "Ndudi Elumelu",
  elumelu: "Ndudi Elumelu",
  "nenadi usman": "Nenadi Usman",
  "netufo olaniyi alaba": "Netufo Olaniyi Alaba",
  alaba: "Netufo Olaniyi Alaba",
  "ngozi okonjo-iweala": "Ngozi Okonjo-Iweala",
  "okonjo-iweala": "Ngozi Okonjo-Iweala",
  "ngozi olojeme": "Ngozi Olojeme",
  olojeme: "Ngozi Olojeme",
  "nicholas mutu": "Nicholas Mutu",
  mutu: "Nicholas Mutu",
  "nsima ekere": "Nsima Ekere",
  ekere: "Nsima Ekere",
  "nyesom wike": "Nyesom Wike",
  wike: "Nyesom Wike",
  "olabode george": "Olabode George",
  george: "Olabode George",
  "oladipo diya": "Oladipo Diya",
  diya: "Oladipo Diya",
  "olisa metuh": "Olisa Metuh",
  metuh: "Olisa Metuh",
  "olu agunloye": "Olu Agunloye",
  agunloye: "Olu Agunloye",
  "olusegun agagu": "Olusegun Agagu",
  agagu: "Olusegun Agagu",
  "olusegun obasanjo": "Olusegun Obasanjo",
  obasanjo: "Olusegun Obasanjo",
  "olusola obada": "Olusola Obada",
  obada: "Olusola Obada",
  "orji uzor kalu": "Orji Uzor Kalu",
  kalu: "Orji Uzor Kalu",
  "oseni adeolu olayinka": "Oseni Adeolu Olayinka",
  olayinka: "Oseni Adeolu Olayinka",
  "patricia etteh": "Patricia Etteh",
  etteh: "Patricia Etteh",
  "peter nwaoboshi": "Peter Nwaoboshi",
  nwaoboshi: "Peter Nwaoboshi",
  "peter odili": "Peter Odili",
  odili: "Peter Odili",
  "philip nto": "Philip Nto",
  "rabiu kwankwaso": "Rabiu Kwankwaso",
  kwankwaso: "Rabiu Kwankwaso",
  "ramalan yero": "Ramalan Yero",
  yero: "Ramalan Yero",
  "rasheed gbadamosi": "Rasheed Gbadamosi",
  gbadamosi: "Rasheed Gbadamosi",
  "rashidi ladoja": "Rashidi Ladoja",
  ladoja: "Rashidi Ladoja",
  "rauf aregbesola": "Rauf Aregbesola",
  aregbesola: "Rauf Aregbesola",
  "reuben abati": "Reuben Abati",
  abati: "Reuben Abati",
  "rita ofili-ajumogobia": "Rita Ofili-Ajumogobia",
  "ofili-ajumogobia": "Rita Ofili-Ajumogobia",
  "rochas okorocha": "Rochas Okorocha",
  okorocha: "Rochas Okorocha",
  "roland owie": "Roland Owie",
  owie: "Roland Owie",
  "rotimi amaechi": "Rotimi Amaechi",
  amaechi: "Rotimi Amaechi",
  "sadiya umar-farouk": "Sadiya Umar-Farouk",
  "umar-farouk": "Sadiya Umar-Farouk",
  "saleh mamman": "Saleh Mamman",
  mamman: "Saleh Mamman",
  "salisu buhari": "Salisu Buhari",
  "sambo dasuki": "Sambo Dasuki",
  dasuki: "Sambo Dasuki",
  "saminu turaki": "Saminu Turaki",
  turaki: "Saminu Turaki",
  "samuel ortom": "Samuel Ortom",
  ortom: "Samuel Ortom",
  "sani abacha": "Sani Abacha",
  abacha: "Sani Abacha",
  "shehu sani": "Shehu Sani",
  sani: "Shehu Sani",
  "sirajo jaja": "Sirajo Jaja",
  jaja: "Sirajo Jaja",
  "stella oduah": "Stella Oduah",
  oduah: "Stella Oduah",
  "stella omu": "Stella Omu",
  "stephen oronsaye": "Stephen Oronsaye",
  oronsaye: "Stephen Oronsaye",
  "sule lamido": "Sule Lamido",
  lamido: "Sule Lamido",
  "sullivan chime": "Sullivan Chime",
  chime: "Sullivan Chime",
  "sunday ehindero": "Sunday Ehindero",
  ehindero: "Sunday Ehindero",
  "sylvester ngwuta": "Sylvester Ngwuta",
  ngwuta: "Sylvester Ngwuta",
  "tafa balogun": "Tafa Balogun",
  balogun: "Tafa Balogun",
  "tersoo loko": "Tersoo Loko",
  loko: "Tersoo Loko",
  "theodore orji": "Theodore Orji",
  "theophilus danjuma": "Theophilus Danjuma",
  danjuma: "Theophilus Danjuma",
  "timipre sylva": "Timipre Sylva",
  sylva: "Timipre Sylva",
  "tuoyo omatsuli": "Tuoyo Omatsuli",
  omatsuli: "Tuoyo Omatsuli",
  "udom emmanuel": "Udom Emmanuel",
  emmanuel: "Udom Emmanuel",
  "umar ajiya": "Umar Ajiya",
  ajiya: "Umar Ajiya",
  "umaru dikko": "Umaru Dikko",
  dikko: "Umaru Dikko",
  "usman yusuf": "Usman Yusuf",
  yusuf: "Usman Yusuf",
  "victor attah": "Victor Attah",
  attah: "Victor Attah",
  "walter onnoghen": "Walter Onnoghen",
  onnoghen: "Walter Onnoghen",
  "waripamo-owei dudafa": "Waripamo-Owei Dudafa",
  dudafa: "Waripamo-Owei Dudafa",
  "willie obiano": "Willie Obiano",
  obiano: "Willie Obiano",
  "winifred oyo-ita": "Winifred Oyo-Ita",
  "oyo-ita": "Winifred Oyo-Ita",
  "yahaya bello": "Yahaya Bello",
  "yakubu adamu": "Yakubu Adamu",
  diezani: "Diezani Alison-Madueke",
  babachir: "Babachir Lawal",
};

const CASE_STATUSES = [
  "convicted",
  "acquitted",
  "ongoing",
  "pardoned",
  "plea bargain",
  "never charged",
  "discharged",
  "abated by death",
];

const AGENCIES = ["EFCC", "ICPC", "NDLEA", "Police", "NPF", "DSS", "SSS"];

const AGGREGATION_SIGNALS = [
  "how many",
  "total",
  "biggest",
  "largest",
  "all",
  "which officials",
  "list",
  "count",
  "sum",
  "aggregate",
  "ranking",
  "rank",
  "top",
  "most",
];

const COMPARATIVE_SIGNALS = [
  "compare",
  "comparison",
  "versus",
  "vs",
  "between",
  "differ",
];

// ─── Types ──────────────────────────────────────────────────────

export interface CorruptionQueryAnalysis {
  complexity: "simple" | "moderate" | "complex";
  topK: number;
  officials: string[];
  statuses: string[];
  agencies: string[];
  isAggregation: boolean;
  isComparative: boolean;
}

export interface CorruptionSubQuery {
  query: string;
  official?: string;
  status?: string;
  agency?: string;
}

// ─── Query Analysis ─────────────────────────────────────────────

export function analyzeCorruptionQueryComplexity(
  query: string,
): CorruptionQueryAnalysis {
  const lower = query.toLowerCase();

  // Extract mentioned officials
  // We use word boundaries and only match full names first to avoid matching short surnames inside other names.
  const fullNames = Object.keys(OFFICIALS_MAP).filter((name) =>
    name.includes(" "),
  );
  const shortNames = Object.keys(OFFICIALS_MAP).filter(
    (name) => !name.includes(" "),
  );

  const matchedFullNames: string[] = [];

  for (const name of fullNames) {
    if (
      new RegExp(
        `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      ).test(lower)
    ) {
      matchedFullNames.push(name);
    }
  }

  // Remove the text of matched full names from the lower string so we don't double-match their parts
  let lowerWithoutFullNames = lower;
  for (const name of matchedFullNames) {
    lowerWithoutFullNames = lowerWithoutFullNames.replace(
      new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "ig"),
      "",
    );
  }

  const matchedShortNames: string[] = [];
  for (const name of shortNames) {
    if (
      new RegExp(
        `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      ).test(lowerWithoutFullNames)
    ) {
      matchedShortNames.push(name);
    }
  }

  const officialsRaw = [...matchedFullNames, ...matchedShortNames];

  // Map to their exact DB representation and deduplicate
  const officials = Array.from(
    new Set(officialsRaw.map((name) => OFFICIALS_MAP[name])),
  );

  // Extract mentioned statuses
  // Use unique statuses that map to their exact DB representations
  const matchedStatuses = new Set<string>();

  for (const s of CASE_STATUSES) {
    if (lower.includes(s)) {
      matchedStatuses.add(s.replace(/\s+/g, "_"));
    }
  }

  const statuses = Array.from(matchedStatuses);

  // Extract mentioned agencies
  const agencies = AGENCIES.filter((a) =>
    new RegExp(`\\b${a}\\b`, "i").test(lower),
  );

  // Detect aggregation and comparison intent
  const isAggregation = AGGREGATION_SIGNALS.some((s) => lower.includes(s));
  const hasComparativeKeyword = COMPARATIVE_SIGNALS.some((s) =>
    lower.includes(s),
  );
  const isComparative = hasComparativeKeyword || officials.length > 1;

  // Complexity scoring
  let complexity: "simple" | "moderate" | "complex";
  if (
    isAggregation ||
    (isComparative && officials.length >= 3) ||
    lower.includes("all officials") ||
    lower.includes("all governors") ||
    lower.includes("every")
  ) {
    complexity = "complex";
  } else if (isComparative || officials.length > 1 || statuses.length > 0) {
    complexity = "moderate";
  } else {
    complexity = "simple";
  }

  const topKMap = { simple: 15, moderate: 30, complex: 50 };

  return {
    complexity,
    topK: topKMap[complexity],
    officials,
    statuses,
    agencies,
    isAggregation,
    isComparative,
  };
}

// ─── Query Decomposition ────────────────────────────────────────

export function decomposeCorruptionQuery(
  query: string,
  analysis: CorruptionQueryAnalysis,
): CorruptionSubQuery[] {
  // Multiple officials → per-official sub-queries
  if (analysis.officials.length > 1) {
    return analysis.officials.map((official) => ({
      query: `${official} corruption case`,
      official,
    }));
  }

  // Aggregation with status filter → query with status
  if (analysis.isAggregation && analysis.statuses.length > 0) {
    return analysis.statuses.map((status) => ({
      query: `${query}`,
      status: status.replace(/\s+/g, "_"),
    }));
  }

  // Aggregation with agency filter → query with agency
  if (analysis.isAggregation && analysis.agencies.length > 0) {
    return analysis.agencies.map((agency) => ({
      query: `${query}`,
      agency,
    }));
  }

  // Single official → pass-through
  if (analysis.officials.length === 1) {
    return [{ query, official: analysis.officials[0] }];
  }

  // Default: single query
  return [{ query }];
}
