/**
 * Comprehensive case metadata for Nigerian officials with corruption cases.
 *
 * Each official has detailed structured data used to generate
 * high-quality synthesized .md files with proper narrative content.
 */

export const OFFICIALS = [
  // ══════════════════════════════════════════════════════════════════════
  // A. MILITARY RULERS / OFFICERS
  // ══════════════════════════════════════════════════════════════════════

  {
    dir: 'Sani_Abacha',
    name: 'Sani Abacha',
    fullName: 'General Sani Abacha GCFR',
    position: 'Military Head of State (1993-1998)',
    birthDeath: 'September 20, 1943 – June 8, 1998',
    party: 'Military',
    searchTerms: ['Abacha loot', 'Abacha fraud', 'Abacha recovery', 'Abacha stolen funds'],
    overview: {
      summary: 'Sani Abacha is widely regarded as the most corrupt leader in Nigerian history. During his five-year military dictatorship, he and his associates systematically looted an estimated $3-5 billion from the Nigerian treasury, making it one of the largest cases of kleptocracy in world history. The looted funds were hidden in bank accounts across Switzerland, Luxembourg, Liechtenstein, the United Kingdom, the United States, Jersey, and France.',
      significance: [
        'Largest single case of kleptocracy in African history, with an estimated $3-5 billion stolen',
        'First major international asset recovery case — set precedent for global anti-corruption cooperation',
        'Swiss banks returned over $2 billion; largest Swiss bank repatriation at the time',
        'Over 25 years after his death, recovery efforts continue across multiple countries',
        'Case exposed the role of Western banks in facilitating African corruption',
      ],
      currentStatus: 'Abacha died in office on June 8, 1998 under disputed circumstances. Recovery efforts by successive Nigerian governments continue to this day, with the latest being $9.5 million from Jersey (UK) in early 2026.',
    },
    charges: {
      summary: 'Abacha was never formally charged during his lifetime as he was the Head of State. After his death, his family members and associates faced various charges. The Nigerian government pursued civil recovery actions across multiple jurisdictions rather than criminal prosecution.',
      details: [
        { description: 'Civil asset recovery proceedings filed in Switzerland, UK, US, Luxembourg, Liechtenstein, Jersey, and France', year: '1999-present' },
        { description: 'Criminal charges filed against associates including Mohammed Abacha (son), Al-Mustapha (CSO), and numerous security officials', year: '1999' },
        { description: 'DOJ kleptocracy asset recovery initiative targeting Abacha-linked assets in the United States', year: '2014' },
      ],
    },
    financial: {
      totalAlleged: '$3-5 billion (estimated total looted)',
      amounts: [
        { amount: '$2.2 billion', description: 'Recovered from Swiss banks by Nigerian government', year: '1999-2020' },
        { amount: '$480 million', description: 'Recovered via World Bank-brokered agreement (2017)', year: '2017' },
        { amount: '$308 million', description: 'Forfeited under US DOJ action', year: '2020' },
        { amount: '$321 million', description: 'Recovered from Liechtenstein', year: '2002' },
        { amount: '$9.5 million', description: 'Pending recovery from Jersey (UK)', year: '2026' },
        { amount: '$40 million', description: 'Jewelry seized from family', year: '1999' },
      ],
      properties: [
        'Numerous properties across Abuja and Lagos',
        'London real estate holdings',
        'Properties seized by government post-1998',
      ],
      sourceOfFunds: 'Direct looting of the Nigerian treasury, Central Bank of Nigeria, NNPC proceeds, and security vote allocations. Funds were moved through a network of front companies and foreign bank accounts managed by family members and associates.',
    },
    courtProceedings: {
      summary: 'Since Abacha died in office, proceedings have focused on civil asset recovery across multiple jurisdictions and criminal prosecution of associates. Switzerland, Liechtenstein, Luxembourg, Jersey, the UK, and the US have all been involved in repatriation proceedings.',
      courts: [
        { court: 'Swiss Federal Court', role: 'Ordered repatriation of $2.2 billion in Abacha loot', status: 'Multiple rulings, 1999-2020' },
        { court: 'US District Court (DC)', role: 'DOJ civil forfeiture of $308 million', status: 'Concluded' },
        { court: 'Federal High Court, Lagos', role: 'Charges against Mohammed Abacha and associates', status: 'Various outcomes' },
        { court: 'Royal Court of Jersey', role: 'Ordered forfeiture of $267 million; latest $9.5 million', status: 'Ongoing (2026)' },
      ],
    },
    arrestInvestigation: {
      summary: 'Abacha was never arrested as he died in office on June 8, 1998. Upon the transition to civilian rule in 1999, the Obasanjo administration launched investigations and pursued recovery of stolen assets. Swiss authorities froze Abacha family accounts in 1999 after a mutual legal assistance request from Nigeria. The investigation revealed a global network of accounts and shell companies across dozens of countries.',
    },
    caseOutcome: {
      summary: 'Abacha died in office and was never tried. His family negotiated a settlement with the Nigerian government in 2002, returning approximately $1 billion in exchange for immunity from prosecution. However, further recovery efforts continued. Son Mohammed Abacha was convicted of money laundering. Over $2.4 billion has been recovered across all jurisdictions as of 2026, but significant amounts remain unrecovered.',
      status: 'Partial Recovery / Ongoing',
    },
    timeline: [
      { date: 'November 17, 1993', event: 'Abacha seizes power in a palace coup, becomes Head of State' },
      { date: '1993-1998', event: 'Systematic looting of Nigerian treasury estimated at $3-5 billion' },
      { date: 'June 8, 1998', event: 'Abacha dies in office under disputed circumstances (officially heart attack)' },
      { date: 'June 9, 1998', event: 'Abdulsalami Abubakar becomes Head of State' },
      { date: '1999', event: 'Swiss authorities freeze $660 million in Abacha family bank accounts' },
      { date: '1999-2000', event: 'Obasanjo administration launches investigations; Mohammed Abacha arrested' },
      { date: '2002', event: 'Abacha family reaches settlement — returns $1 billion in exchange for immunity' },
      { date: '2004', event: 'Switzerland returns $500 million in first major repatriation' },
      { date: '2006', event: 'Additional $458 million returned from Swiss accounts' },
      { date: '2014', event: 'US DOJ launches kleptocracy asset recovery case targeting Abacha assets' },
      { date: '2017', event: 'Switzerland returns $321 million via World Bank-brokered agreement with monitoring' },
      { date: '2020', event: 'US DOJ forfeits $308 million in Abacha-linked assets; Jersey freezes $267 million' },
      { date: 'January 2026', event: 'Nigeria set to receive $9.5 million from Jersey (UK) as "tainted property"' },
    ],
    keyPlayers: {
      accused: [
        { name: 'Sani Abacha', role: 'Military Head of State (deceased)', status: 'Died in office June 8, 1998' },
        { name: 'Mohammed Abacha', role: 'Son of Sani Abacha', status: 'Convicted of money laundering; later received presidential pardon' },
        { name: 'Maryam Abacha', role: 'Wife of Sani Abacha', status: 'Investigations; settled with government' },
        { name: 'Abba Abacha', role: 'Son of Sani Abacha', status: 'Investigations' },
      ],
      associates: [
        { name: 'Abubakar Atiku Bagudu', role: 'Abacha associate / Governor of Kebbi State', note: 'Allegedly helped launder Abacha funds; settled with Jersey authorities; became Governor and Senator' },
        { name: 'Gilbert Chagoury', role: 'Lebanese-Nigerian billionaire', note: 'Convicted in Switzerland in 2000 for laundering Abacha loot; fined CHF 1 million; returned ~$66 million to Nigeria; awarded GCON by Tinubu in 2026' },
        { name: 'Dan Etete', role: 'Petroleum Minister under Abacha', note: 'Involved in the OPL 245 (Malabu) scandal' },
      ],
      investigators: [
        { name: 'Enrico Monfrini', role: 'Swiss lawyer hired by Nigeria', note: 'Led asset tracing effort across Swiss banks for over 20 years' },
        { name: 'EFCC', role: 'Economic and Financial Crimes Commission', note: 'Domestic investigation and recovery coordination' },
      ],
    },
  },

  {
    dir: 'Ibrahim_Babangida',
    name: 'Ibrahim Babangida',
    fullName: 'General Ibrahim Badamasi Babangida GCFR',
    position: 'Military President (1985-1993)',
    birthDeath: 'Born August 17, 1941',
    party: 'Military',
    searchTerms: ['Babangida corruption', 'IBB Gulf War windfall', 'Babangida fraud'],
    overview: {
      summary: 'Ibrahim Babangida, popularly known as IBB, presided over Nigeria during a period of significant economic turmoil and is widely accused of mismanaging billions of dollars in oil windfall profits from the Gulf War (1990-1991). The Okigbo Panel, set up by his successor Abacha, found that $12.4 billion in oil windfall from the Gulf War was unaccounted for under Babangida\'s watch.',
      significance: [
        '$12.4 billion Gulf War oil windfall declared missing by the Okigbo Panel',
        'Structural Adjustment Programme (SAP) devastated the Nigerian economy while elite corruption flourished',
        'Annulled the June 12, 1993 presidential election — widely considered Nigeria\'s freest — won by MKO Abiola',
        'Never prosecuted despite massive allegations; remains politically influential',
      ],
      currentStatus: 'Babangida has never been charged or prosecuted. He remains a prominent political figure and elder statesman, residing in his hilltop mansion in Minna, Niger State.',
    },
    charges: {
      summary: 'No formal charges have ever been filed against Ibrahim Babangida. The Okigbo Panel findings were never acted upon, and successive governments have declined to prosecute him.',
      details: [],
    },
    financial: {
      totalAlleged: '$12.4 billion (Gulf War oil windfall, per Okigbo Panel)',
      amounts: [
        { amount: '$12.4 billion', description: 'Gulf War oil windfall declared unaccounted for by the Okigbo Panel', year: '1994' },
      ],
      sourceOfFunds: 'Oil windfall profits from the spike in crude oil prices during the 1990-1991 Gulf War. The funds were managed through dedicated accounts outside normal government budgetary oversight.',
    },
    courtProceedings: { summary: 'No court proceedings have been initiated against Ibrahim Babangida.', courts: [] },
    arrestInvestigation: {
      summary: 'The Okigbo Panel (1994) under Gen. Abacha\'s regime investigated the Gulf War oil windfall and found $12.4 billion unaccounted for. However, Abacha took no action. Subsequent civilian governments also declined to prosecute. Under Obasanjo (1999-2007), there were calls to probe IBB but no formal investigation was launched.',
    },
    caseOutcome: { summary: 'No prosecution. Babangida has never been charged, arrested, or tried for corruption. He continues to live freely as an elder statesman.', status: 'No Action Taken' },
    timeline: [
      { date: 'August 27, 1985', event: 'Babangida overthrows Buhari in a palace coup' },
      { date: '1990-1991', event: 'Gulf War oil windfall generates $12.4 billion in extra revenue' },
      { date: 'June 12, 1993', event: 'Presidential election won by MKO Abiola; Babangida annuls results' },
      { date: 'August 26, 1993', event: 'Babangida "steps aside" from power; installs interim government' },
      { date: '1994', event: 'Okigbo Panel finds $12.4 billion Gulf War windfall unaccounted for' },
    ],
    keyPlayers: {
      accused: [{ name: 'Ibrahim Babangida', role: 'Military President', status: 'Never charged' }],
      associates: [],
      investigators: [{ name: 'Dr. Pius Okigbo', role: 'Chairman of the Okigbo Panel', note: 'Panel report found $12.4 billion missing' }],
    },
  },

  {
    dir: 'Abdulsalami_Abubakar',
    name: 'Abdulsalami Abubakar',
    fullName: 'General Abdulsalami Alhaji Abubakar GCFR',
    position: 'Military Head of State (1998-1999)',
    party: 'Military',
    searchTerms: ['Abdulsalami corruption', 'Abdulsalami Abubakar fraud'],
    overview: {
      summary: 'Abdulsalami Abubakar succeeded Sani Abacha and oversaw Nigeria\'s transition to civilian rule in 1999. While praised for the transition, he has faced allegations of massive last-minute looting during his brief tenure, with some estimates suggesting billions of dollars were diverted in the months before handover to Obasanjo.',
      significance: ['Allegations of last-minute looting during transition period', 'Never prosecuted despite allegations'],
      currentStatus: 'No charges filed. Remains an elder statesman and peace mediator.',
    },
    charges: { summary: 'No formal charges have ever been filed against Abdulsalami Abubakar.', details: [] },
    financial: { totalAlleged: 'Billions of dollars (unspecified)', amounts: [], sourceOfFunds: 'Alleged last-minute diversion of state funds during transition period (1998-1999).' },
    courtProceedings: { summary: 'No court proceedings.', courts: [] },
    arrestInvestigation: { summary: 'No formal investigation has been conducted.' },
    caseOutcome: { summary: 'No prosecution or investigation.', status: 'No Action Taken' },
    timeline: [
      { date: 'June 9, 1998', event: 'Becomes Head of State following Abacha\'s death' },
      { date: 'May 29, 1999', event: 'Hands over power to democratically elected Olusegun Obasanjo' },
    ],
    keyPlayers: {
      accused: [{ name: 'Abdulsalami Abubakar', role: 'Military Head of State', status: 'Never charged' }],
      associates: [], investigators: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // B. PRESIDENTS / HEADS OF STATE
  // ══════════════════════════════════════════════════════════════════════

  {
    dir: 'Bola_Tinubu',
    name: 'Bola Ahmed Tinubu',
    fullName: 'Bola Ahmed Adekunle Tinubu GCFR',
    position: 'President of Nigeria (2023-present)',
    birthDeath: 'Born March 29, 1952',
    party: 'All Progressives Congress (APC)',
    searchTerms: ['Tinubu corruption', 'Tinubu Alpha Beta', 'Tinubu Chicago drug case', 'Tinubu bullion van', 'Tinubu CSU certificate', 'Tinubu forfeiture'],
    overview: {
      summary: 'Bola Tinubu, Nigeria\'s current President, has been dogged by multiple corruption allegations spanning decades. These include a 1993 drug trafficking investigation in Chicago where he forfeited $460,000 to US authorities, long-running allegations about the Alpha Beta Consulting firm (which collects taxes on behalf of Lagos State and allegedly remits a percentage to Tinubu), the controversial display of bullion vans at his Bourdillon residence before the 2019 elections, and questions about his academic credentials from Chicago State University.',
      significance: [
        'Sitting President with unresolved corruption allegations spanning decades',
        '1993 Chicago drug forfeiture case — $460,000 forfeited to US government',
        'Alpha Beta Consulting allegations — accused of siphoning 10% of Lagos internal revenue since 1999',
        'Bullion van controversy — two bullion vans seen at his residence on 2019 election eve',
        'CSU certificate controversy — questions about identity and academic records',
      ],
      currentStatus: 'As sitting President, Tinubu enjoys constitutional immunity from prosecution. The allegations remain unresolved. Alpha Beta has denied any wrongdoing.',
    },
    charges: {
      summary: 'Tinubu has never been formally charged in Nigeria. In the United States, he was involved in a 1993 drug trafficking investigation where funds in his bank accounts were civilly forfeited. He was not criminally charged in that case.',
      details: [
        { description: 'US civil forfeiture of $460,000 linked to narcotics trafficking investigation in Chicago (Northern District of Illinois)', year: '1993' },
        { description: 'No criminal charges filed in the US — Tinubu cooperated and forfeited the funds', year: '1993' },
        { description: 'Various civil suits regarding Alpha Beta Consulting in Nigerian courts', year: '2007-present' },
      ],
    },
    financial: {
      totalAlleged: 'Unknown total; key figures include $460,000 US forfeiture and alleged billions from Alpha Beta',
      amounts: [
        { amount: '$460,000', description: 'Forfeited to US government in drug trafficking investigation', year: '1993' },
        { amount: 'Billions of naira (alleged)', description: 'Allegedly earned through Alpha Beta Consulting\'s 10% commission on Lagos tax revenue since 1999', year: '1999-present' },
        { amount: 'Undisclosed (bullion vans)', description: 'Contents of two bullion vans delivered to his Bourdillon residence before 2019 elections', year: '2019' },
      ],
      sourceOfFunds: 'Alleged sources include: (1) tax consultancy commissions through Alpha Beta Consulting; (2) historical narcotics proceeds (per US investigation); (3) accumulated wealth from political influence in Lagos State since 1999.',
    },
    courtProceedings: {
      summary: 'The main legal proceedings have been in the United States (1993 civil forfeiture) and various Nigerian courts regarding Alpha Beta and election-related matters.',
      courts: [
        { court: 'US District Court, Northern District of Illinois', role: 'Drug-related civil forfeiture of $460,000', status: 'Concluded (1993)' },
        { court: 'Various Nigerian courts', role: 'Alpha Beta Consulting disputes; election petitions', status: 'Various' },
      ],
    },
    arrestInvestigation: {
      summary: 'In 1993, US law enforcement investigated Tinubu\'s bank accounts at Citibank and First Heritage Bank in connection with heroin trafficking by couriers operating between Chicago, Nigeria, and other locations. Tinubu was identified as connected to the drug ring and his accounts were forfeited. He was not criminally indicted. In Nigeria, there have been no formal EFCC investigations of Tinubu, partly due to his political influence and later presidential immunity.',
    },
    caseOutcome: { summary: 'No criminal conviction. US forfeiture concluded in 1993. As sitting President, Tinubu enjoys immunity from prosecution in Nigeria. Allegations remain unresolved.', status: 'Unresolved / Immunity' },
    timeline: [
      { date: '1993', event: 'US DEA/IRS investigation; $460,000 in bank accounts forfeited in drug-related case' },
      { date: '1999-2007', event: 'Governor of Lagos State; Alpha Beta Consulting established for tax collection' },
      { date: '2007-2023', event: 'Political "godfather" of Lagos/SW Nigeria; Alpha Beta allegations persist' },
      { date: 'February 2019', event: 'Bullion vans spotted at Bourdillon residence on eve of presidential election' },
      { date: '2022-2023', event: 'CSU certificate controversy during presidential campaign' },
      { date: 'February 25, 2023', event: 'Elected President of Nigeria' },
      { date: 'May 29, 2023', event: 'Inaugurated as President; gains constitutional immunity' },
    ],
    keyPlayers: {
      accused: [{ name: 'Bola Tinubu', role: 'President of Nigeria', status: 'Enjoys presidential immunity; no charges in Nigeria' }],
      associates: [
        { name: 'Alpha Beta Consulting', role: 'Tax consultancy firm', note: 'Allegedly collects taxes for Lagos State and remits percentage to Tinubu' },
        { name: 'Dapo Apara', role: 'Former MD of Alpha Beta', note: 'Filed affidavit alleging Tinubu receives 10% of all Lagos IGR through Alpha Beta' },
      ],
      investigators: [
        { name: 'US Drug Enforcement Administration (DEA)', role: 'Investigated 1993 drug case', note: 'Case concluded with civil forfeiture' },
        { name: 'US Internal Revenue Service (IRS)', role: 'Financial investigation in 1993 case', note: '' },
      ],
    },
  },

  {
    dir: 'Goodluck_Jonathan',
    name: 'Goodluck Jonathan',
    fullName: 'Dr. Goodluck Ebele Azikiwe Jonathan GCFR',
    position: 'President of Nigeria (2010-2015)',
    party: 'People\'s Democratic Party (PDP)',
    searchTerms: ['Goodluck Jonathan corruption', 'Jonathan Dasukigate', 'Jonathan investigation'],
    overview: {
      summary: 'Goodluck Jonathan\'s administration was marred by numerous corruption scandals including the $2.1 billion Dasuki arms deal, the $20 billion "missing" NNPC funds alleged by former CBN Governor Sanusi Lamido Sanusi, the fuel subsidy scam, and widespread allegations of mismanagement. While Jonathan himself has not been formally charged, several of his appointees face major corruption cases.',
      significance: [
        '$2.1 billion arms deal scandal (Dasukigate) — national security funds diverted',
        'Sanusi Lamido Sanusi alleged $20 billion missing from NNPC',
        'Fuel subsidy fraud uncovered during his tenure',
        'Diezani Alison-Madueke appointed under his watch',
      ],
      currentStatus: 'Jonathan has not been formally charged with corruption. He has maintained his innocence and serves as an international election observer and peace mediator.',
    },
    charges: { summary: 'No formal charges have been filed against Goodluck Jonathan personally.', details: [] },
    financial: { totalAlleged: 'No specific amount alleged against Jonathan personally; associated scandals total billions', amounts: [], sourceOfFunds: '' },
    courtProceedings: { summary: 'No court proceedings against Jonathan personally.', courts: [] },
    arrestInvestigation: { summary: 'No formal investigation has been publicly confirmed against Jonathan personally. Investigations focused on his appointees including Sambo Dasuki, Diezani Alison-Madueke, and others.' },
    caseOutcome: { summary: 'No prosecution against Jonathan personally.', status: 'No Charges Filed' },
    timeline: [
      { date: 'May 5, 2010', event: 'Becomes President following death of Yar\'Adua' },
      { date: '2012', event: 'Fuel subsidy scandal exposed' },
      { date: 'February 2014', event: 'CBN Governor Sanusi alleges $20 billion missing from NNPC' },
      { date: 'March 2015', event: 'Loses presidential election to Buhari; concedes peacefully' },
      { date: 'November 2015', event: 'Dasuki arrested over $2.1 billion arms deal fraud' },
    ],
    keyPlayers: {
      accused: [{ name: 'Goodluck Jonathan', role: 'Former President', status: 'Not charged' }],
      associates: [], investigators: [],
    },
  },

  {
    dir: 'Olusegun_Obasanjo',
    name: 'Olusegun Obasanjo',
    fullName: 'Chief Olusegun Matthew Okikiola Aremu Obasanjo GCFR',
    position: 'President (1999-2007) / Military Head of State (1976-1979)',
    party: 'People\'s Democratic Party (PDP)',
    searchTerms: ['Obasanjo corruption', 'Obasanjo farms fraud', 'Obasanjo third term'],
    overview: {
      summary: 'Olusegun Obasanjo has faced corruption allegations related to his presidential library project, third-term bid expenditures, and the activities of Obasanjo Farms. While he championed the creation of the EFCC and ICPC during his presidency, critics allege he used anti-corruption selectively against political opponents while overlooking allies.',
      significance: [
        'Created EFCC (2003) and ICPC (2000) to fight corruption',
        'Accused of spending billions on failed third-term bid',
        'Presidential library project funding questions',
        'Pardoned Alamieyeseigha (convicted ex-governor) in 2013',
      ],
      currentStatus: 'Obasanjo has never been formally charged with corruption. He remains politically active as an elder statesman.',
    },
    charges: { summary: 'No formal charges filed against Obasanjo.', details: [] },
    financial: { totalAlleged: 'No specific amount formally alleged', amounts: [], sourceOfFunds: '' },
    courtProceedings: { summary: 'No court proceedings against Obasanjo for corruption.', courts: [] },
    arrestInvestigation: { summary: 'No formal corruption investigation against Obasanjo. He was jailed in 1995 under Abacha for alleged coup plotting (not corruption).' },
    caseOutcome: { summary: 'No charges or prosecution for corruption.', status: 'No Charges Filed' },
    timeline: [
      { date: '1999-2007', event: 'President; creates EFCC and ICPC' },
      { date: '2006', event: 'Third-term bid fails amid allegations of billions spent bribing legislators' },
    ],
    keyPlayers: {
      accused: [{ name: 'Olusegun Obasanjo', role: 'Former President / Military Head of State', status: 'Never charged' }],
      associates: [], investigators: [],
    },
  },

  {
    dir: 'Muhammadu_Buhari',
    name: 'Muhammadu Buhari',
    fullName: 'Major General Muhammadu Buhari GCFR',
    position: 'President of Nigeria (2015-2023)',
    party: 'All Progressives Congress (APC)',
    searchTerms: ['Buhari corruption', 'Buhari NNPC', 'Buhari regime corruption'],
    overview: {
      summary: 'Muhammadu Buhari campaigned on an anti-corruption platform but his administration faced criticism for selective prosecution, shielding allies from investigation, and corruption allegations against senior officials including the Accountant General (Ahmed Idris), Minister of Aviation (Hadi Sirika), and others. Buhari himself has not been charged with corruption.',
      significance: [
        'Won 2015 election on anti-corruption platform',
        'Critics allege selective use of EFCC against opponents',
        'Multiple senior officials in his administration charged with corruption',
        'Controversial NNPC management during his tenure',
      ],
      currentStatus: 'Not charged with any offense. Lives in Daura, Katsina State.',
    },
    charges: { summary: 'No formal charges against Buhari personally.', details: [] },
    financial: { totalAlleged: 'No amount alleged against Buhari personally', amounts: [], sourceOfFunds: '' },
    courtProceedings: { summary: 'No proceedings against Buhari.', courts: [] },
    arrestInvestigation: { summary: 'No formal investigation against Buhari.' },
    caseOutcome: { summary: 'No charges or prosecution.', status: 'No Charges Filed' },
    timeline: [
      { date: '1983-1985', event: 'Military Head of State (overthrown by Babangida)' },
      { date: 'March 2015', event: 'Wins presidential election on anti-corruption platform' },
      { date: '2015-2023', event: 'Presidency marked by corruption scandals among appointees but no personal charges' },
    ],
    keyPlayers: {
      accused: [{ name: 'Muhammadu Buhari', role: 'Former President', status: 'Never charged' }],
      associates: [], investigators: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // C. STATE GOVERNORS WITH EFCC/CORRUPTION CASES
  // ══════════════════════════════════════════════════════════════════════

  {
    dir: 'Yahaya_Bello',
    name: 'Yahaya Bello',
    fullName: 'Yahaya Adoza Bello',
    position: 'Governor of Kogi State (2016-2024)',
    party: 'All Progressives Congress (APC)',
    searchTerms: ['Yahaya Bello EFCC', 'Yahaya Bello corruption', 'Yahaya Bello money laundering'],
    overview: {
      summary: 'Yahaya Bello is facing one of the largest corruption prosecutions in Nigeria\'s history. The EFCC has accused him of laundering N80,246,470,089.88 (approximately N80.2 billion) in public funds belonging to Kogi State during his eight-year tenure as governor. A second charge of N110.4 billion was separately filed at the FCT High Court, bringing total allegations to approximately N190 billion.',
      significance: [
        'N80.2 billion money laundering charge — among the largest ever by EFCC',
        'Separate N110.4 billion charge — combined allegations of ~N190 billion',
        'Dramatic arrest saga — evaded EFCC for months; declared wanted April 2024',
        'Governor Ododo allegedly smuggled Bello out during EFCC siege',
        'International dimensions — transfers to TD Bank USA, Dubai properties',
        'Active trial ongoing before Justice Emeka Nwite as of February 2026',
      ],
      currentStatus: 'Standing trial before Justice Emeka Nwite of the Federal High Court, Abuja, on 19 counts of money laundering. Pleaded not guilty. On bail of N500 million. Trial actively ongoing as of February 2026.',
    },
    charges: {
      summary: 'Two sets of charges totaling approximately N190 billion have been filed against Bello.',
      details: [
        { description: '19-count charge of criminal breach of trust and money laundering involving N80,246,470,089.88 at Federal High Court, Abuja', year: '2024', law: 'Section 18(a), punishable under Section 15(3) of the Money Laundering (Prohibition) Act, 2011', arraignment: 'December 13, 2024', plea: 'Not guilty to all counts' },
        { description: '16-count charge of N110,446,470,089.88 at the High Court of the FCT, Abuja, filed September 25, 2024', year: '2024' },
        { description: 'Separate 16-count charge against Ali Bello (nephew) and Daudu Sulaiman for N10,270,556,800 money laundering', year: '2024' },
      ],
    },
    financial: {
      totalAlleged: '~N190 billion combined (N80.2 billion + N110.4 billion)',
      amounts: [
        { amount: 'N80,246,470,089.88', description: 'Federal High Court charge — money laundering and criminal breach of trust', year: '2024' },
        { amount: 'N110,446,470,089.88', description: 'FCT High Court charge — criminal breach of trust', year: '2024' },
        { amount: 'N10,270,556,800', description: 'Separate charge against nephew Ali Bello', year: '2024' },
        { amount: '$720,000', description: 'Alleged withdrawal from state coffers for children\'s school fees abroad', year: '' },
        { amount: '$760,910.84', description: 'Seized by EFCC — prepaid school fees to American International School, Abuja, for four children', year: 'December 2023' },
        { amount: 'N700 million', description: 'NIP transfer from Keyless Nature Limited (FCMB records)', year: 'December 2021' },
        { amount: 'N400 million', description: 'RTGS inflow from Access Bank', year: 'December 2021' },
        { amount: 'N46.5 million', description: 'Transferred to American International School Abuja', year: '' },
      ],
      properties: [
        'No. 35 Danube Street, Maitama District, Abuja — N950 million (2023)',
        'Block 18 (337) Flat B, Gwelo Street, Wuse Zone 4, Abuja — N60 million (2016)',
        'No. 9 Benghazi Street, Wuse Zone 4, Abuja — N310.4 million renovation (2017)',
        'Dubai, UAE property — 5,698,888 UAE dirhams (~N2.5 billion) (2022)',
        'N550 million property (documents do not bear Bello\'s name)',
      ],
      shellCompanies: ['Kunfayakun Global Limited', 'Keyless Nature Limited'],
      sourceOfFunds: 'Kogi State Government coffers during Bello\'s eight-year tenure (2016-2024). EFCC alleges the money constituted proceeds of criminal breach of trust of public funds.',
      bail: 'N500 million with two sureties in like sum; sureties must own properties within jurisdiction; international passport deposited; remanded at Kuje Correctional Centre until bail met',
    },
    courtProceedings: {
      summary: 'Two parallel trials ongoing at Federal High Court and FCT High Court in Abuja. Separate trial for nephew Ali Bello.',
      courts: [
        { court: 'Federal High Court, Maitama, Abuja', role: 'N80.2 billion money laundering case (19 counts)', judge: 'Justice Emeka Nwite', status: 'Ongoing — prosecution witnesses testifying (PW8+ as of Feb 2026)' },
        { court: 'High Court of the FCT, Abuja', role: 'N110.4 billion criminal breach of trust (16 counts)', status: 'Ongoing' },
        { court: 'Federal High Court, Maitama, Abuja', role: 'N10 billion case against Ali Bello', judge: 'Justice James Omotosho', status: 'Ongoing' },
      ],
      keyRulings: [
        'Bail granted at N500 million (December 2024)',
        'Passport release for medical travel rejected twice by Justice Nwite',
        'EFCC request to cross-examine its own witness rejected',
        'Court of Appeal ruled Bello must present himself for arraignment (August 2024)',
      ],
    },
    arrestInvestigation: {
      summary: 'EFCC Chairman Ola Olukoyede personally invited Bello for interview after leaving office, but Bello refused. In April 2024, EFCC operatives besieged Bello\'s Wuse Zone 4, Abuja residence. Governor Ahmed Ododo allegedly used his convoy to smuggle Bello out, with gunshots heard at the scene. The EFCC declared Bello wanted on April 18, 2024. After months of evasion, including a visit to EFCC headquarters with Governor Ododo in September 2024 (where he left without being detained), Bello finally surrendered at EFCC headquarters on November 26, 2024.',
    },
    caseOutcome: { summary: 'Trial ongoing. Bello has pleaded not guilty to all charges. The prosecution is presenting witnesses, with the trial expected to continue through 2026.', status: 'Trial Ongoing' },
    timeline: [
      { date: 'January 27, 2016', event: 'Bello inaugurated as Governor of Kogi State (first term)' },
      { date: '2016-2024', event: 'Eight-year tenure during which alleged financial crimes occurred' },
      { date: 'January 27, 2024', event: 'Leaves office; succeeded by Ahmed Usman Ododo' },
      { date: 'Early 2024', event: 'EFCC Chairman Olukoyede personally invites Bello for interview; Bello refuses' },
      { date: 'March 9, 2024', event: 'EFCC files 19-count charge of N80.2 billion money laundering' },
      { date: 'April 17, 2024', event: 'EFCC operatives barricade Bello\'s Abuja residence; Governor Ododo allegedly smuggles Bello out; gunshots heard' },
      { date: 'April 18, 2024', event: 'EFCC officially declares Yahaya Bello wanted' },
      { date: 'August 20, 2024', event: 'Court of Appeal rules Bello must present himself for arraignment' },
      { date: 'September 18, 2024', event: 'Bello visits EFCC HQ with Governor Ododo; leaves without being detained' },
      { date: 'September 25, 2024', event: 'EFCC files fresh 16-count charge of N110.4 billion at FCT High Court' },
      { date: 'November 26, 2024', event: 'Bello finally surrenders at EFCC headquarters; detained' },
      { date: 'December 13, 2024', event: 'Arraigned before Justice Nwite; pleads not guilty; granted N500 million bail; remanded at Kuje' },
      { date: 'February 2026', event: 'Trial actively ongoing; prosecution witnesses continue testimony' },
    ],
    keyPlayers: {
      accused: [
        { name: 'Yahaya Adoza Bello', role: 'Former Governor of Kogi State (2016-2024)', status: 'On trial; on bail' },
        { name: 'Ali Bello', role: 'Nephew; Chief of Staff to Governor Ododo', status: 'Facing separate N10 billion charge' },
        { name: 'Dauda Suleiman', role: 'Co-defendant in N80.2 billion case', status: 'On trial' },
        { name: 'Abdulsalam Hudu', role: 'Co-defendant', status: 'Still at large' },
        { name: 'Umar Shuaibu Oricha', role: 'Co-defendant in N110.4 billion case (Kogi State official)', status: 'On trial' },
      ],
      prosecution: [
        { name: 'Kemi Pinheiro (SAN)', role: 'Lead prosecution counsel for EFCC' },
        { name: 'Rotimi Oyedepo (SAN)', role: 'EFCC prosecution counsel' },
      ],
      defense: [
        { name: 'Joseph Daudu (SAN)', role: 'Lead defense counsel for Bello; former NBA President', note: 'Argued case is "political, not money laundering"' },
      ],
      judges: [
        { name: 'Justice Emeka Nwite', role: 'Presiding judge, Federal High Court (N80.2 billion case)', rulings: 'Granted N500M bail; rejected passport release twice; rejected EFCC cross-examination request' },
        { name: 'Justice James Omotosho', role: 'Presiding judge, Ali Bello\'s N10 billion case' },
      ],
      efccOfficials: [
        { name: 'Ola Olukoyede', role: 'EFCC Chairman', note: 'Personally invited Bello for interview; revealed $720,000 school fees allegation' },
      ],
      witnesses: [
        { name: 'Gabriel Ochoche (PW8)', role: 'FCMB Compliance Officer', testimony: 'Detailed N46.5 million transfers to AIS; identified N700 million and N400 million inflows' },
      ],
      politicalFigures: [
        { name: 'Ahmed Usman Ododo', role: 'Current Governor of Kogi State; Bello\'s successor', note: 'Accompanied Bello to EFCC HQ; allegedly helped Bello evade arrest' },
      ],
    },
  },

  {
    dir: 'James_Ibori',
    name: 'James Ibori',
    fullName: 'Chief James Onanefe Ibori',
    position: 'Governor of Delta State (1999-2007)',
    party: 'People\'s Democratic Party (PDP)',
    searchTerms: ['James Ibori EFCC', 'Ibori corruption', 'Ibori UK conviction'],
    overview: {
      summary: 'James Ibori is one of the most prominent Nigerian governors convicted of corruption. While acquitted of all charges in Nigeria in 2009 in controversial circumstances, he was subsequently arrested and convicted in the United Kingdom in 2012 on money laundering charges involving approximately £50 million ($79 million) stolen from Delta State. He was sentenced to 13 years in prison by Southwark Crown Court, London.',
      significance: [
        'First Nigerian governor convicted of corruption in a foreign country',
        'UK conviction exposed failure of Nigerian judiciary — acquitted in Nigeria, convicted in UK for same offenses',
        '£50 million laundered through UK banks and properties',
        'Served prison time in UK; returned to Nigeria; remains politically influential',
        'Case highlighted role of London as a hub for laundering African stolen wealth',
      ],
      currentStatus: 'Released from UK prison in 2016 after serving half his sentence. Returned to Nigeria. Remains politically influential in Delta State and PDP politics. EFCC has not re-filed charges in Nigeria.',
    },
    charges: {
      summary: 'Ibori faced charges in both Nigeria and the UK. Acquitted in Nigeria (2009); convicted in the UK (2012).',
      details: [
        { description: '170-count charge by EFCC in Nigeria for corruption and money laundering', year: '2007', outcome: 'Acquitted December 2009 by Justice Marcel Awokulehin in controversial ruling' },
        { description: '10 counts of money laundering and fraud at Southwark Crown Court, London', year: '2012', outcome: 'Pleaded guilty; sentenced to 13 years imprisonment (February 2012)' },
        { description: 'Confiscation order of £117 million issued by UK court', year: '2020' },
      ],
    },
    financial: {
      totalAlleged: '£250 million ($400 million) estimated total stolen; £50 million proven in UK court',
      amounts: [
        { amount: '£50 million', description: 'Amount proven laundered through UK (Southwark Crown Court)', year: '2012' },
        { amount: '£117 million', description: 'Confiscation order issued by UK court', year: '2020' },
      ],
      properties: [
        'Mansion in Hampstead, London (£2.2 million)',
        'Property in Dorset, England',
        'Multiple properties in South Africa',
        'Private jet',
      ],
      sourceOfFunds: 'Delta State treasury during his tenure as governor (1999-2007). Funds laundered through UK banks, properties, and shell companies.',
    },
    courtProceedings: {
      summary: 'Ibori was acquitted in Nigeria in December 2009 by Justice Marcel Awokulehin in a ruling widely criticized as compromised (the judge was later found to have been bribed). He was subsequently arrested in Dubai in 2010, extradited to the UK, and convicted at Southwark Crown Court in 2012.',
      courts: [
        { court: 'Federal High Court, Asaba, Nigeria', role: '170-count EFCC charge', status: 'Acquitted (December 2009) — judge later found to have been bribed' },
        { court: 'Southwark Crown Court, London', role: '10 counts of money laundering and fraud', status: 'Convicted; sentenced to 13 years (February 2012)' },
      ],
    },
    arrestInvestigation: {
      summary: 'The EFCC investigated Ibori after he left office in 2007 and filed 170 counts. When he was controversially acquitted in Nigeria in 2009, UK\'s Metropolitan Police continued their investigation. Ibori fled to Dubai in 2010 and was arrested there by Interpol, then extradited to the UK to face charges.',
    },
    caseOutcome: { summary: 'Convicted in the UK; sentenced to 13 years; served until 2016. Acquitted controversially in Nigeria. Released and returned to Nigeria; remains politically active.', status: 'Convicted (UK) / Acquitted (Nigeria)' },
    timeline: [
      { date: '1999-2007', event: 'Governor of Delta State; alleged massive looting' },
      { date: '2007', event: 'EFCC files 170-count charge' },
      { date: 'December 2009', event: 'Acquitted by Justice Marcel Awokulehin in Nigeria (judge later found compromised)' },
      { date: '2010', event: 'Flees to Dubai; arrested by Interpol' },
      { date: '2011', event: 'Extradited to the United Kingdom' },
      { date: 'February 2012', event: 'Pleads guilty; sentenced to 13 years at Southwark Crown Court' },
      { date: '2016', event: 'Released from UK prison after serving half his sentence' },
      { date: '2017', event: 'Returns to Nigeria; receives hero\'s welcome in Delta State' },
      { date: '2020', event: 'UK court issues £117 million confiscation order' },
    ],
    keyPlayers: {
      accused: [{ name: 'James Ibori', role: 'Former Governor of Delta State', status: 'Convicted in UK (released 2016); acquitted in Nigeria' }],
      associates: [
        { name: 'Bhadresh Gohil', role: 'Ibori\'s London-based solicitor', note: 'Convicted of money laundering' },
        { name: 'Theresa Daniel', role: 'Ibori\'s mistress', note: 'Convicted of money laundering' },
        { name: 'Christine Ibori-Ibie', role: 'Ibori\'s sister', note: 'Convicted of money laundering' },
      ],
      investigators: [
        { name: 'Metropolitan Police, London', role: 'Led UK investigation', note: '' },
        { name: 'EFCC', role: 'Nigerian investigation', note: 'Case undermined by compromised judge' },
      ],
    },
  },

  {
    dir: 'Diezani_Alison-Madueke',
    name: 'Diezani Alison-Madueke',
    fullName: 'Diezani K. Alison-Madueke',
    position: 'Minister of Petroleum Resources (2010-2015)',
    birthDeath: 'Born December 6, 1960',
    party: 'People\'s Democratic Party (PDP)',
    searchTerms: ['Diezani EFCC', 'Diezani corruption', 'Diezani Alison-Madueke fraud', 'Diezani money laundering', 'Diezani UK arrest'],
    overview: {
      summary: 'Diezani Alison-Madueke is at the center of one of the largest corruption scandals in Nigerian history. She is accused of orchestrating a massive scheme of bribery, money laundering, and abuse of office during her tenure as Minister of Petroleum Resources. The allegations involve steering lucrative oil and gas contracts to favored Nigerian businessmen — principally Kolawole Akanni Aluko and Olajide Omokore — in exchange for lavish bribes including cash, luxury goods, property refurbishments, private jet flights, and school fees. Total amount alleged across all jurisdictions exceeds $2.5 billion.',
      significance: [
        'Over $2.5 billion in total alleged corruption — one of the largest in African history',
        'First female President of OPEC (2014)',
        'Multi-jurisdictional case: Nigeria, UK, US, UAE',
        '$153.3 million diverted from government accounts',
        '$40 million in jewelry seized; over 80 properties worth ~$80 million recovered',
        'UK trial commenced January 2026 at Southwark Crown Court',
      ],
      currentStatus: 'Standing trial at Southwark Crown Court in London on six counts of bribery. Trial commenced January 26, 2026; expected to run 10-12 weeks. Has pleaded not guilty. On bail in the UK since October 2015.',
    },
    charges: {
      summary: 'Faces charges in Nigeria (13-count money laundering, filed in absentia) and the UK (6 counts of bribery at Southwark Crown Court). US DOJ pursued civil forfeiture of $144 million.',
      details: [
        { description: '13-count money laundering charges filed by EFCC in absentia', year: '2018' },
        { description: '6 counts of bribery at Southwark Crown Court, London — conspiracy with Aluko and Omokore', year: '2023', arraignment: 'Charged August 2023; trial commenced January 26, 2026' },
        { description: 'US DOJ civil forfeiture complaint for $144 million in corruption proceeds', year: '2017' },
      ],
    },
    financial: {
      totalAlleged: 'Over $2.5 billion across all jurisdictions',
      amounts: [
        { amount: '$153.3 million', description: 'Diverted from government agency accounts (recovered by EFCC)', year: '' },
        { amount: '$40 million', description: 'Jewelry seized from Abuja residence', year: '' },
        { amount: '$80 million', description: 'Over 80 properties recovered', year: '' },
        { amount: '$144 million', description: 'US-based assets targeted by DOJ forfeiture', year: '2017' },
        { amount: '$672 million + GBP 11 million', description: 'Total sleaze exposed at UK trial', year: '2026' },
        { amount: '$80 million', description: 'Yacht (Galactica Star) linked to corruption scheme', year: '' },
        { amount: 'GBP 100,000', description: 'Cash bribe', year: '' },
      ],
      properties: [
        'Over 80 properties in Nigeria worth approximately $80 million',
        '$50 million condominium at One57, Manhattan, New York',
        'Luxury real estate in California and New York',
        '$80 million yacht — MV Galactica Star',
      ],
      sourceOfFunds: 'Bribes from Kolawole Aluko and Olajide Omokore in exchange for steering NNPC/NPDC oil contracts (Strategic Alliance Agreements for OMLs 26, 30, 42, 60, 62, and 63). Also diverted funds from government agency accounts.',
    },
    courtProceedings: {
      summary: 'Currently on trial at Southwark Crown Court, London (commenced January 2026). EFCC charges pending in Nigeria. US DOJ civil forfeiture proceedings.',
      courts: [
        { court: 'Southwark Crown Court, London', role: '6 counts of bribery', status: 'Trial commenced January 26, 2026; ongoing' },
        { court: 'Federal High Court, Nigeria', role: '13-count money laundering charge (filed in absentia)', status: 'Pending — Diezani remains in UK' },
        { court: 'US District Court', role: 'DOJ civil forfeiture of $144 million in assets', status: 'Proceedings ongoing' },
      ],
    },
    arrestInvestigation: {
      summary: 'Arrested by the UK\'s National Crime Agency (NCA) in London on October 2, 2015, alongside four others. Released on bail. EFCC pursued investigations in Nigeria, recovering $153.3 million, $40 million in jewelry, and over 80 properties. October 2022: Nigerian court issued arrest warrant. NCA formally charged her with bribery in August 2023.',
    },
    caseOutcome: { summary: 'Currently on trial in the UK. Has pleaded not guilty. EFCC has recovered significant assets in Nigeria. US DOJ forfeiture proceedings ongoing. No conviction yet.', status: 'Trial Ongoing (UK)' },
    timeline: [
      { date: '2010-2015', event: 'Serves as Minister of Petroleum Resources under President Jonathan' },
      { date: '2014', event: 'Becomes first female President of OPEC' },
      { date: 'May 2015', event: 'Leaves office as Jonathan\'s government ends' },
      { date: 'October 2, 2015', event: 'Arrested by UK\'s National Crime Agency in London; released on bail' },
      { date: '2017', event: 'US DOJ files civil forfeiture complaint for $144 million' },
      { date: '2018', event: 'EFCC files 13-count money laundering charges in absentia' },
      { date: '2021', event: 'Court of Appeal upholds final forfeiture of $40 million in jewelry' },
      { date: 'October 2022', event: 'Nigerian court issues arrest warrant' },
      { date: 'August 2023', event: 'NCA formally charges her with 6 counts of bribery' },
      { date: 'January 26, 2026', event: 'Trial commences at Southwark Crown Court, London' },
    ],
    keyPlayers: {
      accused: [
        { name: 'Diezani Alison-Madueke', role: 'Former Minister of Petroleum Resources', status: 'On trial in UK; charges pending in Nigeria' },
        { name: 'Doye Agama', role: 'Her brother', status: 'Charged with bribery (UK)' },
        { name: 'Olatimbo Ayinde', role: 'Associate', status: 'Charged (UK)' },
      ],
      associates: [
        { name: 'Kolawole Akanni Aluko', role: 'Oil magnate (Atlantic Energy)', note: 'Allegedly paid bribes in exchange for oil contracts' },
        { name: 'Olajide Omokore', role: 'Oil magnate (Septa Energy)', note: 'Allegedly paid bribes in exchange for oil contracts' },
      ],
      investigators: [
        { name: 'UK National Crime Agency (NCA)', role: 'Investigation and prosecution', note: '' },
        { name: 'EFCC', role: 'Nigerian investigation and asset recovery', note: 'Recovered $153.3M, $40M jewelry, 80+ properties' },
        { name: 'US Department of Justice', role: 'Civil forfeiture proceedings', note: '$144M in assets targeted' },
      ],
    },
  },

  // ── Remaining officials with basic metadata (expanded by article extraction) ──

  {
    dir: 'Diepreye_Alamieyeseigha', name: 'Diepreye Alamieyeseigha', position: 'Governor of Bayelsa State (1999-2005)', party: 'PDP',
    searchTerms: ['Alamieyeseigha corruption', 'Alamieyeseigha EFCC', 'Alamieyeseigha pardon'],
    overview: { summary: 'Diepreye Alamieyeseigha was impeached as Governor of Bayelsa State in 2005 after being arrested in London on money laundering charges. He jumped bail in the UK by allegedly disguising himself as a woman and fleeing back to Nigeria. He was convicted in Nigeria in 2007 but controversially pardoned by President Goodluck Jonathan in 2013.', significance: ['First sitting governor arrested abroad for money laundering', 'Jumped UK bail disguised as a woman', 'Convicted in Nigeria (2007) but pardoned by Jonathan (2013)'], currentStatus: 'Deceased (died October 10, 2015). Was pardoned by President Jonathan in 2013.' },
    charges: { summary: 'Charged with money laundering in the UK and Nigeria. Convicted in Nigeria of 6 counts.', details: [{ description: 'Money laundering charges in UK (Southwark Crown Court)', year: '2005' }, { description: '40-count money laundering charge by EFCC; convicted on 6 counts', year: '2005-2007' }] },
    financial: { totalAlleged: '£1.8 million found in London home; multiple properties in London, South Africa, and Nigeria', amounts: [{ amount: '£1.8 million', description: 'Cash found in London home', year: '2005' }, { amount: '£10 million+', description: 'Estimated assets including London properties', year: '' }], sourceOfFunds: 'Bayelsa State treasury' },
    courtProceedings: { summary: 'Tried and convicted in Nigeria; UK proceedings abandoned after he fled.', courts: [{ court: 'Federal High Court, Lagos', role: 'EFCC 40-count charge; convicted on 6 counts', status: 'Convicted July 2007' }] },
    arrestInvestigation: { summary: 'Arrested in London in September 2005 by Metropolitan Police after £1.8 million in cash was found in his London home. Jumped bail by allegedly disguising himself as a woman. Returned to Nigeria where he was impeached and later prosecuted by EFCC.' },
    caseOutcome: { summary: 'Convicted in Nigeria (2007); sentenced to 2 years imprisonment with option of fine. Controversially pardoned by President Jonathan in March 2013. Died October 10, 2015.', status: 'Convicted / Pardoned' },
    timeline: [{ date: '1999-2005', event: 'Governor of Bayelsa State' }, { date: 'September 2005', event: 'Arrested in London; £1.8M cash found' }, { date: 'November 2005', event: 'Jumps UK bail; returns to Nigeria disguised as woman' }, { date: 'December 2005', event: 'Impeached as Governor' }, { date: 'July 2007', event: 'Convicted on 6 counts of money laundering' }, { date: 'March 2013', event: 'Pardoned by President Jonathan' }, { date: 'October 2015', event: 'Dies in Yenagoa, Bayelsa State' }],
    keyPlayers: { accused: [{ name: 'Diepreye Alamieyeseigha', role: 'Former Governor of Bayelsa', status: 'Convicted, pardoned, deceased' }], associates: [], investigators: [] },
  },

  { dir: 'Joshua_Dariye', name: 'Joshua Dariye', position: 'Governor of Plateau State (1999-2007)', party: 'PDP', searchTerms: ['Joshua Dariye EFCC', 'Dariye corruption', 'Dariye conviction'], overview: { summary: 'Joshua Dariye was convicted of criminal breach of trust involving N1.162 billion and sentenced to 14 years (reduced to 10 years on appeal). He was pardoned by President Buhari in 2022.', significance: ['Convicted and sentenced to 14 years (later 10 years)', 'Pardoned by President Buhari in 2022'], currentStatus: 'Pardoned by President Buhari in April 2022. Released from prison.' }, charges: { summary: 'Convicted of criminal breach of trust involving N1.162 billion.', details: [{ description: '23-count charge of criminal breach of trust and money laundering involving N1.162 billion', year: '2007' }] }, financial: { totalAlleged: 'N1.162 billion', amounts: [{ amount: 'N1.162 billion', description: 'Criminal breach of trust of Plateau State funds', year: '' }], sourceOfFunds: 'Plateau State ecological funds' }, courtProceedings: { summary: 'Convicted by High Court of the FCT; sentence reduced on appeal; pardoned.', courts: [{ court: 'High Court of the FCT', role: 'Criminal breach of trust', status: 'Convicted 2018; sentence reduced to 10 years on appeal' }] }, arrestInvestigation: { summary: 'Arrested in London in 2004 with £90,000 in cash. Jumped bail in the UK. Impeached as Governor in 2006 but reinstated by court. Later prosecuted by EFCC in Nigeria.' }, caseOutcome: { summary: 'Convicted; sentenced to 14 years (reduced to 10 on appeal). Pardoned by President Buhari in April 2022.', status: 'Convicted / Pardoned' }, timeline: [{ date: '2004', event: 'Arrested in London with £90,000 cash' }, { date: '2006', event: 'Impeached; reinstated by court' }, { date: '2018', event: 'Convicted; sentenced to 14 years' }, { date: '2019', event: 'Sentence reduced to 10 years on appeal' }, { date: 'April 2022', event: 'Pardoned by President Buhari' }], keyPlayers: { accused: [{ name: 'Joshua Dariye', role: 'Former Governor of Plateau State', status: 'Convicted, pardoned' }], associates: [], investigators: [] } },

  { dir: 'Jolly_Nyame', name: 'Jolly Nyame', position: 'Governor of Taraba State (1999-2007)', party: 'PDP', searchTerms: ['Jolly Nyame EFCC', 'Nyame corruption', 'Nyame conviction'], overview: { summary: 'Jolly Nyame was convicted of criminal breach of trust involving N1.64 billion in Taraba State funds and sentenced to 14 years imprisonment. He was pardoned by President Buhari in 2022 alongside Joshua Dariye.', significance: ['Convicted and sentenced to 14 years', 'Pardoned by President Buhari alongside Dariye in 2022'], currentStatus: 'Pardoned by President Buhari in April 2022.' }, charges: { summary: 'Convicted of criminal breach of trust involving N1.64 billion.', details: [{ description: '41-count charge of criminal breach of trust involving N1.64 billion', year: '2007' }] }, financial: { totalAlleged: 'N1.64 billion', amounts: [{ amount: 'N1.64 billion', description: 'Criminal breach of trust of Taraba State funds', year: '' }], sourceOfFunds: 'Taraba State treasury' }, courtProceedings: { summary: 'Convicted in 2018; sentenced to 14 years; pardoned 2022.', courts: [{ court: 'High Court of the FCT', role: 'Criminal breach of trust', status: 'Convicted 2018' }] }, arrestInvestigation: { summary: 'Investigated and charged by EFCC after leaving office.' }, caseOutcome: { summary: 'Convicted; sentenced to 14 years. Pardoned by President Buhari in April 2022.', status: 'Convicted / Pardoned' }, timeline: [{ date: '1999-2007', event: 'Governor of Taraba State' }, { date: '2007', event: 'Charged by EFCC' }, { date: '2018', event: 'Convicted; sentenced to 14 years' }, { date: 'April 2022', event: 'Pardoned by President Buhari' }], keyPlayers: { accused: [{ name: 'Jolly Nyame', role: 'Former Governor of Taraba State', status: 'Convicted, pardoned' }], associates: [], investigators: [] } },

  { dir: 'Orji_Uzor_Kalu', name: 'Orji Uzor Kalu', position: 'Governor of Abia State (1999-2007)', party: 'APC (formerly PPA/PDP)', searchTerms: ['Orji Kalu EFCC', 'Orji Kalu corruption', 'Orji Kalu conviction'], overview: { summary: 'Orji Uzor Kalu was convicted of fraud involving N7.65 billion and sentenced to 12 years imprisonment in December 2019. His conviction was overturned by the Supreme Court in May 2020 on a technicality (the trial judge had been elevated to the Court of Appeal before delivering the verdict). A retrial was ordered but has not progressed significantly.', significance: ['Convicted of N7.65 billion fraud (2019)', 'Supreme Court quashed conviction on technicality (2020)', 'Retrial ordered but stalled', 'Currently serves as Chief Whip of the Senate'], currentStatus: 'Retrial ordered by Supreme Court. Currently serving as Chief Whip of the Senate (APC).' }, charges: { summary: 'Charged with N7.65 billion fraud; convicted 2019; conviction quashed by Supreme Court 2020.', details: [{ description: '39-count charge of N7.65 billion fraud involving Abia State funds through Slok Nigeria Limited', year: '2007' }] }, financial: { totalAlleged: 'N7.65 billion', amounts: [{ amount: 'N7.65 billion', description: 'Fraud involving Abia State funds channeled through Slok Nigeria Limited', year: '' }], sourceOfFunds: 'Abia State treasury, laundered through Slok Nigeria Limited (Kalu\'s company)' }, courtProceedings: { summary: 'Convicted December 2019; conviction quashed by Supreme Court May 2020 on technicality.', courts: [{ court: 'Federal High Court, Lagos', role: 'N7.65 billion fraud trial', status: 'Convicted 2019; quashed by Supreme Court 2020; retrial ordered' }] }, arrestInvestigation: { summary: 'Charged by EFCC in 2007 after leaving office.' }, caseOutcome: { summary: 'Convicted in 2019; sentence overturned by Supreme Court in 2020 on technicality. Retrial ordered but has not progressed.', status: 'Conviction Overturned / Retrial Pending' }, timeline: [{ date: '1999-2007', event: 'Governor of Abia State' }, { date: '2007', event: 'EFCC files 39-count charge' }, { date: 'December 2019', event: 'Convicted; sentenced to 12 years' }, { date: 'May 2020', event: 'Supreme Court quashes conviction; orders retrial' }], keyPlayers: { accused: [{ name: 'Orji Uzor Kalu', role: 'Former Governor / Senate Chief Whip', status: 'Conviction overturned; retrial pending' }], associates: [{ name: 'Slok Nigeria Limited', role: 'Company used to launder state funds', note: 'Also convicted' }], investigators: [] } },

  { dir: 'Sambo_Dasuki', name: 'Sambo Dasuki', position: 'National Security Adviser (2012-2015)', party: 'PDP-linked', searchTerms: ['Sambo Dasuki EFCC', 'Dasuki arms deal', 'Dasukigate', 'Dasuki corruption'], overview: { summary: 'Colonel Sambo Dasuki (rtd) is at the center of the $2.1 billion arms procurement scandal ("Dasukigate"), where funds allocated for purchasing weapons to fight Boko Haram were allegedly diverted to political campaigns and personal use. The case became a cause célèbre for rule of law when Dasuki was detained for over four years despite multiple court orders granting him bail.', significance: ['$2.1 billion arms procurement fraud ("Dasukigate")', 'Funds meant to fight Boko Haram diverted to political campaigns', 'Detained 4+ years despite multiple court bail orders', 'Released in 2019 under controversial circumstances'], currentStatus: 'Released from detention in December 2019. Trial ongoing but proceedings have stalled.' }, charges: { summary: 'Charged with diversion of $2.1 billion in arms procurement funds.', details: [{ description: 'Charges of money laundering and criminal breach of trust involving $2.1 billion arms procurement funds', year: '2015' }] }, financial: { totalAlleged: '$2.1 billion', amounts: [{ amount: '$2.1 billion', description: 'Arms procurement funds allegedly diverted', year: '2012-2015' }], sourceOfFunds: 'Office of the National Security Adviser — funds meant for weapons procurement to fight Boko Haram' }, courtProceedings: { summary: 'Multiple charges filed. Granted bail multiple times but detained for over 4 years in violation of court orders.', courts: [] }, arrestInvestigation: { summary: 'Arrested by DSS in December 2015 on orders of President Buhari. Detained for over four years despite multiple court orders granting bail. Released in December 2019.' }, caseOutcome: { summary: 'Released from detention December 2019. Trial technically ongoing but proceedings have stalled.', status: 'Trial Ongoing / Released on Bail' }, timeline: [{ date: '2012-2015', event: 'National Security Adviser; alleged diversion of $2.1 billion in arms funds' }, { date: 'December 2015', event: 'Arrested by DSS' }, { date: '2015-2019', event: 'Detained over 4 years despite court-ordered bail' }, { date: 'December 2019', event: 'Released from detention' }], keyPlayers: { accused: [{ name: 'Sambo Dasuki', role: 'Former National Security Adviser', status: 'Released; trial ongoing' }], associates: [], investigators: [] } },

  { dir: 'Abdulrasheed_Maina', name: 'Abdulrasheed Maina', position: 'Chairman of Pension Reform Task Team', searchTerms: ['Abdulrasheed Maina EFCC', 'Maina pension fraud', 'Maina corruption'], overview: { summary: 'Abdulrasheed Maina was convicted of money laundering involving pension funds estimated at N2 billion. He was sentenced to 8 years imprisonment in November 2021. Maina had fled Nigeria in 2013, was controversially reinstated in the civil service in 2017, and later re-arrested.', significance: ['Convicted of N2 billion pension fraud', 'Fled Nigeria; was controversially reinstated in civil service', 'Sentenced to 8 years imprisonment'], currentStatus: 'Serving 8-year prison sentence (convicted November 2021).' }, charges: { summary: 'Convicted of money laundering involving N2 billion in pension funds.', details: [{ description: '12-count charge of money laundering involving N2 billion in pension funds', year: '2019' }] }, financial: { totalAlleged: 'N2 billion', amounts: [{ amount: 'N2 billion', description: 'Pension funds laundered', year: '' }], sourceOfFunds: 'Police pension funds' }, courtProceedings: { summary: 'Convicted November 2021; sentenced to 8 years.', courts: [{ court: 'Federal High Court, Abuja', role: 'Money laundering trial', status: 'Convicted November 2021' }] }, arrestInvestigation: { summary: 'Fled Nigeria in 2013 after pension fraud allegations. Controversially reinstated in civil service 2017. Fled again; arrested in Niger Republic September 2020; extradited to Nigeria.' }, caseOutcome: { summary: 'Convicted; sentenced to 8 years imprisonment.', status: 'Convicted / Serving Sentence' }, timeline: [{ date: '2013', event: 'Flees Nigeria after pension fraud allegations' }, { date: '2017', event: 'Controversially reinstated in civil service' }, { date: '2019', event: 'Re-arrested; charged with 12 counts of money laundering' }, { date: 'September 2020', event: 'Arrested in Niger Republic; extradited' }, { date: 'November 2021', event: 'Convicted; sentenced to 8 years' }], keyPlayers: { accused: [{ name: 'Abdulrasheed Maina', role: 'Former Pension Task Team Chairman', status: 'Convicted; serving sentence' }], associates: [{ name: 'Faisal Maina', role: 'Son of Maina', note: 'Also convicted of money laundering' }], investigators: [] } },

  { dir: 'Tafa_Balogun', name: 'Tafa Balogun', position: 'Inspector General of Police (2002-2005)', searchTerms: ['Tafa Balogun EFCC', 'Tafa Balogun corruption', 'Tafa Balogun conviction'], overview: { summary: 'Tafa Balogun was the first Inspector General of Police to be convicted of corruption in Nigeria. He was charged with laundering N17.7 billion and pleaded guilty to 8 counts in a plea bargain, forfeiting assets worth about N10 billion. He was sentenced to only 6 months imprisonment and a N500,000 fine, which was widely criticized as too lenient.', significance: ['First IGP convicted of corruption in Nigeria', 'N17.7 billion money laundering charge', 'Plea bargain resulted in just 6 months and N500,000 fine — widely criticized', 'Set precedent for prosecution of top security officials'], currentStatus: 'Deceased (died August 4, 2022). Had completed his sentence decades earlier.' }, charges: { summary: 'Charged with N17.7 billion money laundering; pleaded guilty to 8 counts.', details: [{ description: '70-count charge of money laundering involving N17.7 billion', year: '2005', outcome: 'Pleaded guilty to 8 counts under plea bargain' }] }, financial: { totalAlleged: 'N17.7 billion', amounts: [{ amount: 'N17.7 billion', description: 'Money laundering charge', year: '2005' }, { amount: '~N10 billion', description: 'Assets forfeited under plea bargain', year: '2005' }], sourceOfFunds: 'Alleged proceeds of corruption during tenure as IGP' }, courtProceedings: { summary: 'Pleaded guilty to 8 counts; sentenced to 6 months and N500,000 fine.', courts: [{ court: 'Federal High Court, Abuja', role: 'Money laundering trial', status: 'Convicted 2005 (plea bargain)' }] }, arrestInvestigation: { summary: 'Arrested in 2005 after being removed as IGP by President Obasanjo. EFCC investigation revealed massive assets inconsistent with his lawful income.' }, caseOutcome: { summary: 'Convicted under plea bargain; 6 months imprisonment and N500,000 fine; forfeited ~N10 billion in assets.', status: 'Convicted (Plea Bargain) / Deceased' }, timeline: [{ date: '2002-2005', event: 'Serves as Inspector General of Police' }, { date: '2005', event: 'Removed by Obasanjo; arrested and charged by EFCC' }, { date: '2005', event: 'Pleads guilty to 8 counts; sentenced to 6 months' }, { date: 'August 2022', event: 'Dies' }], keyPlayers: { accused: [{ name: 'Tafa Balogun', role: 'Former IGP', status: 'Convicted (deceased)' }], associates: [], investigators: [] } },

  { dir: 'Walter_Onnoghen', name: 'Walter Onnoghen', position: 'Chief Justice of Nigeria', searchTerms: ['Walter Onnoghen corruption', 'Onnoghen CCT', 'Onnoghen asset declaration'], overview: { summary: 'Walter Onnoghen was controversially removed as Chief Justice of Nigeria in January 2019 by President Buhari based on a Code of Conduct Tribunal ruling that he failed to declare assets. He was convicted by the CCT and banned from holding public office for 10 years. Critics alleged the removal was politically motivated to install a more compliant CJN before the 2019 elections.', significance: ['First CJN removed via CCT ruling', 'Controversy over political motivation — removed weeks before 2019 elections', 'Convicted of false asset declaration'], currentStatus: 'Convicted by CCT. Banned from public office for 10 years. Retired from judiciary.' }, charges: { summary: 'Convicted of false asset declaration by Code of Conduct Tribunal.', details: [{ description: 'False asset declaration — failure to declare domiciliary accounts', year: '2019' }] }, financial: { totalAlleged: 'No large-scale corruption alleged; case centered on failure to declare bank accounts', amounts: [], sourceOfFunds: '' }, courtProceedings: { summary: 'Convicted by Code of Conduct Tribunal in April 2019.', courts: [{ court: 'Code of Conduct Tribunal', role: 'False asset declaration', status: 'Convicted April 2019' }] }, arrestInvestigation: { summary: 'Petition filed at CCT alleging failure to declare assets. President Buhari suspended Onnoghen in January 2019 based on ex parte CCT order — a move widely condemned as unconstitutional.' }, caseOutcome: { summary: 'Convicted of false asset declaration; removed from office; banned from public office for 10 years.', status: 'Convicted / Removed from Office' }, timeline: [{ date: 'January 2019', event: 'Suspended as CJN by President Buhari based on CCT order' }, { date: 'April 2019', event: 'Convicted by CCT; banned from public office for 10 years' }], keyPlayers: { accused: [{ name: 'Walter Onnoghen', role: 'Former Chief Justice of Nigeria', status: 'Convicted' }], associates: [], investigators: [] } },

  { dir: 'Ibrahim_Magu', name: 'Ibrahim Magu', position: 'Acting Chairman of EFCC (2015-2020)', searchTerms: ['Ibrahim Magu corruption', 'Magu EFCC probe', 'Magu investigation'], overview: { summary: 'Ibrahim Magu served as Acting Chairman of the EFCC under President Buhari but was himself investigated by a presidential panel led by Justice Ayo Salami. The panel found him culpable on various grounds including insubordination and re-looting of recovered assets. He was removed from office in July 2020 but has not been formally charged.', significance: ['EFCC acting chairman himself investigated for corruption', 'Removed by presidential panel in 2020', 'Senate twice refused to confirm his appointment as substantive chairman'], currentStatus: 'Removed from EFCC leadership. Not formally charged. Returned to police service.' }, charges: { summary: 'No formal charges filed. A presidential panel found him culpable on various grounds.', details: [] }, financial: { totalAlleged: 'Not specified; allegations centered on re-looting of recovered assets', amounts: [], sourceOfFunds: '' }, courtProceedings: { summary: 'Presidential panel (Justice Ayo Salami) investigated and found him culpable.', courts: [] }, arrestInvestigation: { summary: 'Arrested and detained by DSS in July 2020. Investigated by presidential panel. Released; not formally charged.' }, caseOutcome: { summary: 'Removed from office. Not formally prosecuted.', status: 'Removed / No Charges' }, timeline: [{ date: '2015-2020', event: 'Acting Chairman of EFCC' }, { date: 'July 2020', event: 'Arrested and investigated by presidential panel' }, { date: '2020', event: 'Removed from EFCC; returned to police service' }], keyPlayers: { accused: [{ name: 'Ibrahim Magu', role: 'Former Acting EFCC Chairman', status: 'Removed; not charged' }], associates: [], investigators: [{ name: 'Justice Ayo Salami', role: 'Presidential panel chairman', note: '' }] } },

  { dir: 'Godwin_Emefiele', name: 'Godwin Emefiele', position: 'Governor of Central Bank of Nigeria (2014-2023)', searchTerms: ['Emefiele EFCC', 'Emefiele corruption', 'Emefiele arrest'], overview: { summary: 'Godwin Emefiele was arrested by the DSS in June 2023 shortly after being removed as CBN Governor. He faces charges of money laundering and firearms possession. The EFCC has charged him with N18.9 billion fraud.', significance: ['CBN Governor arrested immediately after leaving office', 'Charged with N18.9 billion fraud', 'Controversial naira redesign and cashless policies'], currentStatus: 'On trial for N18.9 billion fraud. Released on bail.' }, charges: { summary: 'Charged with N18.9 billion fraud and money laundering.', details: [{ description: '20-count charge of N18.9 billion fraud and money laundering by EFCC', year: '2023' }] }, financial: { totalAlleged: 'N18.9 billion', amounts: [{ amount: 'N18.9 billion', description: 'Fraud and money laundering', year: '' }], sourceOfFunds: 'CBN funds allegedly diverted' }, courtProceedings: { summary: 'Trial ongoing.', courts: [{ court: 'Federal High Court, Lagos', role: 'N18.9 billion fraud trial', status: 'Ongoing' }] }, arrestInvestigation: { summary: 'Arrested by DSS on June 10, 2023. Subsequently charged by EFCC.' }, caseOutcome: { summary: 'Trial ongoing. On bail.', status: 'Trial Ongoing' }, timeline: [{ date: '2014-2023', event: 'CBN Governor' }, { date: 'June 2023', event: 'Arrested by DSS' }, { date: '2023', event: 'Charged by EFCC with N18.9 billion fraud' }], keyPlayers: { accused: [{ name: 'Godwin Emefiele', role: 'Former CBN Governor', status: 'On trial' }], associates: [], investigators: [] } },

  { dir: 'Ahmed_Idris', name: 'Ahmed Idris', position: 'Accountant General of the Federation', searchTerms: ['Ahmed Idris EFCC', 'Ahmed Idris corruption', 'Accountant General fraud'], overview: { summary: 'Ahmed Idris was arrested by the EFCC in May 2022 for allegedly stealing N109 billion from government coffers during his tenure as Accountant General of the Federation. He is facing trial.', significance: ['Accountant General arrested for N109 billion fraud', 'One of the largest single fraud cases against a civil servant'], currentStatus: 'On trial for N109 billion fraud.' }, charges: { summary: 'Charged with N109 billion fraud.', details: [{ description: '14-count charge of N109 billion money laundering by EFCC', year: '2022' }] }, financial: { totalAlleged: 'N109 billion', amounts: [{ amount: 'N109 billion', description: 'Fraud during tenure as Accountant General', year: '' }], sourceOfFunds: 'Federal Government treasury' }, courtProceedings: { summary: 'Trial ongoing.', courts: [{ court: 'Federal High Court, Abuja', role: 'N109 billion fraud trial', status: 'Ongoing' }] }, arrestInvestigation: { summary: 'Arrested by EFCC in May 2022.' }, caseOutcome: { summary: 'Trial ongoing.', status: 'Trial Ongoing' }, timeline: [{ date: 'May 2022', event: 'Arrested by EFCC' }, { date: '2022', event: 'Charged with N109 billion fraud' }], keyPlayers: { accused: [{ name: 'Ahmed Idris', role: 'Former Accountant General', status: 'On trial' }], associates: [], investigators: [] } },

  { dir: 'Abdullahi_Ganduje', name: 'Abdullahi Ganduje', position: 'Governor of Kano State (2015-2023) / APC Chairman', searchTerms: ['Ganduje EFCC', 'Ganduje bribery', 'Ganduje dollar video'], overview: { summary: 'Abdullahi Ganduje was captured on video allegedly receiving bundles of US dollar bribes from a contractor in 2018. Despite the video evidence, he was not prosecuted while in office due to gubernatorial immunity. After leaving office, the EFCC arrested him in June 2024 on corruption charges.', significance: ['Video evidence of alleged dollar bribery went viral', 'Not prosecuted while governor due to immunity', 'Arrested by EFCC after leaving office'], currentStatus: 'Arrested by EFCC in June 2024. Facing corruption charges.' }, charges: { summary: 'Charged with corruption based on bribery allegations.', details: [{ description: 'Corruption charges related to dollar bribery scandal', year: '2024' }] }, financial: { totalAlleged: '$5 million (estimated total bribes in video evidence)', amounts: [], sourceOfFunds: 'Bribes from contractors' }, courtProceedings: { summary: 'Charged in 2024 after leaving office.', courts: [] }, arrestInvestigation: { summary: 'Video evidence surfaced in 2018 showing Ganduje allegedly receiving dollar bribes. KSHA set up panel; Ganduje claimed videos were doctored. Arrested by EFCC after leaving office in June 2024.' }, caseOutcome: { summary: 'Trial ongoing.', status: 'Trial Ongoing' }, timeline: [{ date: '2018', event: 'Bribery video goes viral' }, { date: '2023', event: 'Leaves office as Governor' }, { date: 'June 2024', event: 'Arrested by EFCC' }], keyPlayers: { accused: [{ name: 'Abdullahi Ganduje', role: 'Former Governor / APC Chairman', status: 'On trial' }], associates: [], investigators: [] } },

  { dir: 'Bello_Matawalle', name: 'Bello Matawalle', position: 'Governor of Zamfara State (2019-2023)', searchTerms: ['Matawalle EFCC', 'Matawalle corruption', 'Matawalle arrest'], overview: { summary: 'Bello Matawalle, former Governor of Zamfara State and Minister of State for Defence, was arrested by the DSS in August 2024 on allegations of financial crimes and links to banditry. He faces charges related to corruption during his tenure as governor.', significance: ['Arrested over alleged financial crimes and banditry links', 'Former Defence Minister arrested by DSS'], currentStatus: 'Arrested August 2024. Facing charges.' }, charges: { summary: 'Facing charges related to financial crimes during his tenure as governor.', details: [] }, financial: { totalAlleged: 'Not yet fully specified', amounts: [], sourceOfFunds: 'Zamfara State treasury' }, courtProceedings: { summary: 'Proceedings initiated.', courts: [] }, arrestInvestigation: { summary: 'Arrested by DSS in August 2024.' }, caseOutcome: { summary: 'Case in early stages.', status: 'Under Investigation' }, timeline: [{ date: '2019-2023', event: 'Governor of Zamfara State' }, { date: 'August 2024', event: 'Arrested by DSS' }], keyPlayers: { accused: [{ name: 'Bello Matawalle', role: 'Former Governor / Former Minister of Defence', status: 'Arrested' }], associates: [], investigators: [] } },

  { dir: 'Willie_Obiano', name: 'Willie Obiano', position: 'Governor of Anambra State (2014-2022)', searchTerms: ['Willie Obiano EFCC', 'Obiano corruption', 'Obiano arrest'], overview: { summary: 'Willie Obiano was arrested by the EFCC at Lagos airport on March 17, 2022, just hours after handing over as Governor of Anambra State. He is accused of money laundering and faces charges.', significance: ['Arrested hours after leaving office — EFCC was waiting at airport', 'Charged with money laundering'], currentStatus: 'On trial for money laundering. Released on bail.' }, charges: { summary: 'Charged with money laundering.', details: [{ description: 'Money laundering charges by EFCC', year: '2022' }] }, financial: { totalAlleged: 'Not fully specified', amounts: [], sourceOfFunds: '' }, courtProceedings: { summary: 'Trial ongoing.', courts: [] }, arrestInvestigation: { summary: 'Arrested at Lagos airport on March 17, 2022, hours after handing over to his successor.' }, caseOutcome: { summary: 'On trial.', status: 'Trial Ongoing' }, timeline: [{ date: 'March 17, 2022', event: 'Arrested at Lagos airport hours after leaving office' }], keyPlayers: { accused: [{ name: 'Willie Obiano', role: 'Former Governor of Anambra', status: 'On trial' }], associates: [], investigators: [] } },

  { dir: 'Bukola_Saraki', name: 'Bukola Saraki', position: 'Senate President (2015-2019) / Governor of Kwara State', party: 'PDP/APC', searchTerms: ['Bukola Saraki EFCC', 'Saraki corruption', 'Saraki CCT', 'Saraki asset declaration'], overview: { summary: 'Bukola Saraki was tried at the Code of Conduct Tribunal for false asset declaration and at the Supreme Court for alleged corruption during his tenure as Governor of Kwara State. He was acquitted on all charges.', significance: ['Senate President tried at CCT — unprecedented', 'Acquitted of false asset declaration', 'Case seen as politically motivated by both sides'], currentStatus: 'Acquitted of all charges. Remains politically active.' }, charges: { summary: 'Charged with false asset declaration at CCT. Acquitted.', details: [{ description: '18-count charge of false asset declaration at CCT', year: '2015' }] }, financial: { totalAlleged: 'Allegations centered on undeclared assets during Kwara governorship', amounts: [], sourceOfFunds: '' }, courtProceedings: { summary: 'Tried at CCT; acquitted by Supreme Court in June 2018.', courts: [{ court: 'Code of Conduct Tribunal / Supreme Court', role: 'False asset declaration', status: 'Acquitted (June 2018)' }] }, arrestInvestigation: { summary: 'CCT charges filed based on petitions alleging false asset declarations.' }, caseOutcome: { summary: 'Acquitted by Supreme Court.', status: 'Acquitted' }, timeline: [{ date: '2015', event: 'Charged at CCT with false asset declaration' }, { date: 'June 2018', event: 'Acquitted by Supreme Court' }], keyPlayers: { accused: [{ name: 'Bukola Saraki', role: 'Former Senate President / Governor', status: 'Acquitted' }], associates: [], investigators: [] } },

  { dir: 'Ike_Ekweremadu', name: 'Ike Ekweremadu', position: 'Deputy Senate President', searchTerms: ['Ekweremadu corruption', 'Ekweremadu EFCC', 'Ekweremadu UK trial'], overview: { summary: 'Ike Ekweremadu was convicted in the UK in May 2023 of conspiracy to facilitate organ harvesting — arranging to bring a young Nigerian to the UK for kidney transplant for his daughter under exploitative circumstances. He was sentenced to 9 years and 8 months. This is not a corruption case per se, but involves a prominent Nigerian politician convicted abroad.', significance: ['First Nigerian senator convicted in UK', 'Organ harvesting conviction — 9 years 8 months', 'Not a corruption case but involves abuse of power'], currentStatus: 'Serving sentence in UK prison. Sentenced to 9 years and 8 months in May 2023.' }, charges: { summary: 'Convicted of conspiracy to arrange/facilitate travel of another person with a view to exploitation (organ harvesting).', details: [{ description: 'Conspiracy to facilitate organ harvesting under Modern Slavery Act', year: '2023' }] }, financial: { totalAlleged: 'Not a financial corruption case', amounts: [], sourceOfFunds: '' }, courtProceedings: { summary: 'Convicted at Old Bailey, London, in May 2023.', courts: [{ court: 'Central Criminal Court (Old Bailey), London', role: 'Organ harvesting charges', status: 'Convicted May 2023' }] }, arrestInvestigation: { summary: 'Arrested in the UK in June 2022 with his wife Beatrice.' }, caseOutcome: { summary: 'Convicted; sentenced to 9 years and 8 months.', status: 'Convicted / Serving Sentence' }, timeline: [{ date: 'June 2022', event: 'Arrested in UK with wife' }, { date: 'May 2023', event: 'Convicted; sentenced to 9 years 8 months' }], keyPlayers: { accused: [{ name: 'Ike Ekweremadu', role: 'Former Deputy Senate President', status: 'Convicted; serving sentence in UK' }], associates: [], investigators: [] } },

  { dir: 'Alex_Badeh', name: 'Alex Badeh', position: 'Chief of Defence Staff', searchTerms: ['Alex Badeh EFCC', 'Alex Badeh corruption', 'Badeh arms deal'], overview: { summary: 'Air Marshal Alex Badeh was charged by the EFCC with money laundering involving N3.97 billion linked to the $2.1 billion arms deal scandal. He was assassinated in December 2018 while his trial was ongoing.', significance: ['Charged with N3.97 billion money laundering', 'Assassinated while trial was ongoing', 'Linked to Dasukigate arms deal scandal'], currentStatus: 'Deceased — assassinated on December 18, 2018.' }, charges: { summary: 'Charged with N3.97 billion money laundering.', details: [{ description: '10-count charge of money laundering involving N3.97 billion', year: '2016' }] }, financial: { totalAlleged: 'N3.97 billion', amounts: [{ amount: 'N3.97 billion', description: 'Money laundering linked to arms deal', year: '' }], sourceOfFunds: 'Arms procurement funds from Office of NSA' }, courtProceedings: { summary: 'Trial was ongoing at time of assassination.', courts: [] }, arrestInvestigation: { summary: 'Charged by EFCC in 2016.' }, caseOutcome: { summary: 'Assassinated December 18, 2018 while trial was ongoing. Case terminated.', status: 'Deceased / Trial Terminated' }, timeline: [{ date: '2016', event: 'Charged by EFCC' }, { date: 'December 2018', event: 'Assassinated' }], keyPlayers: { accused: [{ name: 'Alex Badeh', role: 'Former Chief of Defence Staff', status: 'Deceased (assassinated)' }], associates: [], investigators: [] } },

  { dir: 'Farouk_Lawan', name: 'Farouk Lawan', position: 'House of Representatives Member', searchTerms: ['Farouk Lawan bribery', 'Farouk Lawan fuel subsidy', 'Farouk Lawan corruption'], overview: { summary: 'Farouk Lawan chaired the House of Representatives ad-hoc committee investigating the fuel subsidy scam in 2012. He was convicted of soliciting and receiving a $500,000 bribe from oil magnate Femi Otedola to remove Otedola\'s companies from the list of firms implicated in the subsidy fraud. The incident was caught on video.', significance: ['Bribery caught on video by Femi Otedola', 'Convicted of $500,000 bribe solicitation', 'Ironic — investigating corruption while being corrupt'], currentStatus: 'Convicted of bribery in 2021.' }, charges: { summary: 'Convicted of soliciting and receiving $500,000 bribe.', details: [{ description: 'Soliciting and receiving $500,000 bribe from Femi Otedola', year: '2012' }] }, financial: { totalAlleged: '$500,000', amounts: [{ amount: '$500,000', description: 'Bribe from Femi Otedola', year: '2012' }], sourceOfFunds: 'Bribe from businessman' }, courtProceedings: { summary: 'Convicted in 2021.', courts: [{ court: 'Federal High Court, Abuja', role: 'Bribery trial', status: 'Convicted' }] }, arrestInvestigation: { summary: 'Femi Otedola reported the bribe solicitation to security services and recorded the handover on video.' }, caseOutcome: { summary: 'Convicted of bribery.', status: 'Convicted' }, timeline: [{ date: '2012', event: 'Solicits $620,000 bribe from Otedola; receives $500,000; caught on video' }, { date: '2021', event: 'Convicted of bribery' }], keyPlayers: { accused: [{ name: 'Farouk Lawan', role: 'Former House Rep member', status: 'Convicted' }], associates: [{ name: 'Femi Otedola', role: 'Businessman who recorded bribe', note: 'Set up sting operation' }], investigators: [] } },

  // ── Simple entries for remaining officials (metadata derived from articles) ──
  ...generateSimpleOfficials(),
];

/**
 * Generate basic official entries for remaining officials where
 * detailed metadata is not yet available. These will have their
 * content primarily derived from fetched articles.
 */
function generateSimpleOfficials() {
  const simpleList = [
    { dir: 'Hamza_Al-Mustapha', name: 'Hamza Al-Mustapha', position: 'Chief Security Officer to Abacha', searchTerms: ['Al-Mustapha trial', 'Al-Mustapha Abacha', 'Al-Mustapha murder'] },
    { dir: 'Ishaya_Bamaiyi', name: 'Ishaya Bamaiyi', position: 'Chief of Army Staff', searchTerms: ['Bamaiyi corruption', 'Bamaiyi trial'] },
    { dir: 'Oladipo_Diya', name: 'Oladipo Diya', position: 'Chief of General Staff', searchTerms: ['Oladipo Diya corruption', 'Diya coup'] },
    { dir: 'Theophilus_Danjuma', name: 'Theophilus Danjuma', position: 'Former Minister of Defence / Military Officer', searchTerms: ['TY Danjuma corruption', 'Danjuma PTDF'] },
    { dir: 'Jeremiah_Useni', name: 'Jeremiah Useni', position: 'Military Governor / Senator', searchTerms: ['Jeremiah Useni corruption', 'Useni fraud'] },
    { dir: 'Chris_Alli', name: 'Chris Alli', position: 'Military Officer', searchTerms: ['Chris Alli corruption', 'Chris Alli military fraud'] },
    { dir: 'Buba_Marwa', name: 'Buba Marwa', position: 'Military Governor of Lagos / NDLEA Chairman', searchTerms: ['Buba Marwa corruption', 'Marwa NDLEA'] },
    { dir: 'Chimaroke_Nnamani', name: 'Chimaroke Nnamani', position: 'Governor of Enugu State (1999-2007)', searchTerms: ['Chimaroke Nnamani EFCC', 'Nnamani corruption'] },
    { dir: 'Rashidi_Ladoja', name: 'Rashidi Ladoja', position: 'Governor of Oyo State (2003-2007)', searchTerms: ['Rashidi Ladoja EFCC', 'Ladoja corruption'] },
    { dir: 'Adebayo_Alao-Akala', name: 'Adebayo Alao-Akala', position: 'Governor of Oyo State (2007-2011)', searchTerms: ['Alao-Akala EFCC', 'Alao-Akala corruption'] },
    { dir: 'Saminu_Turaki', name: 'Saminu Turaki', position: 'Governor of Jigawa State (1999-2007)', searchTerms: ['Saminu Turaki EFCC', 'Turaki corruption'] },
    { dir: 'Gbenga_Daniel', name: 'Gbenga Daniel', position: 'Governor of Ogun State (2003-2011)', searchTerms: ['Gbenga Daniel EFCC', 'Gbenga Daniel corruption'] },
    { dir: 'Lucky_Igbinedion', name: 'Lucky Igbinedion', position: 'Governor of Edo State (1999-2007)', searchTerms: ['Lucky Igbinedion EFCC', 'Igbinedion corruption'] },
    { dir: 'Ayo_Fayose', name: 'Ayo Fayose', position: 'Governor of Ekiti State (2003-2006, 2014-2018)', searchTerms: ['Ayo Fayose EFCC', 'Fayose corruption', 'Fayose money laundering'] },
    { dir: 'Abdullahi_Adamu', name: 'Abdullahi Adamu', position: 'Governor of Nasarawa State (1999-2007) / APC Chairman', searchTerms: ['Abdullahi Adamu EFCC', 'Abdullahi Adamu corruption'] },
    { dir: 'Murtala_Nyako', name: 'Murtala Nyako', position: 'Governor of Adamawa State (2007-2014)', searchTerms: ['Murtala Nyako EFCC', 'Nyako corruption', 'Nyako money laundering'] },
    { dir: 'Timipre_Sylva', name: 'Timipre Sylva', position: 'Governor of Bayelsa State (2007-2012)', searchTerms: ['Timipre Sylva EFCC', 'Sylva corruption'] },
    { dir: 'Sule_Lamido', name: 'Sule Lamido', position: 'Governor of Jigawa State (2007-2015)', searchTerms: ['Sule Lamido EFCC', 'Lamido corruption', 'Lamido money laundering'] },
    { dir: 'Rabiu_Kwankwaso', name: 'Rabiu Kwankwaso', position: 'Governor of Kano State (1999-2003, 2011-2015)', searchTerms: ['Kwankwaso EFCC', 'Kwankwaso corruption'] },
    { dir: 'Aliyu_Wamakko', name: 'Aliyu Wamakko', position: 'Governor of Sokoto State (2007-2015)', searchTerms: ['Wamakko EFCC', 'Wamakko corruption'] },
    { dir: 'Ali_Modu_Sheriff', name: 'Ali Modu Sheriff', position: 'Governor of Borno State (2003-2011)', searchTerms: ['Ali Modu Sheriff EFCC', 'Modu Sheriff corruption', 'Sheriff Boko Haram'] },
    { dir: 'Danjuma_Goje', name: 'Danjuma Goje', position: 'Governor of Gombe State (2003-2011)', searchTerms: ['Danjuma Goje EFCC', 'Goje corruption'] },
    { dir: 'Isa_Yuguda', name: 'Isa Yuguda', position: 'Governor of Bauchi State (2007-2015)', searchTerms: ['Isa Yuguda EFCC', 'Yuguda corruption'] },
    { dir: 'Ibrahim_Shema', name: 'Ibrahim Shema', position: 'Governor of Katsina State (2007-2015)', searchTerms: ['Ibrahim Shema EFCC', 'Shema corruption'] },
    { dir: 'Ramalan_Yero', name: 'Ramalan Yero', position: 'Governor of Kaduna State (2012-2015)', searchTerms: ['Ramalan Yero EFCC', 'Yero corruption'] },
    { dir: 'Jonah_Jang', name: 'Jonah Jang', position: 'Governor of Plateau State (2007-2015)', searchTerms: ['Jonah Jang EFCC', 'Jang corruption'] },
    { dir: 'Gabriel_Suswam', name: 'Gabriel Suswam', position: 'Governor of Benue State (2007-2015)', searchTerms: ['Gabriel Suswam EFCC', 'Suswam corruption'] },
    { dir: 'Samuel_Ortom', name: 'Samuel Ortom', position: 'Governor of Benue State (2015-2023)', searchTerms: ['Samuel Ortom EFCC', 'Ortom corruption'] },
    { dir: 'Nyesom_Wike', name: 'Nyesom Wike', position: 'Governor of Rivers State (2015-2023) / FCT Minister', searchTerms: ['Nyesom Wike EFCC', 'Wike corruption', 'Wike fraud'] },
    { dir: 'Rotimi_Amaechi', name: 'Rotimi Amaechi', position: 'Governor of Rivers State (2007-2015) / Minister of Transportation', searchTerms: ['Rotimi Amaechi corruption', 'Amaechi EFCC', 'Amaechi fraud'] },
    { dir: 'Peter_Odili', name: 'Peter Odili', position: 'Governor of Rivers State (1999-2007)', searchTerms: ['Peter Odili EFCC', 'Odili corruption'] },
    { dir: 'Adams_Oshiomhole', name: 'Adams Oshiomhole', position: 'Governor of Edo State (2008-2016) / APC Chairman', searchTerms: ['Oshiomhole EFCC', 'Oshiomhole corruption'] },
    { dir: 'Godwin_Obaseki', name: 'Godwin Obaseki', position: 'Governor of Edo State (2016-2024)', searchTerms: ['Godwin Obaseki EFCC', 'Obaseki corruption'] },
    { dir: 'Kayode_Fayemi', name: 'Kayode Fayemi', position: 'Governor of Ekiti State (2010-2014, 2018-2022)', searchTerms: ['Fayemi EFCC', 'Fayemi corruption'] },
    { dir: 'Nasir_El-Rufai', name: 'Nasir El-Rufai', position: 'Governor of Kaduna State (2015-2023)', searchTerms: ['El-Rufai EFCC', 'El-Rufai corruption'] },
    { dir: 'Rauf_Aregbesola', name: 'Rauf Aregbesola', position: 'Governor of Osun State (2010-2018) / Minister of Interior', searchTerms: ['Aregbesola EFCC', 'Aregbesola corruption'] },
    { dir: 'Abdulfattah_Ahmed', name: 'Abdulfattah Ahmed', position: 'Governor of Kwara State (2011-2019)', searchTerms: ['Abdulfattah Ahmed EFCC', 'Abdulfattah Ahmed corruption'] },
    { dir: 'Rochas_Okorocha', name: 'Rochas Okorocha', position: 'Governor of Imo State (2011-2019)', searchTerms: ['Rochas Okorocha EFCC', 'Okorocha corruption'] },
    { dir: 'Hope_Uzodinma', name: 'Hope Uzodinma', position: 'Governor of Imo State (2020-present)', searchTerms: ['Hope Uzodinma EFCC', 'Uzodinma corruption'] },
    { dir: 'Muazu_Babangida_Aliyu', name: 'Muazu Babangida Aliyu', position: 'Governor of Niger State (2007-2015)', searchTerms: ['Babangida Aliyu EFCC', 'Babangida Aliyu corruption'] },
    { dir: 'Godswill_Akpabio', name: 'Godswill Akpabio', position: 'Governor of Akwa Ibom (2007-2015) / Senate President', searchTerms: ['Akpabio EFCC', 'Akpabio corruption'] },
    { dir: 'Theodore_Orji', name: 'Theodore Orji', position: 'Governor of Abia State (2007-2015)', searchTerms: ['Theodore Orji EFCC', 'T.A. Orji corruption'] },
    { dir: 'Sullivan_Chime', name: 'Sullivan Chime', position: 'Governor of Enugu State (2007-2015)', searchTerms: ['Sullivan Chime corruption'] },
    { dir: 'Martin_Elechi', name: 'Martin Elechi', position: 'Governor of Ebonyi State (2007-2015)', searchTerms: ['Martin Elechi EFCC', 'Elechi corruption'] },
    { dir: 'Ikedi_Ohakim', name: 'Ikedi Ohakim', position: 'Governor of Imo State (2007-2011)', searchTerms: ['Ikedi Ohakim EFCC', 'Ohakim corruption'] },
    { dir: 'Attahiru_Bafarawa', name: 'Attahiru Bafarawa', position: 'Governor of Sokoto State (1999-2007)', searchTerms: ['Bafarawa EFCC', 'Bafarawa corruption'] },
    { dir: 'Boni_Haruna', name: 'Boni Haruna', position: 'Governor of Adamawa State (1999-2007)', searchTerms: ['Boni Haruna EFCC', 'Boni Haruna corruption'] },
    { dir: 'Liyel_Imoke', name: 'Liyel Imoke', position: 'Governor of Cross River State (2007-2015)', searchTerms: ['Liyel Imoke corruption'] },
    { dir: 'Donald_Duke', name: 'Donald Duke', position: 'Governor of Cross River State (1999-2007)', searchTerms: ['Donald Duke corruption'] },
    { dir: 'Achike_Udenwa', name: 'Achike Udenwa', position: 'Governor of Imo State (1999-2007)', searchTerms: ['Achike Udenwa corruption'] },
    { dir: 'Adamu_Muazu', name: 'Adamu Muazu', position: 'Governor of Bauchi State (1999-2007)', searchTerms: ['Adamu Muazu corruption'] },
    { dir: 'Ahmed_Makarfi', name: 'Ahmed Makarfi', position: 'Governor of Kaduna State (1999-2007)', searchTerms: ['Ahmed Makarfi corruption'] },
    { dir: 'Emeka_Ihedioha', name: 'Emeka Ihedioha', position: 'Governor of Imo State (2019)', searchTerms: ['Emeka Ihedioha corruption'] },
    { dir: 'Akinwumi_Ambode', name: 'Akinwumi Ambode', position: 'Governor of Lagos State (2015-2019)', searchTerms: ['Ambode EFCC', 'Ambode corruption'] },
    { dir: 'Ibikunle_Amosun', name: 'Ibikunle Amosun', position: 'Governor of Ogun State (2011-2019)', searchTerms: ['Amosun EFCC', 'Amosun corruption', 'Amosun arms'] },
    { dir: 'Dapo_Abiodun', name: 'Dapo Abiodun', position: 'Governor of Ogun State (2019-present)', searchTerms: ['Dapo Abiodun EFCC', 'Abiodun fraud'] },
    { dir: 'Ben_Ayade', name: 'Ben Ayade', position: 'Governor of Cross River State (2015-2023)', searchTerms: ['Ben Ayade EFCC', 'Ayade corruption'] },
    { dir: 'Dave_Umahi', name: 'Dave Umahi', position: 'Governor of Ebonyi State (2015-2023) / Minister of Works', searchTerms: ['Dave Umahi EFCC', 'Umahi corruption'] },
    { dir: 'Ifeanyi_Ubah', name: 'Ifeanyi Ubah', position: 'Senator / Businessman', searchTerms: ['Ifeanyi Ubah EFCC', 'Ifeanyi Ubah fraud'] },
    { dir: 'Stella_Oduah', name: 'Stella Oduah', position: 'Minister of Aviation (2011-2014)', searchTerms: ['Stella Oduah EFCC', 'Stella Oduah corruption', 'Stella Oduah BMW'] },
    { dir: 'Babachir_Lawal', name: 'Babachir Lawal', position: 'Secretary to the Government of the Federation', searchTerms: ['Babachir Lawal EFCC', 'Babachir corruption', 'Babachir grass-cutting'] },
    { dir: 'Isa_Pantami', name: 'Isa Pantami', position: 'Minister of Communications and Digital Economy', searchTerms: ['Isa Pantami corruption', 'Pantami controversy'] },
    { dir: 'Hadi_Sirika', name: 'Hadi Sirika', position: 'Minister of Aviation (2015-2023)', searchTerms: ['Hadi Sirika EFCC', 'Sirika corruption', 'Nigeria Air fraud'] },
    { dir: 'Femi_Fani-Kayode', name: 'Femi Fani-Kayode', position: 'Minister of Aviation (2006-2007)', searchTerms: ['Fani-Kayode EFCC', 'Fani-Kayode corruption', 'Fani-Kayode money laundering'] },
    { dir: 'Nenadi_Usman', name: 'Nenadi Usman', position: 'Minister of Finance', searchTerms: ['Nenadi Usman EFCC', 'Nenadi Usman corruption'] },
    { dir: 'Bala_Mohammed', name: 'Bala Mohammed', position: 'Minister of FCT / Governor of Bauchi', searchTerms: ['Bala Mohammed EFCC', 'Bala Mohammed corruption'] },
    { dir: 'Ngozi_Okonjo-Iweala', name: 'Ngozi Okonjo-Iweala', position: 'Minister of Finance (2003-2006, 2011-2015)', searchTerms: ['Okonjo-Iweala corruption allegations', 'Okonjo-Iweala missing money'] },
    { dir: 'Patricia_Etteh', name: 'Patricia Etteh', position: 'Speaker of the House of Representatives', searchTerms: ['Patricia Etteh corruption', 'Etteh fraud'] },
    { dir: 'Dino_Melaye', name: 'Dino Melaye', position: 'Senator representing Kogi West', searchTerms: ['Dino Melaye EFCC', 'Dino Melaye corruption'] },
    { dir: 'Olisa_Metuh', name: 'Olisa Metuh', position: 'PDP National Publicity Secretary', searchTerms: ['Olisa Metuh EFCC', 'Metuh corruption', 'Metuh Dasuki'] },
    { dir: 'Kashim_Shettima', name: 'Kashim Shettima', position: 'Vice President / Former Governor of Borno State', searchTerms: ['Shettima corruption', 'Shettima EFCC'] },
    { dir: 'Bassey_Albert', name: 'Bassey Albert', position: 'Senator representing Akwa Ibom', searchTerms: ['Bassey Albert EFCC', 'Bassey Albert corruption'] },
    { dir: 'Peter_Nwaoboshi', name: 'Peter Nwaoboshi', position: 'Senator representing Delta North', searchTerms: ['Peter Nwaoboshi EFCC', 'Nwaoboshi corruption'] },
    { dir: 'Shehu_Sani', name: 'Shehu Sani', position: 'Senator representing Kaduna Central', searchTerms: ['Shehu Sani EFCC', 'Shehu Sani corruption'] },
    { dir: 'Andrew_Azazi', name: 'Andrew Azazi', position: 'National Security Adviser (2010-2012)', searchTerms: ['Andrew Azazi corruption'] },
    { dir: 'Mohammed_Babagana_Monguno', name: 'Mohammed Babagana Monguno', position: 'National Security Adviser', searchTerms: ['Monguno corruption', 'Monguno NSA'] },
    { dir: 'Olonisakin', name: 'Abayomi Olonisakin', position: 'Chief of Defence Staff', searchTerms: ['Olonisakin corruption', 'Olonisakin EFCC'] },
    { dir: 'Abdulrasheed_Bawa', name: 'Abdulrasheed Bawa', position: 'Chairman of EFCC (2021-2023)', searchTerms: ['Abdulrasheed Bawa corruption', 'Bawa EFCC scandal'] },
    { dir: 'Herman_Hembe', name: 'Herman Hembe', position: 'House of Representatives Member', searchTerms: ['Herman Hembe corruption', 'Hembe SEC probe'] },
    { dir: 'Jide_Omokore', name: 'Jide Omokore', position: 'Oil Magnate / Businessman', searchTerms: ['Jide Omokore EFCC', 'Omokore corruption'] },
    { dir: 'Kola_Aluko', name: 'Kola Aluko', position: 'Oil Magnate / Businessman', searchTerms: ['Kola Aluko EFCC', 'Kola Aluko corruption', 'Kola Aluko Diezani'] },
    { dir: 'Abubakar_Malami', name: 'Abubakar Malami', position: 'Attorney General of the Federation (2015-2023)', searchTerms: ['Malami corruption', 'Malami EFCC', 'Malami fraud'] },
    { dir: 'Abdullahi_Sule', name: 'Abdullahi Sule', position: 'Governor of Nasarawa State (2019-2023)', searchTerms: ['Abdullahi Sule corruption'] },
    { dir: 'Biodun_Oyebanji', name: 'Biodun Oyebanji', position: 'Governor of Ekiti State (2022-present)', searchTerms: ['Oyebanji corruption'] },
    { dir: 'Musa_Yar_Adua', name: 'Umaru Musa Yar\'Adua', position: 'President of Nigeria (2007-2010)', searchTerms: ['Yar\'Adua corruption'] },
    { dir: 'Adebayo_Shittu', name: 'Adebayo Shittu', position: 'Minister of Communications', searchTerms: ['Adebayo Shittu EFCC', 'Shittu corruption'] },
    { dir: 'Roland_Owie', name: 'Roland Owie', position: 'Senator / Politician', searchTerms: ['Roland Owie corruption'] },
    { dir: 'Stella_Omu', name: 'Stella Omu', position: 'Senator representing Delta', searchTerms: ['Stella Omu EFCC', 'Stella Omu corruption'] },
    { dir: 'Adamu_Abdullahi', name: 'Adamu Abdullahi', position: 'Senator / Former APC Chairman', searchTerms: ['Adamu Abdullahi EFCC', 'Adamu Abdullahi corruption'] },
    { dir: 'Mohammed_Abubakar_IGP', name: 'Mohammed Abubakar', position: 'Inspector General of Police', searchTerms: ['Mohammed Abubakar IGP corruption'] },
  ];

  return simpleList.map(o => ({
    ...o,
    overview: { summary: '', significance: [], currentStatus: '' },
    charges: { summary: '', details: [] },
    financial: { totalAlleged: '', amounts: [], sourceOfFunds: '' },
    courtProceedings: { summary: '', courts: [] },
    arrestInvestigation: { summary: '' },
    caseOutcome: { summary: '', status: '' },
    timeline: [],
    keyPlayers: { accused: [{ name: o.name, role: o.position, status: '' }], associates: [], investigators: [] },
  }));
}
