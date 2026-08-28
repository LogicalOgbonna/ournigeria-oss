"use strict";

// apps/api/src/enrichment/sweeper/sweeper.cli.ts
var import_fs = require("fs");
var import_pg = require("pg");

// apps/api/src/enrichment/agent/categories.ts
var CATEGORIES = [
  { category: "education", domain: "education", table: "official_education", kind: "fillable", electedOnly: false, label: "Education" },
  { category: "career", domain: "careers", table: "official_careers", kind: "fillable", electedOnly: false, label: "Career before politics" },
  { category: "party_affiliation", domain: "party_affiliations", table: "official_party_affiliations", kind: "fillable", electedOnly: true, label: "Party affiliations" },
  { category: "committee", domain: "committees", table: "official_committees", kind: "fillable", electedOnly: true, label: "Committees" },
  { category: "bill", domain: "bills", table: "official_sponsored_bills", kind: "fillable", electedOnly: true, label: "Sponsored bills" },
  { category: "election", domain: "elections", table: "official_elections", kind: "fillable", electedOnly: true, label: "Elections contested" },
  { category: "asset", domain: "assets", table: "official_asset_declarations", kind: "fillable", electedOnly: false, label: "Asset declarations" },
  { category: "award", domain: "awards", table: "official_awards", kind: "fillable", electedOnly: false, label: "Awards & honours" },
  { category: "publication", domain: "publications", table: "official_publications", kind: "fillable", electedOnly: false, label: "Publications" },
  // Investigative — gap is "never checked / due for re-check", never a zero-row inference.
  { category: "family", domain: "family", table: "official_family_members", kind: "investigative", electedOnly: false, label: "Family" },
  { category: "legal_case", domain: "legal_cases", table: "official_legal_cases", kind: "investigative", electedOnly: false, label: "Legal cases" },
  { category: "corruption", domain: "corruption", table: "corruption_cases", kind: "investigative", electedOnly: false, label: "Corruption involvement" }
];
var CATEGORY_BY_KEY = Object.fromEntries(
  CATEGORIES.map((c) => [c.category, c])
);

// apps/api/src/enrichment/agent/find-structured-gaps.ts
async function findStructuredGaps(client, limit = 20, opts = {}) {
  const all = [];
  for (const cat of CATEGORIES) {
    const rows = await queryCategory(client, cat, limit, opts.electionTypes);
    all.push(...rows);
  }
  all.sort((a, b) => {
    const ca = a.completeness ?? -1;
    const cb = b.completeness ?? -1;
    if (ca !== cb) return ca - cb;
    return a.officialId < b.officialId ? -1 : a.officialId > b.officialId ? 1 : 0;
  });
  return all.slice(0, limit);
}
async function queryCategory(client, cat, limit, electionTypes) {
  const electedClause = cat.electedOnly ? `AND (o.official_type IS NULL OR o.official_type = 'elected')` : "";
  const typeClause = electionTypes && electionTypes.length > 0 ? `AND EXISTS (
        SELECT 1 FROM official_elections te
        WHERE te.official_id = o.id AND te.result = 'won'
          AND te.election_type = ANY($4)
      )` : "";
  const zeroRowClause = cat.kind === "fillable" ? `AND NOT EXISTS (SELECT 1 FROM "${cat.table}" t WHERE t.official_id = o.id)` : "";
  const sql = `
    SELECT o.id, o.name, o.slug, o.official_type, o.completeness_score
    FROM nigerian_officials o
    LEFT JOIN enrichment_attempts ea
      ON ea.official_id = o.id AND ea.category = $1
    WHERE TRUE
      ${electedClause}
      -- Office-holder guard (plan 60 \xA75.3): election candidates (type NULL, at
      -- most 'contesting' positions) are NOT swept \u2014 autonomous enrichment of
      -- ~1.8k unknowns would burn the LLM budget on people who may never hold
      -- office. They re-enter naturally when a position flips to 'active'.
      -- CARVE-OUT: executive-ticket winners (president/VP, governor/deputy \u2014
      -- ~200 people, prominent and richly sourceable, many are ex-officeholders
      -- like Kwankwaso/Amaechi whose history predates this dataset) ARE swept:
      -- their career/legal_case backfill, incl. the CourtListener pre-step, is
      -- exactly what the accountability mission needs before the election.
      AND (o.official_type IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM official_positions op
          WHERE op.official_id = o.id AND op.status <> 'contesting'
        )
        OR EXISTS (
          SELECT 1 FROM official_elections oe
          WHERE oe.official_id = o.id
            AND oe.election_type IN ('presidential', 'vice_presidential', 'gubernatorial', 'deputy_gubernatorial')
            AND oe.result = 'won'
            AND oe.confidence <> 'low'
        ))
      AND (ea.id IS NULL OR (ea.status <> 'pending' AND ea.next_eligible_at <= now()))
      AND NOT EXISTS (
        SELECT 1 FROM change_proposals cp
        WHERE cp.target_table = $2
          AND cp.status IN ('pending', 'needs_human')
          AND (cp.proposed_value->>'officialId') = o.id::text
      )
      ${zeroRowClause}
      ${typeClause}
    ORDER BY o.completeness_score ASC NULLS FIRST, o.created_at ASC
    LIMIT $3`;
  const params = [cat.category, cat.table, limit];
  if (electionTypes && electionTypes.length > 0) params.push(electionTypes);
  const res = await client.query(sql, params);
  return res.rows.map((r) => ({
    officialId: r.id,
    name: r.name,
    slug: r.slug,
    officialType: r.official_type,
    category: cat.category,
    domain: cat.domain,
    completeness: r.completeness_score === null ? null : Number(r.completeness_score)
  }));
}

// packages/database/src/slug.ts
function slugifyName(input) {
  return input.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").toLowerCase().replace(/['’.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
}

// apps/api/src/enrichment/agent/university-domains.gen.ts
var WORLD_UNIVERSITY_DOMAINS = [
  "a-aarhus.dk",
  "a2.keio.jp",
  "aaidu.org",
  "aalto.fi",
  "aastu.org",
  "aau.dk",
  "ablaikhan.kz",
  "abo.fi",
  "absparis.com",
  "ac-aix-marseille.fr",
  "ac-besancon.fr",
  "ac-bordeaux.fr",
  "ac-creteil.fr",
  "ac-mayotte.fr",
  "ac-orleans-tours.fr",
  "ac-paris.fr",
  "academia.cl",
  "academiaga.ru",
  "academy.mia.by",
  "academy.sumy.ua",
  "acadiau.ca",
  "aceondo-ng.com",
  "acg.gr",
  "acighana.org",
  "ackonline.com",
  "acs350.org",
  "adfa.oz.au",
  "adtu.in",
  "adygnet.ru",
  "ae.katowice.pl",
  "ae.krakow.pl",
  "ae.poznan.pl",
  "ae.wroc.pl",
  "aea.asso.fr",
  "aegean.gr",
  "ael.ru",
  "aereshogeschool.nl",
  "afi-ue.sn",
  "agma.astranet.ru",
  "agr.unideb.hu",
  "agrar.uz",
  "agriun.almaty.kz",
  "agro.roazhon.inra.fr",
  "agroparistech.fr",
  "agrosupdijon.fr",
  "agsm.gr",
  "agtu.ru",
  "agu.ae",
  "ah.dk",
  "ahliauniversity.org",
  "ahlulbaitonline.com",
  "aho.no",
  "aisct.org",
  "aistedaab.ro",
  "ait.ie",
  "akad.de",
  "akademiapz.sk",
  "aktsu.kz",
  "aku.sk",
  "al-edu.com",
  "algebra.hr",
  "algonquincollege.com",
  "alhosnu.ae",
  "aliabad.iau.ir",
  "alldunivpio.org",
  "almaarifah.com",
  "almamonuc.org",
  "alrasheed-uc.com",
  "alsadrain.org",
  "altmeduniversity.com",
  "altmedworld.net",
  "alumnos.ui1.es",
  "am.katowice.pl",
  "am.lodz.pl",
  "am.lublin.pl",
  "am.wroc.pl",
  "amb.bydgoszcz.pl",
  "ame.ru",
  "american-college.com",
  "amg.gda.pl",
  "amgd.eu",
  "aml.lv",
  "amouduniversity.org",
  "amsterdam.tech",
  "amti.hit.bg",
  "amtuni.com",
  "amursu.ru",
  "amuz.bydgoszcz.pl",
  "amuz.gda.pl",
  "amuz.krakow.pl",
  "amuz.lodz.pl",
  "amuz.poznan.pl",
  "amuz.wroc.pl",
  "anahuac.mx",
  "andhrauniversity.info",
  "andrassyuni.hu",
  "anefs-edu.ro",
  "angelicum.org",
  "angrau.net",
  "anhembi.br",
  "antonianum.ofm.org",
  "aos.sk",
  "aou.org.bh",
  "ap.siedlce.pl",
  "apsurewa.nic.in",
  "aqua.sci-nnov.ru",
  "ar.krakow.pl",
  "ar.lublin.pl",
  "ar.szczecin.pl",
  "ar.wroc.pl",
  "armmed.am",
  "arosmu.org",
  "arquitecturaucv.cl",
  "art.olsztyn.pl",
  "artacademy.spb.ru",
  "arteiasi.ro",
  "arts7.hu",
  "artun.ee",
  "arwauniversity.org",
  "aryainstitutejpr.com",
  "asau.am",
  "asb.bh",
  "ascca.gov.az",
  "ase.md",
  "ase.ro",
  "asfa.gr",
  "asfh-berlin.de",
  "ashtoncollege.com",
  "asmildkloster.dk",
  "asmu.ru",
  "asp.gda.pl",
  "asp.krakow.pl",
  "asp.lodz.pl",
  "asp.poznan.pl",
  "asp.waw.pl",
  "asp.wroc.pl",
  "aspete.gr",
  "aspu.ru",
  "assamuniversity.nic.in",
  "assumptionu.ca",
  "astu.org",
  "astu.secna.ru",
  "asu.ru",
  "asue.am",
  "atc2u.com",
  "atgu.kz",
  "athabascau.ca",
  "ats.dk",
  "au-plovdiv.bg",
  "au.dk",
  "au.poznan.pl",
  "aua.am",
  "aua.gr",
  "auamed.org",
  "aub-bd.org",
  "aubg.bg",
  "aubih.ba",
  "auc-edu.org",
  "auc.dk",
  "auca.kg",
  "auchaiti.org",
  "audencia.com",
  "aue.ae",
  "aueb.gr",
  "augustana.ab.ca",
  "augustana.de",
  "aui.ma",
  "aukonline.org",
  "aup.fr",
  "aust-abuja.org",
  "auth.gr",
  "avicenna.hu",
  "avu.org",
  "awf.gda.pl",
  "awf.katowice.pl",
  "awf.krakow.pl",
  "awf.poznan.pl",
  "awf.wroc.pl",
  "ayurveduniversity.com",
  "az-npu.org",
  "azc.uam.mx",
  "b-tu.de",
  "ba-bautzen.de",
  "ba.lv",
  "baa.by",
  "bambey.univ.sn",
  "bamendauniversity.com",
  "bamu.net",
  "bamu.nic.in",
  "banasthali.org",
  "bankurauniv.com",
  "baraodemaua.br",
  "barcelonagse.eu",
  "bashedu.ru",
  "bau.nic.in",
  "bbauindia.org",
  "bca.bw",
  "bcit.ca",
  "bcou.ca",
  "bdeb.qc.ca",
  "bdtf.hu",
  "bdu.ernet.in",
  "bellsuniversity.org",
  "belsut.gomel.by",
  "benadiruniversity.net",
  "bengaluruuniversity.com",
  "bercol.bm",
  "bethel.de",
  "bfh.ch",
  "bfu.bg",
  "bgctrustbd.org",
  "bhagwantuniversity.com",
  "bharathi.ernet.in",
  "bharathuniv.com",
  "bhms.ch",
  "bhu.kg",
  "bi.no",
  "bifrost.is",
  "bigpi.biysk.ru",
  "bihe.org",
  "bisla.sk",
  "bitmesraranchi.org",
  "bits-iserlohn.de",
  "biu.education",
  "bke.hu",
  "bme.hu",
  "bmhs.org",
  "bmstu.ru",
  "bnmu.in",
  "bntu.by",
  "bojnourd.iau.ir",
  "boothcollege.ca",
  "borealc.on.ca",
  "bosasocollege.com",
  "bowenuniversity-edu.org",
  "bowvalleycollege.ca",
  "bpitindia.in",
  "bput.org",
  "brabu.net",
  "brandonu.ca",
  "brauagra.com",
  "brazcubas.br",
  "brexgata.eu",
  "brocku.ca",
  "broyalu.net",
  "brstu.ru",
  "brsu.brest.by",
  "bru.mogilev.by",
  "bs.naist.jp",
  "bsaa.ru",
  "bseu.by",
  "bsl-lausanne.ch",
  "bsmu.by",
  "bspu.ru",
  "bspu.unibel.by",
  "bstu.by",
  "bstu.ru",
  "bstu.unibel.by",
  "bsu-edu.org",
  "bsu.burnet.ru",
  "bsu.by",
  "bsuir.by",
  "bth.se",
  "btsau.kiev.ua",
  "btu.bg",
  "btu.ge",
  "buap.mx",
  "bubhopal.nic.in",
  "buk.by",
  "bulehorauniversity.com",
  "bundelkhanduniversity.org",
  "buraouniversity.com",
  "cal.devry.ca",
  "cambriancollege.ca",
  "camosun.bc.ca",
  "campus-m-university.de",
  "campus-saint-marc.com",
  "campus.fct.unl.pt",
  "campus.ul.pt",
  "campusleon.ugto.mx",
  "campusm21.de",
  "candidomendes.br",
  "capcollege.bc.ca",
  "cariboo.bc.ca",
  "carleton.ca",
  "carolus-magnus-university.eu",
  "cas.dhbw.de",
  "casa.unimo.it",
  "castelobranco.br",
  "cau.org.in",
  "cavendishza.org",
  "cbs.de",
  "cbs.dk",
  "cbu2000.com",
  "ccbc.ca",
  "ccsuniversity.org",
  "cduestc.cn",
  "ceaprc.org",
  "centennialcollege.ca",
  "central.ucv.ro",
  "centrale-marseille.fr",
  "centralesupelec.fr",
  "cesi.fr",
  "ceti.mx",
  "cetys.mx",
  "ceu.es",
  "ceu.hu",
  "ceunix.com.mx",
  "ceux.mx",
  "cfpj.com",
  "cgcc.cc.or.us",
  "chalmers.se",
  "chandilpolytechnic.org",
  "chapingo.mx",
  "charismauniversity.org",
  "charite.de",
  "chiba-u.jp",
  "chinaacademyofart.com",
  "chnu.cv.ua",
  "christuniversity.in",
  "chuv.ch",
  "chuvsu.ru",
  "cic-cairo.com",
  "ciefl.org",
  "cit.drbit.com.ru",
  "cit.ie",
  "cityu.bg",
  "cityu.gr",
  "clermont-sb.fr",
  "clsbe.lisboa.ucp.pt",
  "cmu.ca",
  "cnam.fr",
  "cnc.bc.ca",
  "cnearc.fr",
  "cocite.pt",
  "code.berlin",
  "coeoju.com",
  "coleurope.eu",
  "college-de-france.fr",
  "college.harlaxton.co.uk",
  "collegeuniversel.ca",
  "colmex.mx",
  "columbiacollege.ca",
  "concordia.ab.ca",
  "concordia.ca",
  "conestogac.on.ca",
  "connect.polyu.hk",
  "connect.ust.hk",
  "conservatoire.ru",
  "conservatory.az",
  "conservatory.ru",
  "cotr.bc.ca",
  "cou.fi",
  "cpe.fr",
  "cqec.net.cn",
  "cqgyzy.com",
  "cqtcedu.com",
  "cqust.cn",
  "cqwu.net",
  "creupi.br",
  "cribx1.u-bordeaux.fr",
  "crsmu.com",
  "cs.lpu.lv",
  "csmrouen.com",
  "csmrouen.net",
  "cstj.qc.ca",
  "cubidor.com",
  "cueyatl.uam.mx",
  "cuni.cz",
  "cunima.net",
  "cus.ca",
  "cuslm.ca",
  "cust.univ-bpclermont.fr",
  "cv.unipiaget.org",
  "cvut.cz",
  "cwidaho.cc",
  "czu.cz",
  "da-iict.org",
  "dal.ca",
  "darulhuda.com",
  "dau.lv",
  "dauphine.fr",
  "davietjal.org",
  "davuniversity.org",
  "dawsoncollege.qc.ca",
  "db.dk",
  "dbatechuni.org",
  "dbskkv.org",
  "dcc.ufmg.br",
  "dceonline.net",
  "dcmail.ca",
  "dct.ch",
  "dct.udn.vn",
  "dcu.ie",
  "ddea.dk",
  "ddi.uliege.be",
  "ddu.nl",
  "dehaagsehogeschool.nl",
  "dehaghan.iau.ir",
  "deusto.es",
  "devinci.fr",
  "dfh.dk",
  "dgit.gob.mx",
  "dgu.ru",
  "dhbw-karlsruhe.de",
  "dhbw-loerrach.de",
  "dhbw-mannheim.de",
  "dhbw-mosbach.de",
  "dhbw-stuttgart.de",
  "dhbw-vs.de",
  "dhbw.de",
  "dhv-speyer.de",
  "diak.fi",
  "dias.ie",
  "dibru.ernet.in",
  "diploma.de",
  "disfm.rnu.tn",
  "dit.ie",
  "diu.net.bd",
  "dkdm.dk",
  "dkit.ie",
  "dlh.dk",
  "dnu.dp.ua",
  "dongau.ru",
  "donmeduni.com",
  "dote.hu",
  "douglas.bc.ca",
  "dpt-info.u-strasbg.fr",
  "dpu.dk",
  "drk.hu",
  "dsc.dm",
  "dshs-koeln.de",
  "dstu.dp.ua",
  "dswe.wroc.pl",
  "dti.sk",
  "dtu.dk",
  "du.se",
  "duf.hu",
  "duth.gr",
  "dvgu.ru",
  "dvgups.ru",
  "dypatiluniversity.org",
  "e3i.univ-tours.fr",
  "eap.fr",
  "eap.gr",
  "eap.net",
  "eastafricauniversity.net",
  "eastsomaliauniversity.com",
  "eba-muenchen.de",
  "ebc.mx",
  "ebs-paris.com",
  "ebs.de",
  "ebs.ee",
  "ebsu-edu.net",
  "ec-lille.fr",
  "ec-lyon.fr",
  "ec-nantes.fr",
  "ecam.be",
  "ecam.fr",
  "ece.fr",
  "eciad.bc.ca",
  "ecjtu.jx.cn",
  "ecla.de",
  "ecoles-idrac.com",
  "ecomp.poli.br",
  "edu.edhec.com",
  "edu.escp.eu",
  "edu.htl-villach.at",
  "education.ivanovo.ru",
  "edufr.ch",
  "eduhk.hk",
  "eelouniversity.org",
  "eerie.fr",
  "efau.org",
  "efe.hu",
  "efh-bochum.de",
  "efh-freiburg.de",
  "efh-hannover.de",
  "efh-reutlingen-ludwigsburg.de",
  "efhlu.de",
  "efpg.inpg.fr",
  "efrei.fr",
  "eh-darmstadt.de",
  "ehb.be",
  "ehf.hu",
  "ehl.ch",
  "ehs-dresden.de",
  "ehsal.be",
  "ehu.es",
  "ehu.eus",
  "eieonline.com",
  "eigsi.fr",
  "eiu.am",
  "eivp-paris.fr",
  "ektu.kz",
  "elrazicollege.net",
  "elsu.ru",
  "elte.hu",
  "eltech.ru",
  "em-lyon.com",
  "emanuel.ro",
  "emc-campus.com",
  "emescam.br",
  "ems-mainz.de",
  "emse.fr",
  "emsfj.com",
  "emu.ee",
  "en.via.dk",
  "ena.fr",
  "enac.fr",
  "enae.es",
  "enap.uquebec.ca",
  "enautica.pt",
  "enderuncolleges.com",
  "enes.unam.mx",
  "engec.ru",
  "enic.fr",
  "enim.fr",
  "enise.fr",
  "enit.fr",
  "enitab.fr",
  "enitac.fr",
  "enitiaa-nantes.fr",
  "enm.meteo.fr",
  "enpc.fr",
  "ens-cachan.fr",
  "ens-fcl.fr",
  "ens-lyon.fr",
  "ens-paris-saclay.fr",
  "ens.fr",
  "ens2m.fr",
  "ensae.fr",
  "ensai.fr",
  "ensaia.u-nancy.fr",
  "ensait.fr",
  "ensam.inra.fr",
  "ensat.fr",
  "ensc-lille.fr",
  "ensc-rennes.fr",
  "ensccf.univ-bpclermont.fr",
  "enscm.fr",
  "enscmu.univ-mulhouse.fr",
  "enscp.jussieu.fr",
  "enscpb.u-bordeaux.fr",
  "ensea.fr",
  "enseeiht.fr",
  "ensem.u-nancy.fr",
  "enserb.u-bordeaux.fr",
  "ensg.ign.fr",
  "ensg.u-nancy.fr",
  "ensic.u-nancy.fr",
  "ensica.fr",
  "ensieta.fr",
  "ensitm.fr",
  "ensm-ales.fr",
  "ensm-douai.fr",
  "ensma.fr",
  "ensmp.fr",
  "enspm.u-3mrs.fr",
  "enst-bretagne.fr",
  "enst.fr",
  "ensta.fr",
  "entpe.fr",
  "enu.kz",
  "envt.fr",
  "epf.fr",
  "epfl.ch",
  "epita.fr",
  "epitech.al",
  "epitech.eu",
  "epitech.net",
  "epm.br",
  "eriicta.am",
  "esa-purpan.fr",
  "esad.pt",
  "esc-bordeaux.fr",
  "esc-brest.fr",
  "esc-grenoble.fr",
  "esc-lille.fr",
  "esc-marseille.fr",
  "esc-normandie.fr",
  "esc-pau.fr",
  "esc-rouen.fr",
  "esc-toulouse.fr",
  "escdijon.com",
  "escem.fr",
  "escna.fr",
  "escom.fr",
  "escp.eu",
  "escp.fr",
  "eseo.fr",
  "eshte.pt",
  "esiae.fr",
  "esic.es",
  "esiea.fr",
  "esiee.fr",
  "esigelec.fr",
  "esim.imt-mrs.fr",
  "esitpa.org",
  "eslsca.fr",
  "esm-tbilisi.ge",
  "esmad.ipp.pt",
  "esme.fr",
  "esoft.academy",
  "espam-formationuc.org",
  "espci.fr",
  "essca.asso.fr",
  "essec.fr",
  "esstin.u-nancy.fr",
  "esstu.ru",
  "estacio.br",
  "estp.fr",
  "ethz.ch",
  "etna.io",
  "etsmtl.ca",
  "etu.sorbonne-universite.fr",
  "etu.unistra.fr",
  "etu.upmc.fr",
  "etud.u-pem.fr",
  "eu.spb.ru",
  "euba.sk",
  "euclid.int",
  "eudil.fr",
  "eufh.de",
  "eur.nl",
  "eurazir.kz",
  "europa-uni.de",
  "europeaniu.org",
  "europeanopenuniversity.com",
  "europeanuniversity.pt",
  "euv-frankfurt-o.de",
  "evfh-berlin.de",
  "evfh-nuernberg.de",
  "evtek.fi",
  "fa.cvut.cz",
  "fa.ru",
  "faap.br",
  "facens.br",
  "faculdadescuritiba.br",
  "famu.cz",
  "fanshawec.ca",
  "fanshaweonline.ca",
  "fatimacollege.net",
  "fau.de",
  "fbcusl.8k.com",
  "fcetakoka-edu.net",
  "fecap.br",
  "feituverava.com.br",
  "fern-fh.de",
  "fernuni-hagen.de",
  "ferpi.dem.ru",
  "festu.ru",
  "ffhs.ch",
  "fh-aachen.de",
  "fh-aargau.ch",
  "fh-aschaffenburg.de",
  "fh-augsburg.de",
  "fh-bad-honnef.de",
  "fh-biberach.de",
  "fh-bielefeld.de",
  "fh-bingen.de",
  "fh-bochum.de",
  "fh-brandenburg.de",
  "fh-burgenland.at",
  "fh-dortmund.de",
  "fh-eberswalde.de",
  "fh-erfurt.de",
  "fh-flensburg.de",
  "fh-frankfurt.de",
  "fh-fresenius.de",
  "fh-furtwangen.de",
  "fh-gelsenkirchen.de",
  "fh-giessen.de",
  "fh-hagenberg.at",
  "fh-hamburg.de",
  "fh-hannover.de",
  "fh-heidelberg.de",
  "fh-heilbronn.de",
  "fh-hildesheim.de",
  "fh-hof.de",
  "fh-htachur.ch",
  "fh-htwchur.ch",
  "fh-hwz.ch",
  "fh-isny.de",
  "fh-jena.de",
  "fh-joanneum.at",
  "fh-karlsruhe.de",
  "fh-kempten.de",
  "fh-kiel.de",
  "fh-kl.de",
  "fh-koblenz.de",
  "fh-koeln.de",
  "fh-konstanz.de",
  "fh-landshut.de",
  "fh-lausitz.de",
  "fh-lippe.de",
  "fh-ludwigshafen.de",
  "fh-luebeck.de",
  "fh-mainz.de",
  "fh-mannheim.de",
  "fh-merseburg.de",
  "fh-muenchen.de",
  "fh-muenster.de",
  "fh-nb.de",
  "fh-niederrhein.de",
  "fh-nordhausen.de",
  "fh-nuernberg.de",
  "fh-nuertingen.de",
  "fh-offenburg.de",
  "fh-oow.de",
  "fh-osnabrueck.de",
  "fh-ottersberg.de",
  "fh-pforzheim.de",
  "fh-potsdam.de",
  "fh-regensburg.de",
  "fh-reutlingen.de",
  "fh-riedlingen.de",
  "fh-rosenheim.de",
  "fh-rottenburg.de",
  "fh-schmalkalden.de",
  "fh-schwaebischhall.de",
  "fh-steyr.at",
  "fh-stralsund.de",
  "fh-telekom-leipzig.de",
  "fh-trier.de",
  "fh-wedel.de",
  "fh-weihenstephan.de",
  "fh-weingarten.de",
  "fh-wels.at",
  "fh-westkueste.de",
  "fh-wiesbaden.de",
  "fh-wolfenbuettel.de",
  "fh-worms.de",
  "fh-wuerzburg.de",
  "fh-zwickau.de",
  "fhbb.ch",
  "fhdw.bib.de",
  "fhdw.de",
  "fhkt.de",
  "fhm-mittelstand.de",
  "fhnon.de",
  "fhnw.ch",
  "fhoebb.de",
  "fhs-mannheim.de",
  "fhs-moritzburg.de",
  "fhsg.ch",
  "fhso.ch",
  "fht-stuttgart.de",
  "fhtw-berlin.de",
  "fhv.at",
  "fhvr.berlin.de",
  "fhw-berlin.de",
  "fhw.at",
  "fhwt.de",
  "fic.br",
  "filmacademy.hu",
  "filmowka.lodz.pl",
  "finki.ukim.mk",
  "firstnationsuniversity.ca",
  "fit.cvut.cz",
  "floridauniversitaria.es",
  "fom.de",
  "fomicgroup.cm",
  "forest.lviv.ua",
  "foundationu.com",
  "foundationuniversity.com",
  "franko.lviv.ua",
  "fri.icfre.gov.in",
  "fs-students.de",
  "fs.de",
  "ftacademy.ru",
  "ftmsglobal.com",
  "fu-berlin.de",
  "fua.br",
  "fupl.asso.fr",
  "furb.rct-sc.br",
  "furg.br",
  "g.nsu.ru",
  "gallus.pl",
  "gasu.ru",
  "gbrownc.on.ca",
  "gbs-ge.ch",
  "gcd.ie",
  "gemsvilleuniversity.com",
  "georgiancollege.ca",
  "ghanacu.org",
  "gipe.ernet.in",
  "gitis.net",
  "giuedu.bz",
  "gju.ernet.in",
  "gkvharidwar.org",
  "global-business-school.org",
  "gma.ru",
  "gmc.cc.ga.us",
  "gmit.ie",
  "gnduonline.org",
  "gnesin-academy.ru",
  "golapolytechnic.org",
  "gollisuniversity.com",
  "gorganiau.ir",
  "gorny-ins.ru",
  "government.ind.in",
  "gpma.ru",
  "greenheartmed.org",
  "grenoble-em.com",
  "grenoble-inp.fr",
  "groupe-esa.com",
  "groupeiscae.ma",
  "grsmu.by",
  "grsu.by",
  "gsba.ch",
  "gstu.gomel.by",
  "gsu.unibel.by",
  "gsyc.es",
  "gti.spb.ru",
  "gturp.spb.ru",
  "gu.nic.in",
  "gu.se",
  "gubkin.ru",
  "guc.co.bw",
  "gujaratuniversity.org.in",
  "gukit.ru",
  "gulbargauniversity.kar.nic.in",
  "gulfuniversity.net",
  "gurukuluniversity.org",
  "guu.ru",
  "gwsh.pl",
  "h-brs.de",
  "h-da.de",
  "ha.be",
  "halifaxuni.ac",
  "hamk.fi",
  "hanseuni.de",
  "hanu.vn",
  "hanuniversity.com",
  "hanze.nl",
  "hargeisauniversity.net",
  "hau.ernet.in",
  "haw-hamburg.de",
  "hawlermu.org",
  "haybusak.org",
  "hb.se",
  "hbafa.com",
  "hcu-hamburg.de",
  "hcuge.ch",
  "hdk.gu.se",
  "hdm-stuttgart.de",
  "hebeiuniteduniversity.com",
  "hec.ca",
  "hec.fr",
  "hei.fr",
  "heidenheim.dhbw.de",
  "heilbronn.dhbw.de",
  "helpnet.uliege.be",
  "helsinki.fi",
  "hep-bejune.ch",
  "hepl.ch",
  "hepvs.ch",
  "hertie-school.org",
  "herzen.spb.ru",
  "hes-so.ch",
  "hfb.de",
  "hff-muenchen.de",
  "hfg-gmuend.de",
  "hfh.ch",
  "hfk-bremen.de",
  "hfk2020.de",
  "hfm-detmold.de",
  "hfmdd.de",
  "hfmt-koeln.de",
  "hfp.mhn.de",
  "hfph.mwn.de",
  "hgkz.ch",
  "hgo.se",
  "hh.se",
  "hha.dk",
  "hhl.de",
  "hhrtu.com",
  "hhs.dk",
  "hhs.se",
  "hhu.de",
  "hi.is",
  "hia.no",
  "hib.no",
  "hibo.no",
  "hiete.hu",
  "hifm.no",
  "hig.se",
  "hiiraanuniversity.info",
  "hik.se",
  "hil.no",
  "hillagric.ernet.in",
  "himh.de",
  "himolde.no",
  "his.se",
  "hj.se",
  "hjs.uni-heidelberg.de",
  "hkkk.fi",
  "hkr.se",
  "hku.hk",
  "hku.nl",
  "hmdk-stuttgart.de",
  "hmt-leipzig.de",
  "hmtm-hannover.de",
  "hmtm.de",
  "hmu.gr",
  "hnaubenin.org",
  "hnfjxy.cn",
  "hnluraipur.com",
  "hochschule-bonn-rhein-sieg.de",
  "hoduniv.net.ye",
  "hogent.be",
  "holar.is",
  "hopeafricauniversity.org",
  "hotelschool.com.au",
  "hotelschool.nl",
  "howest.be",
  "hpuniv.nic.in",
  "hqgc.net",
  "hr.nl",
  "hro.nl",
  "hs-albsig.de",
  "hs-anhalt.de",
  "hs-bremen.de",
  "hs-bremerhaven.de",
  "hs-coburg.de",
  "hs-duesseldorf.de",
  "hs-esslingen.de",
  "hs-fulda.de",
  "hs-hannover.de",
  "hs-harz.de",
  "hs-magdeburg.de",
  "hs-mittweida.de",
  "hs-neu-ulm.de",
  "hs-rm.de",
  "hs-ulm.de",
  "hs-wismar.de",
  "hs-zigr.de",
  "hse.ru",
  "hsleiden.nl",
  "hslu.ch",
  "hsr.ch",
  "hsum-ac.mn",
  "hsvest.is",
  "htl-villach.at",
  "htl-wels.at",
  "htu.se",
  "htw-berlin.de",
  "htw-dresden.de",
  "htw-saarland.de",
  "htwk-leipzig.de",
  "htwm.de",
  "hu-berlin.de",
  "hu.nl",
  "hua.gr",
  "huflit.vnn.vn",
  "humanities.mn",
  "humber.ca",
  "humbermail.ca",
  "hunau.net",
  "hupe.hu",
  "huronuc.on.ca",
  "hut.fi",
  "hva.nl",
  "hvanneyri.is",
  "hwg-lu.de",
  "hwp-hamburg.de",
  "hzs.be",
  "i-u.de",
  "iacademy.ph",
  "iade.pt",
  "iae-france.fr",
  "iaf.inrs.ca",
  "iaim.ro",
  "iap.li",
  "iari.ernet.in",
  "iaseduniv.org",
  "iate.obninsk.ru",
  "iaukb.ir",
  "iaumehriz.com",
  "ibch.ru",
  "ibi.spb.ru",
  "ibp-moscow.ru",
  "ibs.uz",
  "ibss.eu",
  "icam.fr",
  "icfai.org",
  "ichec.be",
  "ici-luzern.com",
  "icn-nancy.com",
  "icp.fr",
  "ict-toulouse.asso.fr",
  "ictp.trieste.it",
  "icu-edu.org",
  "ieeu.udm.ru",
  "iep.u-bordeaux.fr",
  "ieseg.fr",
  "iet.ru",
  "if-pan.krakow.pl",
  "ifdtung.if.ua",
  "ifg.com.pl",
  "ifheindia.org",
  "ifmo.ru",
  "ifmparis.fr",
  "ifp.fr",
  "igims.org",
  "iha.dk",
  "ihi-zittau.de",
  "ihk.dk",
  "ihteamlingue.it",
  "ihu.gr",
  "iiita.com",
  "iiits.in",
  "iipsindia.org",
  "iisc.ernet.in",
  "iit.com.na",
  "iitd.ernet.in",
  "iitg.ernet.in",
  "iitkgp.ernet.in",
  "iiuedu.ie",
  "iksvv.com",
  "ilisimatusarfik.gl",
  "imbt.ma",
  "imd.org",
  "ime.eb.mil.br",
  "ime.ru",
  "imi-luzern.com",
  "impa.br",
  "imt-atlantique.net",
  "imtlucca.it",
  "indianatech.net",
  "info.kma.lt",
  "inholland.nl",
  "inp-fc.fr",
  "inp.pt",
  "inpg.fr",
  "inpl-nancy.fr",
  "inrs.uquebec.ca",
  "insa-lyon.fr",
  "insa-rennes.fr",
  "insa-rouen.fr",
  "insa-tlse.fr",
  "insa-toulouse.fr",
  "inseec.fr",
  "insel.ch",
  "int-evry.fr",
  "international.fh-aalen.de",
  "internationaluniversity-schoolofmedicine.org",
  "intstudy.mai.ru",
  "inuaf-studia.pt",
  "ionio.gr",
  "ipb.pt",
  "ipbeja.pt",
  "ipc.dk",
  "ipc.pt",
  "ipca.pt",
  "ipcb.pt",
  "ipdbuu.com.cn",
  "ipg.pt",
  "ipiaget.org",
  "ipl.pt",
  "ipleiria.pt",
  "ipp.pt",
  "ipportalegre.pt",
  "ips.pt",
  "ipsa.fr",
  "ipsantarem.pt",
  "ipt.pt",
  "ipvc.pt",
  "iraquniversity.net",
  "ircam.fr",
  "ireste.fr",
  "isa.fupl.asso.fr",
  "isaacnewtoncr.com",
  "isab.fr",
  "isai.pt",
  "isara.fr",
  "isbb.pt",
  "isbm-school.com",
  "isbm.org.in",
  "iscet.pt",
  "iscte-iul.pt",
  "iscte.pt",
  "isea.irk.ru",
  "isea.ru",
  "isen.fr",
  "isep.fr",
  "isetr.rnu.tn",
  "iseu.by",
  "isg.pt",
  "isg.rnu.tn",
  "isim.univ-montp2.fr",
  "isla.pt",
  "islahonline.org",
  "islamiccolleges.com",
  "islamicuniversity.nl",
  "ism-dortmund.de",
  "ism.lt",
  "isma.indi.ru",
  "ismcm-cesti.fr",
  "ismpo.sk",
  "ismra.fr",
  "isnm.de",
  "iso.fr",
  "ispa.pt",
  "ispab.pt",
  "ispcmw.rimed.cu",
  "ispgaya.pt",
  "ispu.ru",
  "iss.nl",
  "ist-hochschule.de",
  "istec.pt",
  "istp.fr",
  "istp.pt",
  "istu.irk.ru",
  "istu.ru",
  "isu.ru",
  "isuct.ru",
  "isvouga.com",
  "ita.br",
  "ita.mx",
  "italo.br",
  "itam.mx",
  "itbmu.org.mm",
  "itc.mx",
  "itc.nl",
  "itcarlow.ie",
  "itech.fr",
  "iteso.mx",
  "iti.is",
  "itismalta.com",
  "itmo.ru",
  "itpu.uz",
  "itson.mx",
  "itt-tech.info",
  "ittralee.ie",
  "itu.dk",
  "iu-travnik.com",
  "iuav.unive.it",
  "iubh-fernstudium.de",
  "iubnt.yar.ru",
  "iubs.co.uk",
  "iue.it",
  "iuil.lu",
  "iuk.kg",
  "iulm.it",
  "iun.ch",
  "iuo.it",
  "iuoart.org",
  "iusspavia.it",
  "ivri.nic.in",
  "iztapalapa.uam.mx",
  "jacobs-university.de",
  "jainuniversity.org",
  "jammuvarsity.org",
  "jcu.cz",
  "jedlik.eu",
  "jeffstateonline.com",
  "jeppiaarcollege.org",
  "jhubc.it",
  "jisiasr.org",
  "jisiop.org",
  "jismsr.org",
  "jku.at",
  "jmi.nic.in",
  "jnkvv.nic.in",
  "jodhpurnationaluniversity.com",
  "joensuu.fi",
  "jpte.hu",
  "jpv.bih.nic.in",
  "jrnrvu.org",
  "jum.ru",
  "jussieu.fr",
  "jutcm.com",
  "jvlma.lv",
  "jyu.fi",
  "kai.ru",
  "kalingauniversity.com",
  "kalmsu.ru",
  "kamgu.ru",
  "kannadauniversity.org",
  "kanpuruniversity.org",
  "kantiana.ru",
  "karazin.ua",
  "karch.dk",
  "karlshochschule.de",
  "karlsruhe.dhbw.de",
  "karnatakastateopenuniversity.in",
  "karpagamuniv.com",
  "karuniversity.com",
  "kashmiruniversity.net",
  "kasuportal.net",
  "kath-fh-nord.de",
  "kau.kz",
  "kau.se",
  "kazanconservatory.ru",
  "kazeu.kz",
  "kaznpu.kz",
  "kazntu.kz",
  "kaznu.kz",
  "kbocc.org",
  "kbsu.ru",
  "kbtu.kz",
  "kdg.be",
  "kdu.md",
  "kee.hu",
  "kemsu.ru",
  "kfb-berlin.de",
  "kfh-freiburg.de",
  "kfh-mainz.de",
  "kfhnw.de",
  "kgmu.kcn.ru",
  "kgpu.ru",
  "kgre.hu",
  "kgtu.runnet.ru",
  "kh-berlin.de",
  "khadi.kharkov.ua",
  "khawarizmi.com",
  "khazar.org",
  "khi.is",
  "khio.no",
  "khk.be",
  "khleuven.be",
  "khlim.be",
  "khsa.de",
  "khspu.ru",
  "khstu.ru",
  "ki.se",
  "kidu-darululum.blogspot.com",
  "kii.gov.by",
  "kimep.kz",
  "kingsu.ab.ca",
  "kiu.ru",
  "klgtu.ru",
  "kma.mk.ua",
  "knastu.ru",
  "knau.kg",
  "kneu.kiev.ua",
  "knightsbridgeuniversity.com",
  "knruhs.telangana.gov.in",
  "knu.ua",
  "kodolanyi.hu",
  "kolieh.com",
  "konstfack.se",
  "koyauniversity.org",
  "kpi.kharkov.ua",
  "kpi.ua",
  "kpu.ca",
  "kristiania.no",
  "ksaba.ru",
  "ksbk-do.de",
  "kse.org.ua",
  "ksfei.ru",
  "ksfh.de",
  "ksmu.kharkov.ua",
  "ksmu.kursknet.ru",
  "kspu.kaluga.ru",
  "kspu.ptz.ru",
  "kstu.kg",
  "kstu.kursk.ru",
  "kstu.kz",
  "kstuca.kharkov.ua",
  "ksu.kst.kz",
  "ksu.kz",
  "ksu.ru",
  "ksucta.kg",
  "kth.se",
  "ktu.lt",
  "ku-eichstaett.de",
  "ku.dk",
  "ku.lt",
  "ku.sk",
  "kubagro.ru",
  "kubstu.ru",
  "kubsu.ru",
  "kudqi.net.my",
  "kukinfo.com",
  "kul.lublin.pl",
  "kulak.kuleuven.be",
  "kuleuven.be",
  "kumaununiversity.org",
  "kumsa.net",
  "kunstakademie-duesseldorf.de",
  "kunstakademiet.dk",
  "kursk-uni.ru",
  "kuva.fi",
  "kuwarangal.com",
  "kvl.dk",
  "kwantlen.bc.ca",
  "lacounty.org",
  "lagh-univ.dz",
  "lakeheadu.ca",
  "lakeland.cc.il.us",
  "lama.lv",
  "lamar.org.mx",
  "lambtoncollege.ca",
  "lamk.fi",
  "langara.bc.ca",
  "langara.ca",
  "lansbridge.com",
  "lasalleuniversities.net",
  "laspotech.net",
  "lasunigeria.org",
  "laurea.fi",
  "laurentian.ca",
  "lazarski.pl",
  "lbtu.lv",
  "lcc.lt",
  "lcst.ac",
  "ldceahd.org",
  "lef.upn.mx",
  "leon.uia.mx",
  "lethbridgecollege.ca",
  "leuphana.de",
  "lfze.hu",
  "lgpu.lg.ua",
  "lhi.is",
  "lhs.se",
  "lib.klte.hu",
  "libopenuniv-edu.org",
  "liccsalsl.org",
  "lidapoly.com",
  "limt.co.uk",
  "liu.se",
  "liuc.it",
  "lka.lt",
  "lkka.lt",
  "llu.lv",
  "lma.lv",
  "lmta.lt",
  "lmu.de",
  "ln.hk",
  "lnmu.bih.nic.in",
  "lnu.evis.net.ph",
  "lpu.in",
  "lrguas.ch",
  "lsb.ie",
  "lsbf.org.uk",
  "lspa.lanet.lv",
  "ltu.bg",
  "lu.lv",
  "lu.se",
  "lucknowuniv.org",
  "luiss.it",
  "lumsa.it",
  "lunn.sci-nnov.ru",
  "lut.fi",
  "luth.se",
  "lva.lt",
  "lzua.lt",
  "ma.odessa.ua",
  "maakhiruniversity.net",
  "macewan.ca",
  "macfast.org",
  "mackenzie.br",
  "madenatalelem.com",
  "madi.ru",
  "magadhuniversity.org",
  "mah.se",
  "mahendradatta.org",
  "mail.polimi.it",
  "mala.bc.ca",
  "man.radom.pl",
  "manas.kg",
  "mannheim.dhbw.de",
  "margu.mari.ru",
  "marstu.mari.ru",
  "masu.ru",
  "maua.br",
  "may.ie",
  "mcgill.ca",
  "mcmaster.ca",
  "mdh.se",
  "mdis.uz",
  "mdurohtak.com",
  "mechnik.spb.ru",
  "med.sgu.ru",
  "medilam.hbi.ir",
  "medin.nsc.ru",
  "meduni-graz.at",
  "meduniv.lviv.ua",
  "meduniver.gomel.by",
  "meduniversity-plovdiv.bg",
  "meduniwien.at",
  "megatrend-edu.net",
  "mendelu.cz",
  "merkur-fh.org",
  "merz-akademie.de",
  "mesi.ru",
  "metropolia.fi",
  "mfh-iserlohn.de",
  "mgavm.ru",
  "mgimo.ru",
  "mgpu.gomel.by",
  "mgri-rggru.ru",
  "mgsu.norna.ru",
  "mgu.bg",
  "mh-hannover.de",
  "mh-luebeck.de",
  "mh-trossingen.de",
  "miet.ru",
  "mif.hu",
  "miigaik.ru",
  "miit.ru",
  "mil.lv",
  "mines-ales.fr",
  "mines-ales.org",
  "mines.u-nancy.fr",
  "miom.org",
  "mipt.ru",
  "mirbis.ru",
  "mirea.ru",
  "misis.ru",
  "miu.by",
  "miu.ru",
  "miun.se",
  "miva.university",
  "mkuhyd.com",
  "mkv2.mah.nic.in",
  "mma.ru",
  "mmibordeaux.com",
  "mogadishuuniversity.com",
  "mohawkcollege.ca",
  "montaigne.u-bordeaux.fr",
  "montesquieu.u-bordeaux.fr",
  "moorelanduniversity.com",
  "mosbach.dhbw.de",
  "mosconsv.ru",
  "mosgu.ru",
  "most.gov.mm",
  "motolinia.com.mx",
  "mpbou.org",
  "mpgu.su",
  "mpkv.mah.nic.in",
  "mpu-prague.cz",
  "mrsu.ru",
  "mruni.eu",
  "msa.eun.eg",
  "msaab.ru",
  "msiu.ru",
  "mslu.by",
  "mstuca.ru",
  "msu.mogilev.by",
  "msu.ru",
  "msuee.ru",
  "msuie.ru",
  "msvu.ca",
  "mta.ca",
  "mta.ro",
  "mtroyal.ca",
  "mtu.ie",
  "mtuci.ru",
  "mu-luebeck.de",
  "mu-pleven.bg",
  "mu-sofia.bg",
  "mu-varna.bg",
  "mu.fapenet.org",
  "muh.ru",
  "muni.cz",
  "muni.es",
  "musik-kons.dk",
  "musikhochschule-muenchen.de",
  "muthesius.de",
  "my.ipleiria.pt",
  "mycambrian.ca",
  "mylambton.ca",
  "mylaurier.ca",
  "mylcp.net",
  "mymtu.ie",
  "myscc.ca",
  "myseneca.ca",
  "mytum.de",
  "n-nov.mednet.com",
  "naba.it",
  "nagauniv.org.in",
  "nagpur-university.com",
  "nait.ca",
  "nalandaopenuniversity.info",
  "nancy.archi.fr",
  "natfiz.bg",
  "nauu.kiev.ua",
  "nawrozuniversity.com",
  "nbu.bg",
  "ncirl.ie",
  "ncstu.ru",
  "ndpi.uz",
  "ndri.nic.in",
  "ndu.fapenet.org",
  "nduat.nic.in",
  "neic.nsk.su",
  "nes.ru",
  "newtonpaiva.br",
  "newworld.ac",
  "ngasu.sci-nnov.ru",
  "ngha.med.sa",
  "nha-bg.org",
  "nhh.no",
  "nhtv.nl",
  "nhv.se",
  "niab.org.pk",
  "niagaracollege.ca",
  "nibm.lk",
  "nic.bc.ca",
  "nih.no",
  "nilc.spb.ru",
  "nimhans.kar.nic.in",
  "nims.ap.nic.in",
  "nims.net.in",
  "nipissingu.ca",
  "nitap.in",
  "nith.no",
  "nitkkr.net",
  "nitsri.net",
  "nitw.ernet.in",
  "niu.org.uk",
  "niuitmo.ru",
  "njuts.cn",
  "nkrriwf.pl",
  "nkzu.kz",
  "nla.no",
  "nlc.bc.ca",
  "nlh.no",
  "nma.bg",
  "nmh.no",
  "nmu.org.ua",
  "nntu.sci-nnov.ru",
  "nommensen.org",
  "nooruse.ee",
  "nordakademie.de",
  "nosu.ru",
  "novasbe.unl.pt",
  "nsa.bg",
  "nsac.ns.ca",
  "nsbm.lk",
  "nscad.ns.ca",
  "nsmu.ru",
  "nstu.ru",
  "nsu.ru",
  "nt.gov.au",
  "ntb.ch",
  "ntnu.no",
  "ntruhs.ap.nic.in",
  "ntu.kar.net",
  "ntua.gr",
  "nu-online.com",
  "nugaaluniversity.com",
  "nui.ie",
  "nuigalway.ie",
  "nul.ls",
  "nulaoag.com",
  "nure.ua",
  "nuu.uz",
  "nvit.bc.ca",
  "nwpi.ru",
  "nyenrode.nl",
  "nyme.hu",
  "nyuniversity.net",
  "oamk.fi",
  "obonguniversity.net",
  "ocad.ca",
  "odisee.be",
  "oecu.jp",
  "ogasa.odessa.ua",
  "oist.jp",
  "ojaiusd.org",
  "okanagan.bc.ca",
  "omgau.ru",
  "omgtu.ru",
  "omgups.ru",
  "omsk-osma.ru",
  "ontariotechu.ca",
  "ontariotechu.net",
  "op.org",
  "opu.odessa.ua",
  "oradeauniversity.co",
  "oradeauniversity.com",
  "oru.se",
  "orun.ru",
  "oryxschool.qa",
  "osaft.odessa.ua",
  "oshmed.com",
  "osmu.odessa.ua",
  "ostfalia.de",
  "osu.cz",
  "osu.ru",
  "oth-aw.de",
  "ou.dk",
  "ou.nl",
  "oulu.fi",
  "ovidunivconstanta-edu.org",
  "p.lodz.pl",
  "pac.by",
  "paderborn.de",
  "padmavatiwomen-univ.org",
  "pakistanhomoeopathy.com",
  "pam.szczecin.pl",
  "panteion.gr",
  "paris-sorbonne.fr",
  "paris.ensam.fr",
  "paris4.sorbonne.fr",
  "parisnanterre.fr",
  "pb.bialystok.pl",
  "pcz.czest.pl",
  "pedago.pt",
  "peizheng.com.cn",
  "perbanas.id",
  "petrsu.ru",
  "pfh-goettingen.de",
  "pg.gda.pl",
  "pgimer.nic.in",
  "pglu.ru",
  "ph-erfurt.de",
  "ph-freiburg.de",
  "ph-gmuend.de",
  "ph-gr.ch",
  "ph-heidelberg.de",
  "ph-karlsruhe.de",
  "ph-ludwigsburg.de",
  "ph-weingarten.de",
  "pharmi.uz",
  "phbern.ch",
  "philtheol-augustin.de",
  "phlu.ch",
  "phsg.ch",
  "phsz.ch",
  "phtg.ch",
  "phw.info",
  "phzg.ch",
  "phzh.ch",
  "picollege.ca",
  "pio.urbe.it",
  "pma.ph",
  "pnumanila.com.ph",
  "pnzgu.ru",
  "po.opole.pl",
  "pol.lublin.pl",
  "poli.br",
  "poliba.it",
  "polimi.it",
  "polito.it",
  "polito.uz",
  "polsl.gliwice.pl",
  "polsl.pl",
  "polymtl.ca",
  "polytech-lille.fr",
  "polytech-marseille.fr",
  "polytechnic-kabul.org",
  "polytechnique.fr",
  "polyunwana.net",
  "pomorsu.ru",
  "pondiuni.org",
  "pop-to.rnp.br",
  "popakademie.de",
  "pote.hu",
  "ppke.hu",
  "praguecollege.cz",
  "pref.shiga.lg.jp",
  "privatfh-da.de",
  "prz.rzeszow.pl",
  "psfa.ru",
  "psma.ru",
  "psu.by",
  "psu.kz",
  "psu.ru",
  "psy.lv",
  "pte.hu",
  "ptetjnvu.org",
  "pth-bb.de",
  "pth-muenster.de",
  "pthv.de",
  "pu.if.ua",
  "pu.kielce.pl",
  "pub.ro",
  "puc-rio.br",
  "puccamp.br",
  "pucminas.br",
  "pucpr.br",
  "pucrs.br",
  "pucsp.br",
  "pul.it",
  "puntlandstateuniversity.com",
  "puonline.bih.nic.in",
  "pusavarsity.org.in",
  "pusc.it",
  "pust.net",
  "pust.urbe.it",
  "put.poznan.pl",
  "puv.fi",
  "pv-ma.bg",
  "pwr.wroc.pl",
  "pwst.krakow.pl",
  "pwsz.eu",
  "pwsz.pila.pl",
  "pwu.com",
  "pz.zgora.pl",
  "qdpi.uz",
  "quadratacademy.com",
  "queensu.ca",
  "questu.ca",
  "rabindrabharatiuniversity.net",
  "rah.ru",
  "rajalakshmi.org",
  "rakmhsu.com",
  "ramk.fi",
  "ranchiuniversity.org.in",
  "rau.am",
  "rau.lv",
  "rau.ro",
  "raubikaner.org",
  "rauheshaus.de",
  "ravensburg.dhbw.de",
  "rcpi.ie",
  "rcsi-mub.com",
  "rcsi.ie",
  "rdunijbpin.org",
  "rea.ru",
  "redeemer.ca",
  "reduaeh.mx",
  "reduaz.mx",
  "regentghana.net",
  "rennes-sb.com",
  "rfh-koeln.de",
  "rgata.yaroslavl.ru",
  "rgtu.net",
  "ritchennai.org",
  "rmc.ca",
  "rmstu.portal.gov.bd",
  "roac.nl",
  "rosey.ch",
  "royalroads.ca",
  "rpiva.lv",
  "rshu.ru",
  "rsm.nl",
  "rsmu.da.ru",
  "rsmu.ru",
  "rsu.ru",
  "rsuh.ru",
  "rsuniversity.com",
  "rsute.ru",
  "rtu.lv",
  "ru.acad.bg",
  "ru.is",
  "ru.lv",
  "ru.nl",
  "ruc.dk",
  "rug.nl",
  "ruhr-uni-bochum.de",
  "ruraluniversity-chitrakoot.org",
  "rusoil.net",
  "rwth-aachen.de",
  "ryerson.ca",
  "s.eduhk.hk",
  "saadcollege.com",
  "sabauni.net",
  "sabi.eu.com",
  "sacrocuore.org",
  "sagaruniversity.nic.in",
  "sait.ca",
  "sakhgu.sakhalin.ru",
  "samara.university",
  "sambalpuruniversitypgc.in",
  "samdu.uz",
  "samiit.ru",
  "samk.fi",
  "samsmu.ru",
  "sanaaguniversity.com",
  "sangu.ge",
  "sanskrit.nic.in",
  "saojudas.br",
  "sapanet.ru",
  "sas-sd.net",
  "sau.sumy.ua",
  "sauder.ubc.ca",
  "saveetha.com",
  "saveethaengineering.com",
  "scar.utoronto.ca",
  "schillerparis.com",
  "schillerstrasbourg.com",
  "sciences-po.fr",
  "sciencespo-rennes.fr",
  "sciencespo.fr",
  "sclondon.ac",
  "scp.fi",
  "sctimst.ker.nic.in",
  "sdu.dk",
  "secretarialuz.org",
  "secupv.org",
  "sekuco.org",
  "selk.de",
  "selkirk.bc.ca",
  "selyeuni.sk",
  "semgu.kz",
  "sempreceub.com",
  "sendaidaigaku.jp",
  "senecacollege.ca",
  "setur.fo",
  "seua.am",
  "sevntu.com.ua",
  "sevs.sk",
  "sfa.ba",
  "sfu.ca",
  "sgap.ru",
  "sgau.ru",
  "sggw.waw.pl",
  "sgh.waw.pl",
  "sgma.info",
  "sgma.kz",
  "sgu.ernet.in",
  "sgu.ru",
  "sh-sipopolytechnic.com",
  "sh.se",
  "shannoncollege.com",
  "sheridancollege.ca",
  "shh.fi",
  "shouhua.net.cn",
  "shu-bg.net",
  "shu.smolensk.su",
  "sia.ae",
  "siba.fi",
  "sibiu.ro",
  "sibsiu.kemerovo.su",
  "siewerth-akademie.de",
  "sigu7.jussieu.fr",
  "sisekaitse.ee",
  "sissa.it",
  "siu-heidelberg.de",
  "sjdlc.com",
  "sjsm.org",
  "sjsv.nic.in",
  "skuniv.ap.nic.in",
  "skylineuniversity.com",
  "slam.katowice.pl",
  "sliate.net",
  "sliit.lk",
  "slu.cz",
  "slu.se",
  "smarcos.br",
  "smithseminary.org",
  "smkfomra.net",
  "smolny-un.spb.ru",
  "smtu.ru",
  "smu.ca",
  "sns.it",
  "snspa.ro",
  "somtech.org",
  "sorbon.fr",
  "sorbonne-universite.fr",
  "sorbonne.ae",
  "sote.hu",
  "sothebysinstitutelondon.com",
  "southasianuniversity.org",
  "sp.senac.br",
  "spartanmed.org",
  "spbau.ru",
  "spbgasu.ru",
  "spbgau.spb.ru",
  "spbguki.ru",
  "spbiir.ru",
  "spbstu.ru",
  "spbtei.ru",
  "spbu.ru",
  "spbuwc.ru",
  "spcpa.ru",
  "spiruharet.ro",
  "spjain.org",
  "spsmb.cz",
  "spsmma.com",
  "spu.ba",
  "spuniv.org",
  "srh-berlin.de",
  "srisathyasai.org.in",
  "srkdc.org",
  "srtmun.org",
  "ssaa.ru",
  "ssaba.smr.ru",
  "ssau.ru",
  "sse.army.gr",
  "sse.gr",
  "ssea.runnet.ru",
  "sseu.ru",
  "ssgmce.org",
  "ssmu.ru",
  "sssup.it",
  "ssttu.samara.ru",
  "sstu-edu.ru",
  "sstu.samara.ru",
  "ssu.komi.com",
  "ssu.samara.ru",
  "ssvv.up.nic.in",
  "st-georgen.uni-frankfurt.de",
  "stankin.ru",
  "stavsu.ru",
  "stb.iau.ir",
  "stcecilia.br",
  "stclairc.on.ca",
  "stclairconnect.ca",
  "stenden.com",
  "stfx.ca",
  "stjosephsgroup.org",
  "stmarys.ca",
  "stmu.org",
  "stockholm-fu.com",
  "stthomasu.ca",
  "stu.lipetsk.ru",
  "stu.ru",
  "stuba.sk",
  "stud.hs-hannover.de",
  "stud.vilniustech.lt",
  "studbocconi.it",
  "student.42.fr",
  "student.42.us.org",
  "student.aau.dk",
  "student.hs-anhalt.de",
  "student.karazin.ua",
  "student.kuleuven.be",
  "student.lamk.fi",
  "student.laurea.fi",
  "student.lut.fi",
  "student.maastrichtuniversity.nl",
  "student.spsmb.cz",
  "student.tudelft.nl",
  "student.uliege.be",
  "student.unisg.ch",
  "student.upt.ro",
  "students.finki.ukim.mk",
  "students.jedlik.eu",
  "students.vizja.pl",
  "stw.de",
  "su.digitaluniversity.ac",
  "su.lt",
  "su.se",
  "suai.ru",
  "suh-edu.com",
  "supaero.fr",
  "supbiotech.fr",
  "supco-amiens.fr",
  "supco-montpellier.fr",
  "supelec.fr",
  "supsi.ch",
  "suptelecom.net.ma",
  "surgu.wsnet.ru",
  "sut.ru",
  "sutd.ru",
  "svbpuctm.org",
  "sve-mo.ba",
  "svimstpt.ap.nic.in",
  "svuni.ap.nic.in",
  "svuonline.org",
  "swc.tc",
  "swissmc.ch",
  "swissu.org",
  "swps.pl",
  "swsm.cn",
  "swtjc.net",
  "swu.bg",
  "synergy.ru",
  "synergy.university",
  "sze.hu",
  "szie.hu",
  "szu.sk",
  "taizun.net",
  "tajagroun.tj",
  "tanuvas.com",
  "taoistcollege.org.sg",
  "tart.spb.ru",
  "tashgiv.uz",
  "tauedu.org",
  "tayi.uz",
  "tbcc.cc.or.us",
  "tcd.ie",
  "tcetmumbai.in",
  "tdiu.uz",
  "tdtu.uz",
  "teak.fi",
  "tec.mx",
  "tecbc.mx",
  "technikum-wien.at",
  "techniqueedu.com",
  "tecmilenio.mx",
  "teluq.uquebec.ca",
  "teologi.dk",
  "termnet.co.jp",
  "tezu.ernet.in",
  "tfh-berlin.de",
  "tfh-bochum.de",
  "tfh-wildau.de",
  "tfi.uz",
  "tgnu.tarena.tj",
  "tgpi.ttn.ru",
  "tgsha.ru",
  "th-brandenburg.de",
  "th-deg.de",
  "th-koeln.de",
  "th-rosenheim.de",
  "tha.de",
  "theatrins-yar.ru",
  "thh-friedensau.de",
  "thi.de",
  "thierryschool.org",
  "thiqaruni.org",
  "thm.de",
  "thomasmore.be",
  "thu.de",
  "thuniv.net",
  "ties.com.mx",
  "tietgen.dk",
  "tiffinprague.cz",
  "tiho-hannover.de",
  "tiim.uz",
  "tilburguniversity.nl",
  "timacad.ru",
  "tiu.tj",
  "tiu.uz",
  "tkbf.hu",
  "tktk.ee",
  "tltsu.ru",
  "tlu.ee",
  "tma.uz",
  "tmbu.org",
  "tndalu.org",
  "tnu.crimea.ua",
  "tnuni.sk",
  "toledo.br",
  "torontomu.ca",
  "touro.ru",
  "tpu.fi",
  "tpu.ru",
  "trentu.ca",
  "trinity.utoronto.ca",
  "tripurauniv.in",
  "tru.ca",
  "truni.sk",
  "tshmc.org",
  "tsi.lv",
  "tsma.ru",
  "tsogu.ru",
  "tstu.ru",
  "tstu.tver.ru",
  "tsu.ru",
  "tsu.tula.ru",
  "tsuab.ru",
  "tsure.ru",
  "tsvu.nic.in",
  "ttc.ryazan.ru",
  "ttu.ee",
  "tu-berlin.de",
  "tu-braunschweig.de",
  "tu-bryansk.ru",
  "tu-bs.de",
  "tu-chemnitz.de",
  "tu-clausthal.de",
  "tu-cottbus.de",
  "tu-darmstadt.de",
  "tu-dortmund.de",
  "tu-dresden.de",
  "tu-freiberg.de",
  "tu-ilmenau.de",
  "tu-sofia.bg",
  "tu-varna.acad.bg",
  "tu.edu.te.ua",
  "tu.kielce.pl",
  "tu.koszalin.pl",
  "tuc.gr",
  "tudelft.nl",
  "tudublin.ie",
  "tue.nl",
  "tugab.bg",
  "tugraz.at",
  "tuhh.de",
  "tuiasi.ro",
  "tuit.uz",
  "tuke.sk",
  "tukkk.fi",
  "tum.de",
  "tuniv.szczecin.pl",
  "tup.km.ua",
  "turathun.com",
  "turiba.lv",
  "turkistan.kz",
  "tus.ie",
  "tusol.org",
  "tusom.org",
  "tusur.ru",
  "tut.fi",
  "tuvsu.ru",
  "tuzvo.sk",
  "tvcc.cc",
  "tvuni.in",
  "tvz.hr",
  "twu.ca",
  "u-3mrs.fr",
  "u-bordeaux2.fr",
  "u-bourgogne.fr",
  "u-cergy.fr",
  "u-clermont1.fr",
  "u-grenoble3.fr",
  "u-paris10.fr",
  "u-paris2.fr",
  "u-pec.fr",
  "u-pem.fr",
  "u-picardie.fr",
  "u-psud.fr",
  "u-szeged.hu",
  "u7nc.uvt.rnu.tn",
  "ua.es",
  "ua.pt",
  "uaa.mx",
  "uaaan.mx",
  "uab.es",
  "uab.ro",
  "uabc.mx",
  "uabcs.mx",
  "uabjo.mx",
  "uabobo.ci",
  "uac.bj",
  "uac.pt",
  "uacam.mx",
  "uacg.bg",
  "uach.cl",
  "uach.mx",
  "uacj.mx",
  "uaconcagua.cl",
  "uadec.mx",
  "uady.mx",
  "uaem.mx",
  "uaemex.mx",
  "uaf.mx",
  "uag.mx",
  "uagro.mx",
  "uah.es",
  "uahb.sn",
  "uahurtado.cl",
  "uai.cl",
  "uaic.ro",
  "ual.mx",
  "ualberta.ca",
  "ualg.pt",
  "ualm.es",
  "uam.es",
  "uam.mx",
  "uam.refer.ne",
  "uamericas.cl",
  "uams.be",
  "uamsa.net",
  "uan.ao",
  "uan.mx",
  "uandes.cl",
  "uanl.mx",
  "uantof.cl",
  "uantwerpen.be",
  "uapa.ru",
  "uaq.mx",
  "uartdcluj.ro",
  "uas.cl",
  "uas.mx",
  "uasbng.kar.nic.in",
  "uasd.net",
  "uaslp.mx",
  "uasm.md",
  "uasnet.mx",
  "uat.mx",
  "uat.ro",
  "uatla.pt",
  "uatx.mx",
  "uauim.ro",
  "uav.ro",
  "uax.es",
  "uaysen.cl",
  "ub.bw",
  "ub.es",
  "ub.ro",
  "uba.ar",
  "ubbcluj.ro",
  "ubc.ca",
  "ubfc.fr",
  "ubi.pt",
  "ubiobio.cl",
  "ubishops.ca",
  "ubm.ro",
  "ubohiggins.cl",
  "ubolivariana.cl",
  "ubouake.ci",
  "ubritanica.cl",
  "ubu.es",
  "ubuea.cm",
  "uc.cl",
  "uc.pt",
  "uc.rnu.tn",
  "uc3m.es",
  "uca.es",
  "uca.fr",
  "ucaat.com",
  "ucad.sn",
  "ucalgary.ca",
  "ucapanama.org",
  "ucasal.net",
  "ucavila.es",
  "ucb.br",
  "ucbc.org",
  "ucc.ie",
  "uccb.ns.ca",
  "uccm.md",
  "ucd.ie",
  "ucdconnect.ie",
  "ucentral.cl",
  "ucervantes.cl",
  "ucg.br",
  "ucg.ie",
  "uchceu.es",
  "uchile.cl",
  "ucimed.com",
  "ucinf.cl",
  "uclm.es",
  "uclouvain.be",
  "ucm.cl",
  "ucm.es",
  "ucm.sk",
  "ucn.cl",
  "ucna.info",
  "ucnh.org",
  "uco.es",
  "uco.fr",
  "ucol.mx",
  "ucp.br",
  "ucp.pt",
  "ucpel.tche.br",
  "ucs.mun.ca",
  "ucs.tche.br",
  "ucsal.br",
  "ucsc.cl",
  "ucsh.cl",
  "uctem.cl",
  "ucv.cl",
  "ucv.es",
  "ucv.ve",
  "uda.ad",
  "uda.cl",
  "udb.sn",
  "udc.es",
  "udc.gal",
  "udec.cl",
  "udelmar.cl",
  "udesarrollo.cl",
  "udesc.br",
  "udesmontagnes.org",
  "udg.co.cu",
  "udg.es",
  "udg.mx",
  "udk-berlin.de",
  "udl.es",
  "udla.mx",
  "udlap.mx",
  "udn.vn",
  "udo.mx",
  "udp.cl",
  "ue-varna.bg",
  "ueb.isfun.net",
  "uece.br",
  "uef.ru",
  "uefs.br",
  "uel.br",
  "uem.br",
  "uem.es",
  "uem.mz",
  "uem.ro",
  "uema.br",
  "uenf.br",
  "uep.educ.ph",
  "uepg.br",
  "uerj.br",
  "uern.br",
  "uesb.br",
  "uesc.br",
  "uespi.br",
  "uevora.pt",
  "uf3ceu.es",
  "ufac.br",
  "ufal.br",
  "ufar.am",
  "ufba.br",
  "ufc.br",
  "ufes.br",
  "uff.br",
  "ufg.br",
  "ufinis.cl",
  "ufjf.br",
  "ufla.br",
  "ufma.br",
  "ufmg.br",
  "ufms.br",
  "ufmt.br",
  "ufop.br",
  "ufp.nc",
  "ufp.pt",
  "ufpa.br",
  "ufpb.br",
  "ufpe.br",
  "ufpel.tche.br",
  "ufpi.br",
  "ufpr.br",
  "ufrgs.br",
  "ufrj.br",
  "ufrn.br",
  "ufro.cl",
  "ufromail.cl",
  "ufrpe.br",
  "ufrrj.br",
  "ufs.br",
  "ufsc.br",
  "ufscar.br",
  "ufsm.br",
  "uft-plovdiv.bg",
  "ufu.br",
  "ufv.br",
  "ufv.ca",
  "ufv.es",
  "ugaf.rnu.tn",
  "ugal.ro",
  "uganc.org",
  "ugb.sn",
  "ugent.be",
  "ugf.br",
  "ugm.cl",
  "ugr.es",
  "ugrasu.ru",
  "ugs.ed.ao",
  "ugsha.ru",
  "ugto.mx",
  "uh.cu",
  "uha.fr",
  "uhasselt.be",
  "uhb.fr",
  "uhp-nancy.fr",
  "uhsa.ag",
  "uhu.es",
  "ui1.es",
  "uia.es",
  "uia.mx",
  "uia.no",
  "uiah.fi",
  "uib.es",
  "uib.kz",
  "uib.no",
  "uic.es",
  "uic.globe.com.ph",
  "uii.sever.ru",
  "uiliria.org",
  "uimp.es",
  "uinternacional.pt",
  "uio.no",
  "uis.no",
  "uisek.cl",
  "uisrael.ec",
  "uit.no",
  "uj.rnu.tn",
  "ujaen.es",
  "ujat.mx",
  "ujed.mx",
  "ujep.cz",
  "ujf-grenoble.fr",
  "uji.es",
  "ujnk.org",
  "ujsierra.mx",
  "ujso.cl",
  "ukf.sk",
  "ukh.ac",
  "ukim.mk",
  "ukings.ns.ca",
  "ukit-tomohon.org",
  "ukm.my",
  "ukma.kiev.ua",
  "ukrfa.kharkov.ua",
  "uku.fi",
  "ul.ie",
  "ul.pt",
  "ula.ve",
  "ulagos.cl",
  "ulaicavr.com",
  "ulangola.net",
  "ulapland.fi",
  "ulare.cl",
  "ulaval.ca",
  "ulb.be",
  "ulbra.br",
  "ulbsibiu.ro",
  "ulbu.bi",
  "uleth.ca",
  "uliege.be",
  "ulim.md",
  "ulivingstonia.com",
  "ull.es",
  "uloyola.es",
  "ulpgc.es",
  "ulspu.ru",
  "ulstu.ru",
  "ulsu.ru",
  "ult.ens.tn",
  "ulusiada.pt",
  "ulusofona.pt",
  "um-rdc.org",
  "um.es",
  "um.rnu.tn",
  "um.si",
  "uma.co.ao",
  "uma.es",
  "uma.pt",
  "uma.rnu.tn",
  "umag.cl",
  "umanitoba.ca",
  "umar.mx",
  "umaritima.cl",
  "umayor.cl",
  "umb.no",
  "umb.sk",
  "umbb.dz",
  "umc.br",
  "umca.net",
  "umcc.cu",
  "umce.cl",
  "umcollege.com",
  "umcs.lublin.pl",
  "ume.cl",
  "umfcluj.ro",
  "umfiasi.ro",
  "umft.ro",
  "umftgm.ro",
  "umh.es",
  "umich.mx",
  "uminho.pt",
  "umit-tirol.at",
  "umit.at",
  "ummto.dz",
  "umoderna.pt",
  "umoncton.ca",
  "umontpellier.fr",
  "umontreal.ca",
  "umst-edu.com",
  "umu.se",
  "un.mx",
  "una.an",
  "una.py",
  "unab.cl",
  "unacar.mx",
  "unach.mx",
  "unachile.cl",
  "unaerp.br",
  "unak.is",
  "unam.mx",
  "unam.na",
  "unama.br",
  "unap.cl",
  "unarte.ro",
  "unat.ens.tn",
  "unatc.ro",
  "unav.es",
  "unavarra.es",
  "unb.br",
  "unb.ca",
  "unbc.ca",
  "unbi.ba",
  "unbsj.ca",
  "undh.org",
  "uneatlantico.es",
  "uneb.br",
  "uned.es",
  "uneph.org",
  "unesc.rct-sc.br",
  "unesco-ihe.org",
  "unesp.br",
  "unex.es",
  "unfa.cl",
  "ung.br",
  "ung.si",
  "unge.gq",
  "uni-agro.grodno.by",
  "uni-augsburg.de",
  "uni-bamberg.de",
  "uni-bayreuth.de",
  "uni-bge.hu",
  "uni-bielefeld.de",
  "uni-bonn.de",
  "uni-bremen.de",
  "uni-corvinus.hu",
  "uni-dubna.ru",
  "uni-duesseldorf.de",
  "uni-duisburg-essen.de",
  "uni-erfurt.de",
  "uni-erlangen.de",
  "uni-flensburg.de",
  "uni-frankfurt.de",
  "uni-freiburg.de",
  "uni-giessen.de",
  "uni-goettingen.de",
  "uni-greifswald.de",
  "uni-halle.de",
  "uni-hamburg.de",
  "uni-hannover.de",
  "uni-heidelberg.de",
  "uni-hildesheim.de",
  "uni-hohenheim.de",
  "uni-jena.de",
  "uni-kassel.de",
  "uni-kiel.de",
  "uni-kl.de",
  "uni-koblenz-landau.de",
  "uni-koeln.de",
  "uni-konstanz.de",
  "uni-leipzig.de",
  "uni-lj.si",
  "uni-lueneburg.de",
  "uni-magdeburg.de",
  "uni-mainz.de",
  "uni-mannheim.de",
  "uni-marburg.de",
  "uni-miskolc.hu",
  "uni-muenchen.de",
  "uni-muenster.de",
  "uni-nke.hu",
  "uni-obuda.hu",
  "uni-oldenburg.de",
  "uni-osnabrueck.de",
  "uni-paderborn.de",
  "uni-pannon.hu",
  "uni-passau.de",
  "uni-plovdiv.bg",
  "uni-potsdam.de",
  "uni-prizren.com",
  "uni-regensburg.de",
  "uni-rostock.de",
  "uni-ruse.bg",
  "uni-saarland.de",
  "uni-siegen.de",
  "uni-sofia.bg",
  "uni-speyer.de",
  "uni-stuttgart.de",
  "uni-svishtov.bg",
  "uni-sz.bg",
  "uni-trier.de",
  "uni-tuebingen.de",
  "uni-ulm.de",
  "uni-vechta.de",
  "uni-vt.bg",
  "uni-weimar.de",
  "uni-wh.de",
  "uni-wuerzburg.de",
  "uni-wuppertal.de",
  "uni.li",
  "uni.lodz.pl",
  "uni.lu",
  "uni.opole.pl",
  "uni.pt",
  "uni.torun.pl",
  "uni.udm.ru",
  "uni.wroc.pl",
  "unia.ao",
  "uniaam.uia.es",
  "uniacc.cl",
  "uniactiva.com",
  "uniag.sk",
  "unian.it",
  "uniara.com.br",
  "uniara.uia.es",
  "unib.br",
  "uniba.it",
  "uniba.sk",
  "uniban.br",
  "uniband.org",
  "unibas.ch",
  "unibas.it",
  "unibda.net",
  "unibe.ch",
  "unibg.it",
  "unibl.org",
  "unibo.it",
  "unibocconi.it",
  "unibosco.br",
  "unibrasil.com.br",
  "unibs.it",
  "unibuc.ro",
  "unibw-hamburg.de",
  "unibw-muenchen.de",
  "unibz.it",
  "unica.cu",
  "unica.it",
  "unicaen.fr",
  "unical.it",
  "unicam.it",
  "unicamp.br",
  "unicampus.it",
  "unican.es",
  "unicap.br",
  "unicas.it",
  "unicastelo.br",
  "unicatt.it",
  "unice.fr",
  "uniceub.br",
  "unich.it",
  "unicid.br",
  "unicit.cl",
  "unicruz.tche.br",
  "unicsul.br",
  "unict.it",
  "unidavi.rct-sc.br",
  "unideb.hu",
  "unidu.hr",
  "uniecampus.it",
  "uniedpa.com",
  "uniese.it",
  "unifacs.br",
  "unifap.br",
  "unife.it",
  "unifenas.br",
  "unifg.it",
  "unifi.it",
  "unifor.br",
  "unifr.ch",
  "unifran.br",
  "unig.br",
  "unige.ch",
  "unige.it",
  "unigoias.com.br",
  "unigranrio.br",
  "unigre.it",
  "unigre.urbe.it",
  "unijui.tche.br",
  "unikin.cd",
  "unikino.mx",
  "unil.ch",
  "unilasalle.fr",
  "unile.it",
  "unileon.es",
  "unilib.neva.ru",
  "unilim.fr",
  "unilink.it",
  "unilu.ch",
  "uniludes.ch",
  "unima.mw",
  "unimaas.nl",
  "unimar.br",
  "unimas.my",
  "unimc.it",
  "unime.it",
  "unimep.br",
  "unimes.com.br",
  "unimes.fr",
  "unimetroangola.com",
  "unimi.it",
  "unimib.it",
  "unimol.it",
  "unimonte.br",
  "unimontes.br",
  "unin.hr",
  "unina.it",
  "unina2.it",
  "uninav.it",
  "unine.ch",
  "uninova.sk",
  "uninove.br",
  "uninsubria.it",
  "unioeste.br",
  "unios.hr",
  "uniovi.es",
  "unip-objetivo.br",
  "unipa.it",
  "unipd.it",
  "unipe.br",
  "unipg.it",
  "unipi.gr",
  "unipi.it",
  "unipli.com.br",
  "unipo.sk",
  "unipr.it",
  "unipu.hr",
  "unipune.ernet.in",
  "unipv.it",
  "unir.br",
  "uniraj.org",
  "unirc.it",
  "uniri.hr",
  "unirio.br",
  "unirioja.es",
  "uniroma1.it",
  "uniroma2.eu",
  "uniroma3.it",
  "unirsm.sm",
  "unis.sn",
  "unisa.br",
  "unisa.it",
  "unisal.it",
  "unisannio.it",
  "unisantos.com.br",
  "unisc.br",
  "unisg.ch",
  "unisg.it",
  "unishabunia.org",
  "unisi.it",
  "unisilvaner.info",
  "unisinos.br",
  "unisob.na.it",
  "unispital.ch",
  "uniss.it",
  "unist.hr",
  "unistra.fr",
  "unistrapg.it",
  "unistrasi.it",
  "unisul.br",
  "uniswa.sz",
  "unit.br",
  "unitau.br",
  "unitbv.ro",
  "unite.it",
  "unitec.mx",
  "unitn.it",
  "unito.it",
  "units.it",
  "unitus.it",
  "uniube.br",
  "uniud.it",
  "uniurb.it",
  "univ-ab.pt",
  "univ-ag.fr",
  "univ-alger.dz",
  "univ-alger3.dz",
  "univ-amu.fr",
  "univ-angers.fr",
  "univ-annaba.dz",
  "univ-antananarivo.mg",
  "univ-antilles.fr",
  "univ-antsiranana.mg",
  "univ-artois.fr",
  "univ-avignon.fr",
  "univ-bangui.net",
  "univ-batna.dz",
  "univ-bejaia.dz",
  "univ-biskra.dz",
  "univ-blida.dz",
  "univ-bpclermont.fr",
  "univ-brest.fr",
  "univ-catholyon.fr",
  "univ-chlef.dz",
  "univ-cocody.ci",
  "univ-corse.fr",
  "univ-douala.com",
  "univ-dschang.org",
  "univ-emir.dz",
  "univ-evry.fr",
  "univ-fcomte.fr",
  "univ-fianar.mg",
  "univ-grenoble-alpes.fr",
  "univ-guelma.dz",
  "univ-jfc.fr",
  "univ-jijel.dz",
  "univ-k.rnu.tn",
  "univ-kag.org",
  "univ-lehavre.fr",
  "univ-lemans.fr",
  "univ-lille1.fr",
  "univ-lille2.fr",
  "univ-lille3.fr",
  "univ-littoral.fr",
  "univ-lome.tg",
  "univ-lorraine.fr",
  "univ-lr.fr",
  "univ-lyon1.fr",
  "univ-lyon2.fr",
  "univ-lyon3.fr",
  "univ-mahajanga.mg",
  "univ-metz.fr",
  "univ-mlv.fr",
  "univ-mngb.net",
  "univ-montp1.fr",
  "univ-montp2.fr",
  "univ-montp3.fr",
  "univ-mosta.dz",
  "univ-msila.dz",
  "univ-mulhouse.fr",
  "univ-nancy2.fr",
  "univ-nantes.fr",
  "univ-ndere.cm",
  "univ-ndjamena.org",
  "univ-nkc.mr",
  "univ-oeb.dz",
  "univ-oran.dz",
  "univ-orleans.fr",
  "univ-ouaga.bf",
  "univ-ouargla.dz",
  "univ-ovidius.ro",
  "univ-paris-diderot.fr",
  "univ-paris1.fr",
  "univ-paris12.fr",
  "univ-paris13.fr",
  "univ-paris3.fr",
  "univ-paris5.fr",
  "univ-paris8.fr",
  "univ-pau.fr",
  "univ-perp.fr",
  "univ-poitiers.fr",
  "univ-reims.fr",
  "univ-rennes1.fr",
  "univ-rennes2.fr",
  "univ-reunion.fr",
  "univ-rouen.fr",
  "univ-saida.dz",
  "univ-savoie.fr",
  "univ-sba.dz",
  "univ-setif.dz",
  "univ-skikda.dz",
  "univ-st-etienne.fr",
  "univ-tebessa.dz",
  "univ-thies.sn",
  "univ-tiaret.dz",
  "univ-tlemcen.dz",
  "univ-tln.fr",
  "univ-tlse1.fr",
  "univ-tlse2.fr",
  "univ-tlse3.fr",
  "univ-toamasina.mg",
  "univ-toliara.mg",
  "univ-toulouse.fr",
  "univ-tours.fr",
  "univ-ubs.fr",
  "univ-usto.dz",
  "univ-valenciennes.fr",
  "univ-zig.sn",
  "univ.gda.pl",
  "univ.kiev.ua",
  "univ.rzeszow.pl",
  "univ.szczecin.pl",
  "univ.uzhgorod.ua",
  "univa.mx",
  "univagro-iasi.ro",
  "univale.br",
  "univali.rct-sc.br",
  "univap.br",
  "univaq.it",
  "univcb.ro",
  "unive.it",
  "univer.kharkov.ua",
  "univer.omsk.su",
  "univermed-cdgm.ro",
  "universidadarcis.cl",
  "universidadatlantico.org",
  "universidadbrauliocarrillo.com",
  "universidadcentral.com",
  "universidade-autonoma.pt",
  "universidadpedagogica.com",
  "universidadsanjosecr.com",
  "universitateamaritima.ro",
  "universite-paris-saclay.fr",
  "universite-yde2.org",
  "universiteitleiden.nl",
  "universitekongo.org",
  "university.kg",
  "university.kherson.ua",
  "university.tversu.ru",
  "universitycanadawest.ca",
  "universityliberia.org",
  "universityofbohol.com",
  "universityofgalway.ie",
  "universityofsomalia.net",
  "universo.br",
  "universum-ks.org",
  "univesp.br",
  "univet.hu",
  "univgb.rnu.tn",
  "univillarica.mx",
  "univmed.fr",
  "univr.it",
  "univsul.org",
  "uniwa.gr",
  "uniza.sk",
  "unizar.es",
  "unizd.hr",
  "unizg.hr",
  "unizh.ch",
  "unl.pt",
  "unmas.org",
  "unmb.ro",
  "unmo.ba",
  "unmuhmataram.com",
  "unnet.es",
  "uno.mx",
  "unoeste.br",
  "unp.br",
  "unsa.ba",
  "unssa.rs.ba",
  "untag-jkt.org",
  "untagcirebon.info",
  "untz.ba",
  "unva.cz",
  "unwe.acad.bg",
  "unyp.cz",
  "unza.zm",
  "unze.ba",
  "uoa.gr",
  "uob.ga",
  "uoc.es",
  "uoc.gr",
  "uod.ac",
  "uoguelph.ca",
  "uohyd.ernet.in",
  "uoi.gr",
  "uoit.ca",
  "uojazeera.com",
  "uol.de",
  "uom.gr",
  "uop.gr",
  "uor.org",
  "uoradea.ro",
  "uosa.uar.net",
  "uottawa.ca",
  "uowm.gr",
  "up.mx",
  "up.pt",
  "up.univ-mrs.fr",
  "upa.cl",
  "upa.ro",
  "upacifico.cl",
  "upaep.mx",
  "upatras.gr",
  "upc-rdc.cd",
  "upce.cz",
  "upco.es",
  "upct.es",
  "upe.br",
  "upe.poli.br",
  "upeace.org",
  "upei.ca",
  "upet.ro",
  "upf.es",
  "upf.pf",
  "upf.tche.br",
  "upg-ploiesti.ro",
  "upiig.ipn.mx",
  "upis.br",
  "upit.ro",
  "upjs.sk",
  "uplearnbusinessschool.com",
  "upm.es",
  "upm.moldnet.md",
  "upm.ro",
  "upmc.com",
  "upmc.fr",
  "upmf-grenoble.fr",
  "upn.mx",
  "upo.es",
  "upol.cz",
  "uportu.pt",
  "upou.org",
  "upr.si",
  "upra.org",
  "ups-tlse.fr",
  "ups.urbe.it",
  "upsa.es",
  "upt.al",
  "upt.ro",
  "upv.es",
  "uqac.ca",
  "uqam.ca",
  "uqar.uquebec.ca",
  "uqat.uquebec.ca",
  "uqo.ca",
  "uqroo.mx",
  "uqtr.uquebec.ca",
  "uquebec.ca",
  "ur.mx",
  "urca.br",
  "urcamp.tche.br",
  "uregina.ca",
  "urfu.ru",
  "uri.br",
  "urjc.es",
  "url.es",
  "urv.es",
  "us.es",
  "usaaa.ru",
  "usab-tm.ro",
  "usab.ro",
  "usach.cl",
  "usafa.af.mil",
  "usal.es",
  "usam.md",
  "usamvcluj.ro",
  "usanandres.cl",
  "usart.ru",
  "usask.ca",
  "usat.ms",
  "usb.md",
  "usb.ve",
  "usc.br",
  "usc.es",
  "usc.gal",
  "uscon.ru",
  "usenghor-francophonie.org",
  "userena.cl",
  "usf.br",
  "usf.com.mx",
  "usfea.ru",
  "usfx.info",
  "ush.sd",
  "usherb.ca",
  "ushs.u-strasbg.fr",
  "usi.ch",
  "usj.es",
  "usjc.uwaterloo.ca",
  "usla.ru",
  "usm.cl",
  "usm.md",
  "usm.my",
  "usm.trompo.com",
  "usmf.md",
  "usmga.ru",
  "usoms.poznan.pl",
  "uson.mx",
  "usp.br",
  "usp.ph",
  "uspsantapaula.com",
  "uss.cl",
  "uss.rnu.tn",
  "ust.cl",
  "ust.hk",
  "ust.md",
  "ustanne.ednet.ns.ca",
  "ustboniface.mb.ca",
  "usthb.dz",
  "ustpaul.ca",
  "usu.br",
  "usu.ru",
  "usudbury.com",
  "usue.ru",
  "usuft.kiev.ua",
  "usuhs.mil",
  "usurcolombia.com",
  "usv.ro",
  "ut.ee",
  "ut.pr",
  "uta.cl",
  "uta.fi",
  "utad-petel-edu.org",
  "utad.pt",
  "utalca.cl",
  "utanga.co.ao",
  "utb.cz",
  "utbm.fr",
  "utc.fr",
  "utcb.ro",
  "utcluj.ro",
  "utem.cl",
  "utfsm.cl",
  "utgjiu.ro",
  "uth.gr",
  "uth.hn",
  "uth.pl",
  "utkaluniv.org",
  "utl.pt",
  "utm.md",
  "utm.mx",
  "utm.my",
  "utm.rnu.tn",
  "utm.ro",
  "utm.utoronto.ca",
  "utmn.ru",
  "utoronto.ca",
  "utt.fr",
  "utt.ro",
  "utu.fi",
  "utunis.rnu.tn",
  "utwente.nl",
  "uu.nl",
  "uu.se",
  "uumail.in",
  "uv.cl",
  "uv.es",
  "uv.mx",
  "uva.br",
  "uva.es",
  "uva.nl",
  "uvanet.br",
  "uvauga.ru",
  "uvg1.net",
  "uvh.nl",
  "uvic.ca",
  "uvic.es",
  "uvigo.es",
  "uvigo.gal",
  "uvipro.cl",
  "uvm.cl",
  "uvm.sk",
  "uvp.mx",
  "uvsq.fr",
  "uvt.rnu.tn",
  "uvt.ro",
  "uvvg.ro",
  "uwasa.fi",
  "uwaterloo.ca",
  "uwed.uz",
  "uwi.tt",
  "uwindsor.ca",
  "uwinnipeg.ca",
  "uwo.ca",
  "uy1.uninet.cm",
  "uz.rnu.tn",
  "uzh.ch",
  "uzswlu.uz",
  "va.lv",
  "vaganovaacademy.ru",
  "valahia.ro",
  "vaniercollege.qc.ca",
  "vbu.co.in",
  "vcc.ca",
  "vda.lt",
  "vdu.lt",
  "venta.lv",
  "ver.ucc.mx",
  "vern.hr",
  "vet-alfort.fr",
  "vet-lyon.fr",
  "vet-nantes.fr",
  "veths.no",
  "vfrta.ru",
  "vfu.bg",
  "vfu.cz",
  "vgafk.ru",
  "vgasa.ru",
  "vgmu.vitebsk.by",
  "vgta.vrn.ru",
  "vgtu.lt",
  "victoria-uni.ch",
  "vicu.utoronto.ca",
  "videndjurs.dk",
  "vieup.ru",
  "vignanuniversity.org",
  "vikramuniversity.org",
  "vinayakamissions.com",
  "viu.es",
  "vkgu.kz",
  "vksu-ara.org",
  "vlekho.be",
  "vlerick.be",
  "vlerick.com",
  "vlsu.ru",
  "vnmu.vn.ua",
  "voenmeh.ru",
  "volgogradstatemedicaluniversity.in",
  "volsu.ru",
  "vpu.lt",
  "vsau.ru",
  "vsavm.com",
  "vsb.cz",
  "vscht.cz",
  "vsci.cz",
  "vse.cz",
  "vsgaki.burnet.ru",
  "vsgtu.eastsib.ru",
  "vslib.cz",
  "vsm.sk",
  "vsma.info",
  "vsmu.sk",
  "vsp.cz",
  "vspu.kirov.ru",
  "vspu.ru",
  "vssladkovicovo.sk",
  "vssvalzbety.sk",
  "vstecb.cz",
  "vstu.ru",
  "vstu.vinnica.ua",
  "vstu.vitebsk.by",
  "vsu.by",
  "vsu.ru",
  "vsvu.sk",
  "vu.lt",
  "vu.nl",
  "vub.be",
  "vumk.eu",
  "vut.cz",
  "vutbr.cz",
  "vvsaz.org",
  "vvsu.ru",
  "vxu.se",
  "w-hs.de",
  "wageningenuniversity.nl",
  "wakf.org",
  "wbuafs.nic.in",
  "wbut.net",
  "wdsdjxy.com",
  "webster.ch",
  "wenk.be",
  "westcoastuniversity-edu.com",
  "westcoastuniversity.bz",
  "westhillscollege.com",
  "whu-koblenz.de",
  "williamgilbert.co.uk",
  "windesheim.nl",
  "wit.ie",
  "wittenborg.eu",
  "wiut.uz",
  "wkau.kz",
  "wlodkowic.pl",
  "wlu.ca",
  "wmu.se",
  "wsb.poznan.pl",
  "wsb.toi.tarnow.pl",
  "wsei.lublin.pl",
  "wsiz.rzeszow.pl",
  "wsm.gdynia.pl",
  "wsm.szczecin.pl",
  "wsp.bydgoszcz.pl",
  "wsp.czest.pl",
  "wsp.krakow.pl",
  "wsp.slupsk.pl",
  "wsp.zgora.pl",
  "wsps.waw.pl",
  "wsub.waw.pl",
  "wsz.pl",
  "wszib.krakow.pl",
  "wwu.de",
  "www-ecpm.u-strasbg.fr",
  "www-engees.u-strasbg.fr",
  "www-ensais.u-strasbg.fr",
  "www-ensps.u-strasbg.fr",
  "www-ulp.u-strasbg.fr",
  "www-urs.u-strasbg.fr",
  "www.esmad.ipp.pt",
  "wzmu.net",
  "xza.cn",
  "ycmou.com",
  "yizhuan.com",
  "yncrea.fr",
  "yorku.ca",
  "ysmu.am",
  "ysparmaruniversity.org",
  "yspu.yar.ru",
  "ystu.yar.ru",
  "ysu.am",
  "ysu.ru",
  "yukoncollege.yk.ca",
  "yuniv.net",
  "yznu.cn",
  "zcu.cz",
  "zdsoft.com.cn",
  "zetechcollege.com",
  "zgfxy.cn",
  "zhaw.ch",
  "zhdk.ch",
  "zhezu.kz",
  "zhgu.kz",
  "zhwin.ch",
  "znuel.net",
  "zpsb.szczecin.pl",
  "zsem.hr",
  "zucghana.org",
  "zuyd.nl"
];

// apps/api/src/enrichment/agent/profiles.ts
var NATIONAL_PRESS = [
  "premiumtimesng.com",
  "punchng.com",
  "thecable.ng",
  "guardian.ng",
  "vanguardngr.com",
  "dailytrust.com",
  "channelstv.com",
  "thisdaylive.com",
  "tribuneonlineng.com",
  "businessday.ng",
  "leadership.ng"
];
var INTL_EDUCATION = [
  "*.edu",
  // US institutions
  "*.edu.*",
  // edu.<cc> families: edu.ng, edu.gh, edu.eg, edu.sa, edu.my, ...
  "*.ac.*",
  // ac.<cc> families: ac.uk, ac.in, ac.ke, ac.jp, ac.ae, ...
  // General-TLD universities (.de/.ca/.fr/...) — pattern-untrustable countries,
  // covered by the vendored world-universities dataset instead (3,252 domains).
  ...WORLD_UNIVERSITY_DOMAINS
];
var ELECTION_OBSERVERS = [
  "au.int",
  "ecowas.int",
  "eeas.europa.eu",
  "ndi.org",
  "iri.org",
  "cartercenter.org",
  "thecommonwealth.org",
  "eisa.org",
  "yiaga.org"
];
var BOOK_REGISTRIES = ["worldcat.org", "openlibrary.org", "books.google.com"];
var OFFICIALS = {
  domain: "officials",
  targetTable: "nigerian_officials",
  // Must stay a subset of APPLIABLE_FIELDS["nigerian_officials"] in enrichment.constants.ts.
  targetFields: [
    "email",
    "phone_number",
    "office_address",
    "twitter_handle",
    "facebook_url",
    "education",
    "biography",
    "image_url",
    "gender",
    "date_of_birth"
  ],
  sensitiveFields: ["date_of_birth"],
  trustedDomains: ["*.gov.ng", "nass.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: []
  // officials have no single canonical document
};
var COUNCILORS = {
  domain: "councilors",
  targetTable: "nigerian_officials",
  targetFields: [],
  // create-only: no field-level enrichment via this profile
  sensitiveFields: [],
  // SIEC domains (per-state, run LG elections) + general gov + civic. Expand as states roll out.
  trustedDomains: ["absiec.org", "*.gov.ng", "placng.org", "inecnigeria.org"],
  // The ABSIEC results page is the canonical councilor source for Abia.
  sourceTemplates: [{ publisher: "absiec.org", urlIncludes: "election-results", format: "html" }]
};
var EDUCATION = {
  domain: "education",
  targetTable: "official_education",
  targetFields: ["institution", "institution_type", "qualification", "field", "start_year", "end_year", "graduated", "location"],
  sensitiveFields: ["qualification", "institution"],
  trustedDomains: ["*.edu.ng", "nuc.edu.ng", "*.gov.ng", "jamb.gov.ng", ...INTL_EDUCATION, ...NATIONAL_PRESS],
  sourceTemplates: []
  // no single canonical registry of Nigerian alumni
};
var ELECTIONS = {
  domain: "elections",
  targetTable: "official_elections",
  targetFields: ["result", "votes", "vote_percentage", "winner_name", "election_date", "notes"],
  sensitiveFields: ["result", "votes"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org", ...ELECTION_OBSERVERS],
  sourceTemplates: [
    // INEC declared-results pages are the canonical election source.
    { publisher: "inecnigeria.org", urlIncludes: "election-result", format: "html" },
    { publisher: "inecnigeria.org", urlIncludes: "elections", format: "pdf" }
  ]
};
var CAREERS = {
  domain: "careers",
  targetTable: "official_careers",
  targetFields: ["organization", "role", "industry", "employment_type", "start_year", "end_year", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng", "cac.gov.ng", ...NATIONAL_PRESS],
  sourceTemplates: []
};
var PARTY_AFFILIATIONS = {
  domain: "party_affiliations",
  targetTable: "official_party_affiliations",
  targetFields: ["start_date", "end_date", "reason"],
  sensitiveFields: ["start_date", "end_date"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: []
};
var COMMITTEES = {
  domain: "committees",
  targetTable: "official_committees",
  targetFields: ["committee_name", "chamber", "role", "start_date", "end_date"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "nass.gov.ng", urlIncludes: "committees", format: "html" }]
};
var BILLS = {
  domain: "bills",
  targetTable: "official_sponsored_bills",
  targetFields: ["title", "bill_number", "status", "status_date", "summary"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "placng.org", urlIncludes: "bills", format: "html" }]
};
var ASSETS = {
  domain: "assets",
  targetTable: "official_asset_declarations",
  targetFields: ["year", "declared_to", "amount", "currency", "summary"],
  sensitiveFields: ["amount"],
  trustedDomains: ["ccb.gov.ng", "*.gov.ng"],
  sourceTemplates: [{ publisher: "ccb.gov.ng", urlIncludes: "declaration", format: "pdf" }]
};
var AWARDS = {
  domain: "awards",
  targetTable: "official_awards",
  targetFields: ["title", "awarded_by", "year", "category", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng", ...NATIONAL_PRESS],
  sourceTemplates: []
};
var PUBLICATIONS = {
  domain: "publications",
  targetTable: "official_publications",
  targetFields: ["title", "type", "publisher", "year"],
  sensitiveFields: [],
  // "should roam": bibliographic registries + press count as authoritative.
  trustedDomains: [...BOOK_REGISTRIES, ...NATIONAL_PRESS],
  sourceTemplates: []
};
var FAMILY = {
  domain: "family",
  targetTable: "official_family_members",
  targetFields: ["relationship", "name", "is_public_figure", "notes"],
  sensitiveFields: ["name", "relationship"],
  // Families are not in government registries; press is the record. The
  // sensitive-field bar and the skill's needsHuman bias still apply.
  trustedDomains: ["*.gov.ng", ...NATIONAL_PRESS],
  sourceTemplates: []
};
var LEGAL_CASES = {
  domain: "legal_cases",
  targetTable: "official_legal_cases",
  targetFields: ["title", "case_type", "status", "forum", "case_number", "filed_date", "resolved_date", "outcome", "role", "record_kind"],
  sensitiveFields: ["status", "outcome", "case_type", "role"],
  // courtlistener.com (Free Law Project / RECAP) = US federal court dockets, tiered
  // `official` (RECAP is crowd-sourced from PACER, so not a canonical single-doc);
  // a docket backlink satisfies the create bar and every proposal stays human-reviewed.
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "placng.org", "courtlistener.com"],
  sourceTemplates: [{ publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" }]
};
var CORRUPTION_CASES = {
  domain: "corruption",
  targetTable: "corruption_cases",
  targetFields: ["title", "summary", "case_type", "status", "forum", "amount_involved", "amount_recovered", "sector", "opened_date", "charge_date", "verdict_date", "outcome", "sentence"],
  sensitiveFields: ["status", "outcome", "amount_involved", "amount_recovered", "sentence"],
  // corruptioncases.ng (TransparencIT) is a structured, curated DB citing EFCC/court
  // records — registered as canonical so a single case-page backlink satisfies the
  // create bar (still human-reviewed before any live write).
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "corruptioncases.ng"],
  sourceTemplates: [
    { publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" },
    { publisher: "icpc.gov.ng", urlIncludes: "press", format: "html" },
    { publisher: "corruptioncases.ng", urlIncludes: "/cases/", format: "html" }
  ]
};
var PARTIES = {
  domain: "parties",
  targetTable: "political_parties",
  // Must stay a subset of APPLIABLE_FIELDS["political_parties"] in enrichment.constants.ts.
  targetFields: [
    "logo_url",
    "founding_year",
    "leader_name",
    "hq_address",
    "website",
    "email",
    "phone_number",
    "twitter_handle",
    "facebook_url",
    "description",
    "ideology",
    "slogan",
    "color",
    "inec_status"
  ],
  sensitiveFields: [],
  // party data is public; no PII
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  // INEC's registered-parties list is canonical for name/acronym/inec_status.
  sourceTemplates: [{ publisher: "inecnigeria.org", urlIncludes: "political-parties", format: "html" }]
};
var PARTY_CHAPTERS = {
  domain: "party_chapters",
  targetTable: "party_state_chapters",
  targetFields: [
    "chairman_name",
    "secretary_name",
    "hq_address",
    "phone_number",
    "email",
    "website",
    "twitter_handle"
  ],
  sensitiveFields: [],
  // Party official sites + state news + general gov / INEC. Chapters support changeKind "create".
  trustedDomains: ["*.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: []
  // no canonical doc; chapters are sparse
};
var PROFILES = {
  officials: OFFICIALS,
  councilors: COUNCILORS,
  education: EDUCATION,
  elections: ELECTIONS,
  careers: CAREERS,
  party_affiliations: PARTY_AFFILIATIONS,
  committees: COMMITTEES,
  bills: BILLS,
  assets: ASSETS,
  awards: AWARDS,
  publications: PUBLICATIONS,
  family: FAMILY,
  legal_cases: LEGAL_CASES,
  corruption: CORRUPTION_CASES,
  parties: PARTIES,
  party_chapters: PARTY_CHAPTERS
};
function getProfile(domain) {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

// apps/api/src/enrichment/agent/tier.ts
function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
function domainMatches(host, pattern) {
  const p = pattern.toLowerCase();
  const sldFamily = /^\*\.([a-z0-9-]+)\.\*$/.exec(p);
  if (sldFamily) {
    return new RegExp(`(^|\\.)${sldFamily[1]}\\.[a-z]{2}$`).test(host);
  }
  if (p.startsWith("*.")) {
    const base = p.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === p || host.endsWith(`.${p}`);
}
function classifyTier(url, profile) {
  const host = hostnameOf(url);
  if (profile.sourceTemplates.some(
    (t) => url.includes(t.urlIncludes) && (host === t.publisher || domainMatches(host, t.publisher))
  )) {
    return "canonical";
  }
  if (profile.trustedDomains.some((d) => domainMatches(host, d))) return "official";
  return "web";
}

// apps/api/src/enrichment/agent/corroboration.ts
function distinctPublishers(sources) {
  return new Set(sources.map((s) => s.publisher.toLowerCase().replace(/^www\./, ""))).size;
}
function validateCorroboration(input, profile) {
  const sensitive = profile.sensitiveFields.includes(input.targetField);
  const effective = input.changeKind === "correction" || sensitive ? "correction" : "fill";
  const independent = distinctPublishers(input.sources);
  const canonical = input.sources.filter((s) => s.tier === "canonical").length;
  if (input.changeKind === "create") {
    const authoritative = input.sources.filter((s) => s.tier === "canonical" || s.tier === "official").length;
    if (authoritative >= 1) return { ok: true, reason: "authoritative source satisfies create" };
    if (independent >= 2) return { ok: true, reason: `${independent} independent web sources satisfy create` };
    return { ok: false, reason: `create needs >=1 authoritative or >=2 independent sources, have ${authoritative} authoritative / ${independent} independent` };
  }
  if (canonical >= 1) {
    if (effective === "fill") return { ok: true, reason: "canonical source satisfies fill" };
    if (canonical >= 2) return { ok: true, reason: "two canonical sources satisfy correction" };
    if (independent >= 2) return { ok: true, reason: "canonical + independent source satisfies correction" };
    return { ok: false, reason: "correction with one canonical source needs a second independent source" };
  }
  const need = effective === "fill" ? 2 : 3;
  if (independent >= need) return { ok: true, reason: `${independent} independent sources meet bar of ${need}` };
  return {
    ok: false,
    reason: `${effective}${sensitive ? " (sensitive field)" : ""} needs >=${need} independent sources, have ${independent}`
  };
}

// deploy/enrichment/tools/shims/nestjs-common.ts
var BadRequestException = class extends Error {
  constructor(message) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "BadRequestException";
  }
  getStatus() {
    return 400;
  }
  getResponse() {
    return { statusCode: 400, message: this.message, error: "Bad Request" };
  }
};

// apps/api/src/enrichment/state-codes.ts
var STATE_SLUGS = [
  "abia",
  "adamawa",
  "akwa_ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross_river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "fct",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara"
];
var STATE_SLUG_SET = new Set(STATE_SLUGS);
var STATE_ISO2 = {
  AB: "abia",
  AD: "adamawa",
  AK: "akwa_ibom",
  AN: "anambra",
  BA: "bauchi",
  BY: "bayelsa",
  BE: "benue",
  BO: "borno",
  CR: "cross_river",
  DE: "delta",
  EB: "ebonyi",
  ED: "edo",
  EK: "ekiti",
  EN: "enugu",
  FC: "fct",
  GO: "gombe",
  IM: "imo",
  JI: "jigawa",
  KD: "kaduna",
  KN: "kano",
  KT: "katsina",
  KE: "kebbi",
  KO: "kogi",
  KW: "kwara",
  LA: "lagos",
  NA: "nasarawa",
  NI: "niger",
  OG: "ogun",
  ON: "ondo",
  OS: "osun",
  OY: "oyo",
  PL: "plateau",
  RI: "rivers",
  SO: "sokoto",
  TA: "taraba",
  YO: "yobe",
  ZA: "zamfara"
};
function resolveStateSlug(raw) {
  if (raw === null || raw === void 0) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (STATE_SLUG_SET.has(lower)) return lower;
  const iso = STATE_ISO2[s.toUpperCase()];
  if (iso) return iso;
  const named = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (STATE_SLUG_SET.has(named)) return named;
  return null;
}

// apps/api/src/enrichment/enum-coerce.ts
function normalize(raw) {
  return String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function coerceEnum(raw, spec) {
  const n = normalize(raw);
  if (spec.allowed.includes(n)) return n;
  return spec.synonyms[n] ?? spec.fallback;
}
var CORRUPTION_CASE_TYPE = {
  field: "case_type",
  allowed: [
    "fraud",
    "embezzlement",
    "bribery",
    "money_laundering",
    "abuse_of_office",
    "procurement_fraud",
    "diversion",
    "other"
  ],
  synonyms: {
    lawsuit: "other",
    suit: "other",
    litigation: "other",
    civil: "other",
    criminal: "other",
    corruption: "other",
    financial_crime: "fraud",
    misappropriation: "embezzlement",
    misappropriation_of_funds: "embezzlement",
    graft: "bribery",
    kickback: "bribery",
    kickbacks: "bribery"
  },
  fallback: "other"
};
var CORRUPTION_STATUS = {
  field: "status",
  allowed: [
    "alleged",
    "under_investigation",
    "charged",
    "on_trial",
    "convicted",
    "acquitted",
    "dismissed",
    "settled",
    "appeal"
  ],
  synonyms: {
    pending: "alleged",
    filed: "alleged",
    investigation: "under_investigation",
    trial: "on_trial",
    conviction: "convicted",
    discharged: "acquitted",
    struck_out: "dismissed",
    on_appeal: "appeal",
    appealed: "appeal"
  },
  fallback: "alleged"
};
var LEGAL_CASE_TYPE = {
  field: "case_type",
  allowed: ["criminal", "civil", "electoral", "tribunal", "investigation"],
  synonyms: {
    lawsuit: "civil",
    suit: "civil",
    litigation: "civil",
    civil_suit: "civil",
    civil_case: "civil",
    criminal_case: "criminal",
    prosecution: "criminal",
    election_petition: "electoral",
    petition: "electoral",
    probe: "investigation",
    inquiry: "investigation",
    tribunal_case: "tribunal"
  },
  fallback: "civil"
};
var LEGAL_STATUS = {
  field: "status",
  // chk_legal_status has NO 'appeal' (unlike corruption); an appeal is still active → on_trial.
  // 'closed' = concluded with the disposition not (yet) verified — e.g. a
  // terminated US docket whose RECAP metadata carries no outcome.
  allowed: [
    "alleged",
    "under_investigation",
    "charged",
    "on_trial",
    "convicted",
    "acquitted",
    "dismissed",
    "settled",
    "closed"
  ],
  synonyms: {
    pending: "on_trial",
    filed: "on_trial",
    investigation: "under_investigation",
    trial: "on_trial",
    conviction: "convicted",
    discharged: "acquitted",
    struck_out: "dismissed",
    on_appeal: "on_trial",
    appeal: "on_trial",
    appealed: "on_trial",
    concluded: "closed",
    terminated: "closed",
    ended: "closed",
    resolved: "closed"
  },
  fallback: "alleged"
};

// apps/api/src/enrichment/creatable.registry.ts
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function coerce(spec, value) {
  if (value === void 0 || value === null) {
    if (spec.required) throw new BadRequestException(`missing required field: ${spec.key}`);
    return null;
  }
  switch (spec.type) {
    case "string":
      if (typeof value !== "string" || value.length === 0) {
        throw new BadRequestException(`field ${spec.key} must be a non-empty string`);
      }
      return value;
    case "int":
      if (!Number.isInteger(value)) throw new BadRequestException(`field ${spec.key} must be an integer`);
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new BadRequestException(`field ${spec.key} must be a number`);
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") throw new BadRequestException(`field ${spec.key} must be a boolean`);
      return value;
    case "date":
      if (typeof value !== "string" || !DATE_RE.test(value)) {
        throw new BadRequestException(`field ${spec.key} must be yyyy-mm-dd`);
      }
      return value;
    case "uuid":
      if (typeof value !== "string" || !UUID_RE.test(value)) {
        throw new BadRequestException(`field ${spec.key} must be a uuid`);
      }
      return value;
  }
}
function officialFactEntity(targetTable, evidenceEntryType, columns, preflight) {
  return {
    targetTable,
    evidenceEntryType,
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const payload = raw;
      const out = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, payload.officialId)
      };
      for (const spec of columns) out[spec.key] = coerce(spec, payload[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const exists = await tx.$queryRawUnsafe(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId
      );
      if (exists.length === 0) {
        throw new BadRequestException(`official ${payload.officialId} does not exist`);
      }
      if (preflight) await preflight(tx, payload);
    },
    async insert(tx, payload, ctx) {
      const cols = ["official_id"];
      const values = [payload.officialId];
      const casts = ["::uuid"];
      for (const spec of columns) {
        const v = payload[spec.key];
        if (v === null) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO ${targetTable} (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values
      );
      return { id: rows[0].id, officialId: payload.officialId };
    }
  };
}
async function softenUnknownParty(tx, payload) {
  if (!payload.partyAcronym) return;
  const raw = String(payload.partyAcronym).trim();
  const rows = await tx.$queryRawUnsafe(
    `SELECT acronym FROM political_parties
     WHERE acronym = $1 OR upper(acronym) = upper($1) OR lower(name) = lower($1)
     ORDER BY (acronym = $1) DESC, (upper(acronym) = upper($1)) DESC
     LIMIT 1`,
    raw
  );
  payload.partyAcronym = rows[0]?.acronym ?? null;
}
async function normalizeGeoRefs(tx, payload) {
  if ("stateCode" in payload) {
    payload.stateCode = resolveStateSlug(payload.stateCode);
  }
  const refs = [
    ["lgaCode", "nigerian_lgas"],
    ["wardCode", "nigerian_wards"],
    ["constituencyCode", "nigerian_constituencies"]
  ];
  for (const [key, table] of refs) {
    if (!payload[key]) continue;
    const rows = await tx.$queryRawUnsafe(
      `SELECT 1 FROM ${table} WHERE code = $1`,
      payload[key]
    );
    if (rows.length === 0) payload[key] = null;
  }
}
function corruptionInvolvementEntity() {
  const CASE_OPTIONAL = [
    { key: "summary", column: "summary", type: "string" },
    { key: "forum", column: "forum", type: "string" },
    { key: "amountInvolved", column: "amount_involved", type: "number" },
    { key: "amountRecovered", column: "amount_recovered", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "stateCode", column: "state_code", type: "string" },
    { key: "sector", column: "sector", type: "string" },
    { key: "openedDate", column: "opened_date", type: "date" },
    { key: "chargeDate", column: "charge_date", type: "date" },
    { key: "verdictDate", column: "verdict_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "sentence", column: "sentence", type: "string" }
  ];
  return {
    targetTable: "corruption_cases",
    evidenceEntryType: "corruption_case",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw;
      const out = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId),
        subjectName: coerce({ key: "subjectName", column: "subject_name", type: "string", required: true }, p.subjectName),
        title: coerce({ key: "title", column: "title", type: "string", required: true }, p.title),
        caseType: coerce({ key: "caseType", column: "case_type", type: "string", required: true }, p.caseType),
        status: coerce({ key: "status", column: "status", type: "string", required: true }, p.status),
        role: coerce({ key: "role", column: "role", type: "string", required: true }, p.role),
        partyType: coerce({ key: "partyType", column: "party_type", type: "string" }, p.partyType) ?? "person"
      };
      for (const spec of CASE_OPTIONAL) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await normalizeGeoRefs(tx, payload);
      payload.caseType = coerceEnum(payload.caseType, CORRUPTION_CASE_TYPE);
      payload.status = coerceEnum(payload.status, CORRUPTION_STATUS);
      const exists = await tx.$queryRawUnsafe(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId
      );
      if (exists.length === 0) {
        throw new BadRequestException(`official ${payload.officialId} does not exist`);
      }
    },
    async insert(tx, payload, ctx) {
      const base = slugifyName(`${payload.subjectName} ${payload.title}`).slice(0, 140) || "corruption-case";
      const clash = await tx.$queryRawUnsafe(`SELECT 1 FROM corruption_cases WHERE slug = $1`, base);
      const slug = clash.length > 0 ? `${base}-${Math.abs(hashStr(String(payload.title) + String(payload.officialId))).toString(36).slice(0, 6)}` : base;
      const caseCols = ["slug", "title", "case_type", "status"];
      const caseVals = [slug, payload.title, payload.caseType, payload.status];
      const caseCasts = ["", "", "", ""];
      for (const spec of CASE_OPTIONAL) {
        const v = payload[spec.key];
        if (v === null) continue;
        caseCols.push(spec.column);
        caseVals.push(v);
        caseCasts.push(spec.type === "date" ? "::date" : "");
      }
      caseCols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      caseVals.push(ctx.confidence, "agent", "reviewed", ctx.adminId);
      caseCasts.push("", "", "", "");
      const casePlaceholders = caseVals.map((_, i) => `$${i + 1}${caseCasts[i] ?? ""}`);
      casePlaceholders.push("now()");
      const caseRows = await tx.$queryRawUnsafe(
        `INSERT INTO corruption_cases (${caseCols.map((c) => `"${c}"`).join(", ")})
         VALUES (${casePlaceholders.join(", ")}) RETURNING id`,
        ...caseVals
      );
      const caseId = caseRows[0].id;
      await tx.$executeRawUnsafe(
        `INSERT INTO corruption_case_parties
           (case_id, subject_type, subject_id, subject_name, party_type, role,
            outcome, confidence, source_type, review_status, reviewed_by, last_verified_at)
         VALUES ($1::uuid, 'official', $2::uuid, $3, $4, $5, $6, $7, 'agent', 'reviewed', $8, now())`,
        caseId,
        payload.officialId,
        payload.subjectName,
        payload.partyType,
        payload.role,
        payload.outcome ?? null,
        ctx.confidence,
        ctx.adminId
      );
      return { id: caseId, officialId: payload.officialId };
    }
  };
}
var PARTY_OFFICER_ROLES = /* @__PURE__ */ new Set(["national_chairman", "national_secretary", "party_leader"]);
var PARTY_OFFICER_ORDER = {
  national_chairman: 0,
  national_secretary: 1,
  party_leader: 2
};
function partyOfficerEntity() {
  return {
    targetTable: "party_officers",
    evidenceEntryType: "party_officer",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw;
      const role = coerce({ key: "role", column: "role", type: "string", required: true }, p.role);
      if (!PARTY_OFFICER_ROLES.has(role)) {
        throw new BadRequestException(`unknown party officer role: ${role}`);
      }
      return {
        partyAcronym: coerce({ key: "partyAcronym", column: "party_acronym", type: "string", required: true }, p.partyAcronym),
        role,
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name),
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio),
        gender: coerce({ key: "gender", column: "gender", type: "string" }, p.gender),
        dateOfBirth: coerce({ key: "dateOfBirth", column: "date_of_birth", type: "date" }, p.dateOfBirth),
        twitterHandle: coerce({ key: "twitterHandle", column: "twitter_handle", type: "string" }, p.twitterHandle),
        facebookUrl: coerce({ key: "facebookUrl", column: "facebook_url", type: "string" }, p.facebookUrl),
        sourceUrl: coerce({ key: "sourceUrl", column: "source_url", type: "string" }, p.sourceUrl)
      };
    },
    async preflight(tx, payload) {
      const party = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym
      );
      if (party.length === 0) {
        throw new BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
      const dup = await tx.$queryRawUnsafe(
        `SELECT 1 FROM party_officers WHERE party_acronym = $1 AND role = $2`,
        payload.partyAcronym,
        payload.role
      );
      if (dup.length > 0) {
        throw new BadRequestException(`${payload.partyAcronym} already has a ${payload.role}`);
      }
    },
    async insert(tx, payload, ctx) {
      const officialId = await findOrCreateOfficial(tx, {
        name: payload.name,
        imageUrl: payload.imageUrl,
        biography: payload.bio,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
        twitterHandle: payload.twitterHandle,
        facebookUrl: payload.facebookUrl,
        officialType: null
      });
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO party_officers
           (party_acronym, role, name, image_url, official_id, source_url, display_order,
            confidence, source_type, review_status, last_verified_at)
         VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8, 'agent', 'reviewed', now())
         RETURNING id`,
        payload.partyAcronym,
        payload.role,
        payload.name,
        payload.imageUrl ?? null,
        officialId,
        payload.sourceUrl ?? null,
        PARTY_OFFICER_ORDER[payload.role] ?? 0,
        ctx.confidence
      );
      return { id: rows[0].id, officialId };
    }
  };
}
var legalCaseNewColsPresent = null;
var ELECTION_COLUMNS = [
  { key: "electionType", column: "election_type", type: "string", required: true },
  { key: "isPrimary", column: "is_primary", type: "boolean" },
  { key: "year", column: "year", type: "int", required: true },
  { key: "electionDate", column: "election_date", type: "date" },
  { key: "partyAcronym", column: "party_acronym", type: "string" },
  { key: "stateCode", column: "state_code", type: "string" },
  { key: "constituencyCode", column: "constituency_code", type: "string" },
  { key: "lgaCode", column: "lga_code", type: "string" },
  { key: "wardCode", column: "ward_code", type: "string" },
  { key: "result", column: "result", type: "string", required: true },
  { key: "votes", column: "votes", type: "int" },
  { key: "votePercentage", column: "vote_percentage", type: "number" },
  { key: "winnerName", column: "winner_name", type: "string" },
  { key: "resultedInPositionId", column: "resulted_in_position_id", type: "uuid" },
  { key: "notes", column: "notes", type: "string" }
];
function electionEntity() {
  return {
    targetTable: "official_elections",
    evidenceEntryType: "election",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw;
      const hasId = p.officialId !== void 0 && p.officialId !== null;
      const hasName = p.officialName !== void 0 && p.officialName !== null;
      if (hasId === hasName) {
        throw new BadRequestException("exactly one of officialId or officialName is required");
      }
      const out = {
        officialId: hasId ? coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId) : null,
        officialName: hasName ? coerce({ key: "officialName", column: "name", type: "string", required: true }, p.officialName) : null,
        // Optional deterministic slug for the CREATE path (plan 60 F1): bare-name
        // find-or-create collapses same-name different-seat people; a caller-supplied
        // slug keys the person on the unique slug column instead. Ignored with officialId.
        officialSlugHint: coerce({ key: "officialSlugHint", column: "slug", type: "string" }, p.officialSlugHint),
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio)
      };
      for (const spec of ELECTION_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await softenUnknownParty(tx, payload);
      await normalizeGeoRefs(tx, payload);
      if (payload.officialId) {
        const exists = await tx.$queryRawUnsafe(
          `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
          payload.officialId
        );
        if (exists.length === 0) {
          throw new BadRequestException(`official ${payload.officialId} does not exist`);
        }
      }
    },
    async insert(tx, payload, ctx) {
      const officialId = payload.officialId ?? await findOrCreateOfficial(tx, {
        name: payload.officialName,
        imageUrl: payload.imageUrl ?? null,
        biography: payload.bio ?? null,
        gender: null,
        dateOfBirth: null,
        twitterHandle: null,
        facebookUrl: null,
        // A primary CANDIDATE is not an office-holder (plan 60 §4.3): created
        // untyped (null, the party-officer precedent) so office-holder read
        // filters exclude them. Non-primary paths keep the legacy 'elected'.
        officialType: payload.isPrimary === true ? null : "elected",
        slug: payload.officialSlugHint ?? void 0
      });
      const cols = ["official_id"];
      const values = [officialId];
      const casts = ["::uuid"];
      for (const spec of ELECTION_COLUMNS) {
        const v = payload[spec.key];
        if (v === null || v === void 0) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO official_elections (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values
      );
      if (payload.isPrimary && payload.electionType === "gubernatorial" && payload.stateCode) {
        const stateCode = payload.stateCode;
        const alreadyExists = await tx.$queryRawUnsafe(
          `SELECT 1 FROM official_positions
           WHERE official_id = $1::uuid AND role = 'governor' AND state_code = $2
           LIMIT 1`,
          officialId,
          stateCode
        );
        if (alreadyExists.length === 0) {
          const electionYear = Number(payload.year) || (/* @__PURE__ */ new Date()).getFullYear();
          await tx.$queryRawUnsafe(
            `INSERT INTO official_positions
               (official_id, role, state_code, status, appointment_type, start_date,
                confidence, source_type, review_status, reviewed_by, last_verified_at)
             VALUES ($1::uuid, 'governor', $2, 'contesting', 'elected', make_date($3::int, 5, 29),
                     $4, 'manual', 'reviewed', $5, now())`,
            officialId,
            stateCode,
            electionYear,
            ctx.confidence,
            ctx.adminId
          );
        }
      }
      return { id: rows[0].id, officialId };
    }
  };
}
var PARTY_OPTIONAL_COLUMNS = [
  { key: "isActive", column: "is_active", type: "boolean" },
  { key: "color", column: "color", type: "string" },
  { key: "description", column: "description", type: "string" },
  { key: "email", column: "email", type: "string" },
  { key: "facebookUrl", column: "facebook_url", type: "string" },
  { key: "foundingYear", column: "founding_year", type: "int" },
  { key: "hqAddress", column: "hq_address", type: "string" },
  { key: "ideology", column: "ideology", type: "string" },
  { key: "inecStatus", column: "inec_status", type: "string" },
  { key: "leaderName", column: "leader_name", type: "string" },
  { key: "logoUrl", column: "logo_url", type: "string" },
  { key: "phoneNumber", column: "phone_number", type: "string" },
  { key: "slogan", column: "slogan", type: "string" },
  { key: "twitterHandle", column: "twitter_handle", type: "string" },
  { key: "website", column: "website", type: "string" }
];
function politicalPartyEntity() {
  return {
    targetTable: "political_parties",
    evidenceEntryType: null,
    // non-uuid PK → no evidence copy (see apply service guard)
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new BadRequestException("malformed create payload");
      }
      const p = raw;
      const out = {
        acronym: coerce({ key: "acronym", column: "acronym", type: "string", required: true }, p.acronym),
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name)
      };
      for (const spec of PARTY_OPTIONAL_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const dup = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.acronym
      );
      if (dup.length > 0) {
        throw new BadRequestException(`party ${payload.acronym} already exists`);
      }
    },
    async insert(tx, payload) {
      const isActive = payload.isActive === null || payload.isActive === void 0 ? true : payload.isActive;
      const cols = ["acronym", "name", "is_active"];
      const values = [payload.acronym, payload.name, isActive];
      const casts = ["", "", ""];
      for (const spec of PARTY_OPTIONAL_COLUMNS) {
        if (spec.key === "isActive") continue;
        const v = payload[spec.key];
        if (v === null || v === void 0) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push("");
      }
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()", "now()");
      cols.push("created_at", "updated_at");
      await tx.$executeRawUnsafe(
        `INSERT INTO political_parties (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")})`,
        ...values
      );
      return { id: payload.acronym };
    }
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return h;
}
async function findOrCreateOfficial(tx, o) {
  let slug;
  if (o.slug) {
    const bySlug = await tx.$queryRawUnsafe(
      `SELECT id FROM nigerian_officials WHERE slug = $1 LIMIT 1`,
      o.slug
    );
    if (bySlug.length > 0) return bySlug[0].id;
    slug = o.slug;
  } else {
    const existing = await tx.$queryRawUnsafe(
      `SELECT id FROM nigerian_officials WHERE lower(name) = lower($1) LIMIT 1`,
      o.name
    );
    if (existing.length > 0) return existing[0].id;
    slug = slugifyName(o.name) || `official-${Math.abs(hashStr(o.name)).toString(36).slice(0, 6)}`;
    const clash = await tx.$queryRawUnsafe(`SELECT 1 FROM nigerian_officials WHERE slug = $1`, slug);
    if (clash.length > 0) {
      slug = `${slug}-${Math.abs(hashStr(o.name + (o.officialType ?? ""))).toString(36).slice(0, 4)}`;
    }
  }
  const rows = await tx.$queryRawUnsafe(
    `INSERT INTO nigerian_officials
       (name, slug, official_type, image_url, biography, gender, date_of_birth, twitter_handle, facebook_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9) RETURNING id`,
    o.name,
    slug,
    o.officialType,
    o.imageUrl ?? null,
    o.biography ?? null,
    o.gender ?? null,
    o.dateOfBirth ?? null,
    o.twitterHandle ?? null,
    o.facebookUrl ?? null
  );
  return rows[0].id;
}
function prof(p, k) {
  const pr = p.profile ?? null;
  const v = pr?.[k];
  return typeof v === "string" && v ? v : null;
}
function educationText(p) {
  const pr = p.profile ?? null;
  const e = pr?.education;
  if (Array.isArray(e)) return e.filter(Boolean).join("; ") || null;
  return typeof e === "string" && e ? e : null;
}
async function validParty(tx, acr) {
  if (!acr) return null;
  const r = await tx.$queryRawUnsafe(`SELECT 1 FROM political_parties WHERE acronym = $1`, acr);
  return r.length ? acr : null;
}
var assemblyMemberEntity = {
  targetTable: "assembly_member",
  evidenceEntryType: "position",
  validate(raw) {
    if (!raw || typeof raw !== "object") throw new BadRequestException("malformed assembly_member payload");
    const p = raw;
    if (typeof p.name !== "string" || !p.name) throw new BadRequestException("name required");
    if (typeof p.constituencyCode !== "string" || !p.constituencyCode) {
      throw new BadRequestException("constituencyCode required");
    }
    return p;
  },
  async preflight(tx, p) {
    const c = await tx.$queryRawUnsafe(
      `SELECT 1 FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode
    );
    if (c.length === 0) throw new BadRequestException(`constituency ${p.constituencyCode} does not exist`);
  },
  async insert(tx, p, ctx) {
    const cc = await tx.$queryRawUnsafe(
      `SELECT state_code FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode
    );
    if (!cc.length || !cc[0].state_code) {
      throw new BadRequestException(`constituency ${p.constituencyCode} has no state_code`);
    }
    const officialId = await findOrCreateOfficial(tx, {
      name: p.name,
      imageUrl: p.imageUrl ?? null,
      biography: prof(p, "biography"),
      gender: p.gender ?? null,
      dateOfBirth: prof(p, "date_of_birth"),
      twitterHandle: prof(p, "twitter"),
      facebookUrl: prof(p, "facebook"),
      // official_type is the appointment *category* (chk_official_type allows
      // elected/appointed/civil_servant/judicial/security/traditional/other) — an mha
      // is elected. The role "mha" belongs on official_positions.role, NOT here.
      officialType: "elected"
    });
    await tx.$executeRawUnsafe(
      `UPDATE nigerian_officials SET
         image_url      = COALESCE(image_url, $2),
         gender         = COALESCE(gender, $3),
         biography      = COALESCE(biography, $4),
         date_of_birth  = COALESCE(date_of_birth, $5::date),
         email          = COALESCE(email, $6),
         phone_number   = COALESCE(phone_number, $7),
         office_address = COALESCE(office_address, $8),
         twitter_handle = COALESCE(twitter_handle, $9),
         facebook_url   = COALESCE(facebook_url, $10),
         education      = COALESCE(education, $11),
         updated_at     = now()
       WHERE id = $1`,
      officialId,
      p.imageUrl ?? null,
      p.gender ?? null,
      prof(p, "biography"),
      prof(p, "date_of_birth"),
      prof(p, "email"),
      prof(p, "phone"),
      prof(p, "office_address"),
      prof(p, "twitter"),
      prof(p, "facebook"),
      educationText(p)
    );
    const party = await validParty(tx, p.party ?? null);
    const existing = await tx.$queryRawUnsafe(
      `SELECT id FROM official_positions WHERE official_id = $1 AND constituency_code = $2 AND role = 'mha' LIMIT 1`,
      officialId,
      p.constituencyCode
    );
    let positionId;
    if (existing.length) {
      await tx.$executeRawUnsafe(
        `UPDATE official_positions SET status='active', party_acronym=$2, leadership_role=$3,
           source_type='manual', confidence=$4, review_status='reviewed', reviewed_by=$5,
           end_date=NULL, end_reason=NULL
         WHERE id=$1`,
        existing[0].id,
        party,
        p.leadershipRole ?? null,
        ctx.confidence ?? "high",
        ctx.adminId
      );
      positionId = existing[0].id;
    } else {
      const pos = await tx.$queryRawUnsafe(
        `INSERT INTO official_positions
           (official_id, role, constituency_code, appointment_type, status, start_date,
            party_acronym, leadership_role, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid,'mha',$2,'elected','active',$3::date,$4,$5,'manual',$6,'reviewed',$7) RETURNING id`,
        officialId,
        p.constituencyCode,
        p.startDate ?? "2023-06-13",
        party,
        p.leadershipRole ?? null,
        ctx.confidence ?? "high",
        ctx.adminId
      );
      positionId = pos[0].id;
    }
    await tx.$executeRawUnsafe(
      `UPDATE official_positions
         SET status='contested'
       WHERE role='mha' AND constituency_code=$1 AND status='active' AND id <> $2`,
      p.constituencyCode,
      positionId
    );
    return { id: positionId, officialId };
  }
};
var CREATABLE_ENTITIES = {
  official_education: officialFactEntity("official_education", "education", [
    { key: "institution", column: "institution", type: "string", required: true },
    { key: "institutionType", column: "institution_type", type: "string" },
    { key: "qualification", column: "qualification", type: "string" },
    { key: "field", column: "field", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "graduated", column: "graduated", type: "boolean" },
    { key: "location", column: "location", type: "string" }
  ]),
  official_careers: officialFactEntity("official_careers", "career", [
    { key: "organization", column: "organization", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "industry", column: "industry", type: "string" },
    { key: "employmentType", column: "employment_type", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "description", column: "description", type: "string" }
  ]),
  official_party_affiliations: officialFactEntity(
    "official_party_affiliations",
    "party_affiliation",
    [
      { key: "partyAcronym", column: "party_acronym", type: "string", required: true },
      { key: "startDate", column: "start_date", type: "date" },
      { key: "endDate", column: "end_date", type: "date" },
      { key: "reason", column: "reason", type: "string" }
    ],
    async (tx, payload) => {
      const p = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym
      );
      if (p.length === 0) {
        throw new BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
    }
  ),
  official_committees: officialFactEntity("official_committees", "committee", [
    { key: "committeeName", column: "committee_name", type: "string", required: true },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "positionId", column: "position_id", type: "uuid" },
    { key: "termId", column: "term_id", type: "uuid" },
    { key: "startDate", column: "start_date", type: "date" },
    { key: "endDate", column: "end_date", type: "date" }
  ]),
  official_sponsored_bills: officialFactEntity("official_sponsored_bills", "bill", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "billNumber", column: "bill_number", type: "string" },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "status", column: "status", type: "string" },
    { key: "introducedDate", column: "introduced_date", type: "date" },
    { key: "statusDate", column: "status_date", type: "date" },
    { key: "summary", column: "summary", type: "string" }
  ]),
  // Elections accept EITHER officialId (agent path) OR officialName (curated
  // import — find-or-create). Bespoke entity; behavior with officialId present
  // is identical to the prior officialFactEntity registration.
  official_elections: electionEntity(),
  official_asset_declarations: officialFactEntity("official_asset_declarations", "asset", [
    { key: "year", column: "year", type: "int", required: true },
    { key: "declaredTo", column: "declared_to", type: "string" },
    { key: "amount", column: "amount", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "summary", column: "summary", type: "string" }
  ]),
  official_awards: officialFactEntity("official_awards", "award", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "awardedBy", column: "awarded_by", type: "string" },
    { key: "year", column: "year", type: "int" },
    { key: "category", column: "category", type: "string" },
    { key: "description", column: "description", type: "string" }
  ]),
  official_publications: officialFactEntity("official_publications", "publication", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "type", column: "type", type: "string" },
    { key: "publisher", column: "publisher", type: "string" },
    { key: "year", column: "year", type: "int" }
  ]),
  official_family_members: officialFactEntity("official_family_members", "family", [
    { key: "relationship", column: "relationship", type: "string", required: true },
    { key: "name", column: "name", type: "string" },
    { key: "relatedOfficialId", column: "related_official_id", type: "uuid" },
    { key: "isPublicFigure", column: "is_public_figure", type: "boolean" },
    { key: "notes", column: "notes", type: "string" }
  ]),
  official_legal_cases: officialFactEntity("official_legal_cases", "legal_case", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "caseType", column: "case_type", type: "string", required: true },
    { key: "status", column: "status", type: "string", required: true },
    { key: "forum", column: "forum", type: "string" },
    { key: "caseNumber", column: "case_number", type: "string" },
    { key: "filedDate", column: "filed_date", type: "date" },
    { key: "resolvedDate", column: "resolved_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "role", column: "role", type: "string" },
    { key: "recordKind", column: "record_kind", type: "string" },
    { key: "relatedCorruptionCaseId", column: "related_corruption_case_id", type: "uuid" }
  ], async (tx, payload) => {
    payload.caseType = coerceEnum(payload.caseType, LEGAL_CASE_TYPE);
    payload.status = coerceEnum(payload.status, LEGAL_STATUS);
    const ROLES = ["defendant", "plaintiff", "claimant", "respondent", "named_in"];
    const KINDS = ["adjudicated", "allegation", "listing", "appearance"];
    const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    payload.role = ROLES.includes(norm(payload.role)) ? norm(payload.role) : null;
    payload.recordKind = KINDS.includes(norm(payload.recordKind)) ? norm(payload.recordKind) : null;
    if (legalCaseNewColsPresent !== true) {
      const cols = await tx.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'official_legal_cases' AND column_name IN ('role','record_kind')`
      );
      legalCaseNewColsPresent = cols.length === 2;
    }
    if (!legalCaseNewColsPresent) {
      console.warn(
        "[enrichment] official_legal_cases.role/record_kind columns missing (migration 20260824021900 not applied) \u2014 softening both to null"
      );
      payload.role = null;
      payload.recordKind = null;
    }
  }),
  // Corruption involvement is a COMPOUND create: a corruption_cases row + a
  // corruption_case_parties row linking the official (subjectType='official').
  // Evidence attaches to the case. Bespoke (two-row), like councilors.
  corruption_cases: corruptionInvolvementEntity(),
  // Party officers (chairman/secretary/party leader) — party-scoped, no official.
  party_officers: partyOfficerEntity(),
  // Brand-new political parties (curated import). PK is varchar `acronym`, not a
  // uuid — evidenceEntryType:null so the apply service skips evidence/uuid casts.
  political_parties: politicalPartyEntity(),
  // Assembly member (State House of Assembly, role 'mha'): find-or-create official,
  // upsert active mha position for the seat, atomic downgrade of other holders.
  assembly_member: assemblyMemberEntity
};
function getCreatableEntity(targetTable) {
  return CREATABLE_ENTITIES[targetTable] ?? null;
}

// apps/api/src/enrichment/agent/submit-structured-create.ts
async function submitStructuredCreate(client, input, profile = getProfile(input.domain)) {
  const entity = getCreatableEntity(profile.targetTable);
  if (!entity) {
    throw new Error(`domain ${input.domain} (${profile.targetTable}) has no creatable entity`);
  }
  const payload = entity.validate(input.payload);
  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: "create", targetField: "__create__", sources: tiered },
    profile
  );
  if (!verdict.ok) throw new Error(`corroboration failed: ${verdict.reason}`);
  const status = input.needsHuman ? "needs_human" : "pending";
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO change_proposals
         (target_table, target_pk, target_field, current_value, proposed_value,
          change_kind, status, confidence, reasoning, agent_run_id)
       VALUES ($1, NULL, '__create__', NULL, $2, 'create', $3, $4, $5, $6) RETURNING id`,
      [
        profile.targetTable,
        JSON.stringify(payload),
        status,
        input.confidence ?? "medium",
        input.reasoning ?? null,
        input.agentRunId ?? null
      ]
    );
    const id = ins.rows[0].id;
    for (const s of tiered) {
      await client.query(
        `INSERT INTO proposal_sources
           (proposal_id, url, archive_url, publisher, snippet, format, locator, source_tier, confidence, retrieved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, s.url, null, s.publisher, s.snippet, s.format, s.locator ?? null, s.tier, s.confidence ?? "medium", s.retrievedAt]
      );
    }
    await client.query("COMMIT");
    return { id };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {
    });
    throw e;
  }
}

// apps/api/src/enrichment/agent/corruption-lookup.ts
var SEARCH_URL = "https://v1.corruptioncases.ng/api/cases/search";
var PUBLIC_CASE_BASE = "https://corruptioncases.ng/cases/";
var MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12"
};
var CASE_TYPES = /* @__PURE__ */ new Set([
  "fraud",
  "embezzlement",
  "bribery",
  "money_laundering",
  "abuse_of_office",
  "procurement_fraud",
  "diversion",
  "other"
]);
var STATUS_MAP = {
  "alleged": "alleged",
  "under investigation": "under_investigation",
  "investigation": "under_investigation",
  "charged": "charged",
  "on trial": "on_trial",
  "trial": "on_trial",
  "convicted": "convicted",
  "conviction": "convicted",
  "acquitted": "acquitted",
  "discharged": "acquitted",
  "dismissed": "dismissed",
  "struck out": "dismissed",
  "settled": "settled",
  "on appeal": "appeal",
  "appeal": "appeal"
};
function normalizeName(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function defendantMatchesOfficial(officialName, defendantName) {
  const off = normalizeName(officialName).split(" ").filter(Boolean);
  if (off.length === 0) return false;
  const def = new Set(normalizeName(defendantName).split(" ").filter(Boolean));
  return off.every((t) => def.has(t));
}
function parseAmount(raw) {
  if (typeof raw !== "string") return void 0;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return void 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : void 0;
}
function parseArraignmentDate(raw) {
  if (typeof raw !== "string") return void 0;
  const m = raw.trim().match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return void 0;
  const mm = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mm) return void 0;
  return `${m[3]}-${mm}-${m[2].padStart(2, "0")}`;
}
function mapCaseType(raw) {
  const norm = String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return CASE_TYPES.has(norm) ? norm : "other";
}
function mapStatus(status, stage) {
  const sg = String(stage ?? "").trim().toLowerCase();
  if (sg) {
    if (sg.includes("convict")) return "convicted";
    if (sg.includes("acquit") || sg.includes("discharg")) return "acquitted";
    if (sg.includes("dismiss") || sg.includes("struck")) return "dismissed";
    if (sg.includes("settl")) return "settled";
    if (sg.includes("appeal")) return "appeal";
    if (sg.includes("prosecut") || sg.includes("trial")) return "on_trial";
    if (sg.includes("charg")) return "charged";
    if (sg.includes("investigat")) return "under_investigation";
  }
  return STATUS_MAP[String(status ?? "").trim().toLowerCase()] ?? "on_trial";
}
async function fetchJsonDefault(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`corruptioncases.ng responded ${res.status}`);
  return res.json();
}
async function lookupCorruptionCases(client, official, deps) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(official.name)}`;
  const body = await deps.fetchJson(url);
  const cases = Array.isArray(body?.cases) ? body.cases : [];
  const result = { filed: 0, skipped: [] };
  for (const c of cases) {
    const key = typeof c.slug === "string" && c.slug || String(c.title ?? "unknown");
    try {
      const defendants = Array.isArray(c.defendants) ? c.defendants : [];
      const matched = defendants.find(
        (d) => typeof d?.name === "string" && defendantMatchesOfficial(official.name, d.name)
      );
      if (!matched || typeof matched.name !== "string") {
        result.skipped.push({ key, reason: "no defendant match for the official" });
        continue;
      }
      const subjectName = matched.name;
      const title = typeof c.title === "string" ? c.title : "";
      if (!title) {
        result.skipped.push({ key, reason: "case has no title" });
        continue;
      }
      const dedupSlug = slugifyName(`${subjectName} ${title}`).slice(0, 140) || "corruption-case";
      const dup = await client.query("SELECT 1 FROM corruption_cases WHERE slug = $1", [dedupSlug]);
      if ((dup.rows?.length ?? 0) > 0) {
        result.skipped.push({ key, reason: `slug already exists: ${dedupSlug}` });
        continue;
      }
      const agencyShort = typeof c.agency?.shortname === "string" && c.agency.shortname || typeof c.agency?.name === "string" && c.agency.name || void 0;
      const payload = {
        officialId: official.id,
        subjectName,
        title,
        caseType: mapCaseType(c.type),
        status: mapStatus(c.status, c.stage),
        role: "defendant",
        currency: "NGN"
      };
      if (typeof c.description === "string" && c.description) payload.summary = c.description;
      if (agencyShort) payload.forum = agencyShort;
      const amount = parseAmount(c.amount);
      if (amount !== void 0) payload.amountInvolved = amount;
      const chargeDate = parseArraignmentDate(c.date_of_arraignment);
      if (chargeDate) payload.chargeDate = chargeDate;
      const apiSlug = typeof c.slug === "string" && c.slug ? c.slug : dedupSlug;
      const backlink = {
        url: `${PUBLIC_CASE_BASE}${apiSlug}`,
        publisher: "corruptioncases.ng",
        snippet: `${title} \u2014 ${agencyShort ?? ""}`.trim(),
        format: "html",
        locator: apiSlug,
        retrievedAt: deps.now().toISOString()
      };
      await submitStructuredCreate(client, {
        domain: "corruption",
        payload,
        confidence: "medium",
        needsHuman: false,
        reasoning: "Sourced from corruptioncases.ng (TransparencIT)",
        agentRunId: deps.agentRunId,
        sources: [backlink]
      });
      result.filed += 1;
    } catch (e) {
      result.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}

// apps/api/src/enrichment/agent/courtlistener-lookup.ts
var SEARCH_URL2 = "https://www.courtlistener.com/api/rest/v4/search/";
var SITE = "https://www.courtlistener.com";
var MAX_PAGES = 3;
var NOTE_LEADS_CAP = 20;
var PARTIES_FETCH_CAP = 5;
var RECHECK_DAYS = 90;
var CAPTION_STOP = /* @__PURE__ */ new Set(["united", "states", "america", "usa", "us", "of", "the", "v", "vs", "et", "al"]);
var HONORIFICS = /* @__PURE__ */ new Set([
  "chief",
  "alhaji",
  "alhaja",
  "hon",
  "honourable",
  "honorable",
  "sen",
  "senator",
  "dr",
  "barr",
  "barrister",
  "engr",
  "engineer",
  "prof",
  "professor",
  "arc",
  "mr",
  "mrs",
  "ms",
  "miss",
  "sir",
  "dame",
  "otunba",
  "oba",
  "hrh",
  "hrm",
  "gen",
  "general",
  "col",
  "colonel",
  "capt",
  "captain",
  "major",
  "air",
  "cdre",
  "comrade",
  "pastor",
  "rev",
  "reverend",
  "elder",
  "deacon",
  "evang",
  "evangelist",
  "prince",
  "princess",
  "amb",
  "ambassador",
  "chf",
  "rtd",
  "jp",
  "mni",
  "san",
  "phd"
]);
var COMMON_TOKENS = /* @__PURE__ */ new Set([
  // ubiquitous Muslim/Northern given names + variants
  "mohammed",
  "muhammed",
  "muhammad",
  "mohammad",
  "ahmed",
  "ahmad",
  "ali",
  "ibrahim",
  "musa",
  "sani",
  "umar",
  "usman",
  "abubakar",
  "hassan",
  "hussain",
  "hussein",
  "khalid",
  "bello",
  "abdullahi",
  "abdullah",
  "abdulla",
  "adamu",
  "bala",
  "garba",
  "yakubu",
  "suleiman",
  "sulaiman",
  "yusuf",
  "aliyu",
  "abdul",
  "lateef",
  "ismail",
  "isah",
  "isa",
  "idris",
  "shehu",
  "salisu",
  "kabiru",
  "kabir",
  "tanko",
  "danjuma",
  "aminu",
  "nasir",
  "mustapha",
  "yahaya",
  "lawal",
  "baba",
  "abba",
  // ubiquitous Christian/Southern + Western given names
  "emmanuel",
  "john",
  "joseph",
  "james",
  "peter",
  "paul",
  "samuel",
  "david",
  "daniel",
  "michael",
  "anthony",
  "sunday",
  "monday",
  "victor",
  "victoria",
  "mary",
  "grace",
  "blessing",
  "donald",
  "philip",
  "phillip",
  "francis",
  "patrick",
  "christopher",
  "stephen",
  "steven",
  "george",
  "charles",
  "richard",
  "robert",
  "william",
  "thomas",
  "solomon",
  "felix",
  "ifeanyi",
  "adekunle",
  "adebayo",
  "olanrewaju",
  "adeleke",
  // very common surnames (US-collision-prone)
  "smith",
  "brown",
  "johnson",
  "williams",
  "jones",
  "duke",
  "obi",
  "eze",
  "okafor",
  "okeke",
  "okoro",
  "edet",
  "effiong",
  "okon",
  "bassey",
  "etim",
  "asuquo",
  "mahmud"
]);
function normalizeName2(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function nameTokens(s) {
  const toks = normalizeName2(s).split(" ").filter((t) => t && !CAPTION_STOP.has(t));
  let start = 0;
  while (start < toks.length && HONORIFICS.has(toks[start]) && toks.length - start - 1 >= 2) start++;
  return toks.slice(start);
}
function partyMatchesOfficial(officialName, partyName) {
  const off = nameTokens(officialName);
  if (off.length === 0) return false;
  const party = new Set(nameTokens(partyName));
  return off.every((t) => party.has(t));
}
function isDistinctiveName(name) {
  const toks = nameTokens(name);
  return toks.length >= 2 && toks.some((t) => !COMMON_TOKENS.has(t));
}
var PROPERTY = /(real property|\bm\/?y\b|\$|\bfunds\b|\bassets\b|located|vehicle|premises|parcel|proceeds|vessel|aircraft|one\s+\d|approximately)/i;
var CRIMINAL_PREFIXES = ["united states v", "united states of america v", "usa v", "u s a v", "u s v"];
function classifyCaseType(caseName, courtId) {
  if (/^[a-z]{2,4}b$/.test(String(courtId || ""))) return "civil";
  const cn = normalizeName2(caseName);
  if (CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return PROPERTY.test(caseName) ? "civil" : "criminal";
  }
  return "civil";
}
function roleFromCaption(caseName, caseType, matchedParty) {
  const cn = normalizeName2(caseName);
  if (caseType === "criminal" && CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return "defendant";
  }
  const sides = cn.split(/\bv\b/);
  if (sides.length === 2) {
    const party = nameTokens(matchedParty);
    if (party.length) {
      const pset = new Set(party);
      const inSide = (side) => {
        const st = nameTokens(side);
        if (!st.length) return false;
        const sset = new Set(st);
        return st.every((t) => pset.has(t)) || party.every((t) => sset.has(t));
      };
      if (inSide(sides[0]) && !inSide(sides[1])) return "plaintiff";
      if (inSide(sides[1]) && !inSide(sides[0])) return "defendant";
    }
  }
  return null;
}
var ROLE_MAP = {
  defendant: "defendant",
  plaintiff: "plaintiff",
  claimant: "claimant",
  respondent: "respondent",
  petitioner: "plaintiff",
  "counter-claimant": "claimant"
};
async function fetchJsonDefault2(url, headers) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...headers ? { headers } : {}, signal: AbortSignal.timeout(45e3) });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const after = Number.parseInt(res.headers.get("retry-after") ?? "", 10);
      if (Number.isFinite(after) && after > 0 && after <= 20) {
        await new Promise((r) => setTimeout(r, after * 1e3));
        continue;
      }
      throw new Error(`courtlistener throttled (429), retry-after ${after || "unknown"}s`);
    }
    throw new Error(`courtlistener responded ${res.status}`);
  }
}
function str(v) {
  return typeof v === "string" ? v : "";
}
function countOf(body) {
  const c = body?.count;
  if (typeof c === "number") return c;
  if (c && typeof c === "object" && typeof c.value === "number") {
    return c.value;
  }
  return 0;
}
function phraseUrl(name) {
  const cleaned = nameTokens(name).join(" ") || normalizeName2(name);
  return `${SEARCH_URL2}?type=r&q=${encodeURIComponent(`"${cleaned}"`)}`;
}
function docketIdOf(docketPath) {
  const m = /\/docket\/(\d+)\//.exec(docketPath);
  return m ? m[1] : "";
}
async function fetchPages(url, deps, headers) {
  const results = [];
  let total = 0;
  let requests = 0;
  let next = url;
  for (let page = 0; next && page < MAX_PAGES; page++) {
    const body = await deps.fetchJson(next, headers);
    requests++;
    const rows = Array.isArray(body?.results) ? body.results : [];
    results.push(...rows);
    total = Math.max(total, countOf(body));
    const n = typeof body?.next === "string" ? body.next : "";
    next = n.startsWith(`${SITE}/`) ? n : null;
  }
  return { results, total, truncated: Boolean(next), requests };
}
async function lookupCourtRecords(client, official, deps) {
  const headers = deps.token ? { Authorization: `Token ${deps.token}` } : void 0;
  const primary = await fetchPages(phraseUrl(official.name), deps, headers);
  let { results, total, truncated } = primary;
  let apiRequests = primary.requests;
  const toks = nameTokens(official.name);
  if (results.length === 0 && toks.length >= 3) {
    const variant = `${toks[0]} ${toks[toks.length - 1]}`;
    try {
      const v = await fetchPages(phraseUrl(variant), deps, headers);
      apiRequests += v.requests;
      results = v.results;
      total = Math.max(total, v.total);
      truncated = truncated || v.truncated;
    } catch {
      apiRequests += 1;
    }
  }
  const out = {
    filed: 0,
    skipped: [],
    leads: [],
    totalCount: total,
    truncated,
    attemptRecorded: false,
    apiRequests,
    warnings: []
  };
  const warnOnce = (w) => {
    if (!out.warnings.includes(w)) out.warnings.push(w);
  };
  const distinctive = isDistinctiveName(official.name);
  const seen = /* @__PURE__ */ new Set();
  let partiesFetches = 0;
  for (const r of results) {
    const caseName = str(r.caseName);
    const docketNumber = str(r.docketNumber);
    const key = docketNumber || caseName || "unknown";
    try {
      if (!caseName) {
        out.skipped.push({ key, reason: "result has no caseName" });
        continue;
      }
      const runKey = `${docketNumber}|${normalizeName2(caseName)}`;
      if (seen.has(runKey)) {
        out.skipped.push({ key, reason: "duplicate docket in this result set" });
        continue;
      }
      seen.add(runKey);
      const parties = Array.isArray(r.party) ? r.party.map(str).filter(Boolean) : [];
      const court = str(r.court);
      const courtId = str(r.court_id);
      const caseType = classifyCaseType(caseName, courtId);
      const docketPath = str(r.docket_absolute_url);
      const backlinkUrl = docketPath ? SITE + docketPath : "";
      const judge = str(r.assignedTo);
      const cause = str(r.cause);
      const suitNature = str(r.suitNature);
      const pacerCaseId = str(r.pacer_case_id);
      const leadExtra = {
        ...judge ? { judge } : {},
        ...cause ? { cause } : {},
        ...suitNature ? { suitNature } : {},
        ...str(r.dateFiled) ? { dateFiled: str(r.dateFiled) } : {},
        ...pacerCaseId ? { pacerCaseId } : {}
      };
      const discoveredAt = deps.now().toISOString();
      const matched = parties.find((p) => partyMatchesOfficial(official.name, p));
      if (!matched || !distinctive) {
        out.leads.push({
          caseName,
          court,
          docketNumber,
          url: backlinkUrl || SITE,
          caseType,
          discoveredAt,
          ...leadExtra,
          reason: !matched ? parties.length ? "named-in only (not a party name-match)" : "full-text hit, no party list" : "party match on an all-common name \u2014 likely namesake, needs human"
        });
        continue;
      }
      if (!backlinkUrl) {
        out.leads.push({
          caseName,
          court,
          docketNumber,
          url: SITE,
          caseType,
          discoveredAt,
          ...leadExtra,
          reason: "party match but no docket URL \u2014 backlink required to file"
        });
        continue;
      }
      try {
        const dupLive = await client.query(
          "SELECT 1 FROM official_legal_cases WHERE official_id = $1 AND case_number = $2",
          [official.id, docketNumber]
        );
        if ((dupLive.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `case_number already exists: ${docketNumber}` });
          continue;
        }
        const dupPending = await client.query(
          `SELECT 1 FROM change_proposals
            WHERE target_table = 'official_legal_cases'
              AND status IN ('pending','needs_human','approved')
              AND proposed_value->>'officialId' = $1
              AND proposed_value->>'caseNumber' = $2`,
          [official.id, docketNumber]
        );
        if ((dupPending.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `pending proposal already exists: ${docketNumber}` });
          continue;
        }
      } catch (e) {
        warnOnce(`dedup unavailable (${e instanceof Error ? e.message : String(e)}) \u2014 filing without dedup`);
      }
      let role = null;
      const docketId = docketIdOf(docketPath);
      if (docketId && partiesFetches < PARTIES_FETCH_CAP) {
        partiesFetches++;
        try {
          const pbody = await deps.fetchJson(
            `${SITE}/api/rest/v4/parties/?docket=${docketId}`,
            headers
          );
          out.apiRequests += 1;
          const prow = (pbody?.results ?? []).find(
            (p) => typeof p?.name === "string" && partyMatchesOfficial(official.name, p.name)
          );
          const ptype = str(prow?.party_types?.[0]?.name).toLowerCase();
          role = ROLE_MAP[ptype] ?? null;
        } catch {
          out.apiRequests += 1;
        }
      }
      if (!role) role = roleFromCaption(caseName, caseType, matched);
      const resolvedDate = str(r.dateTerminated);
      const payload = {
        officialId: official.id,
        title: caseName,
        caseType,
        // Conservative: RECAP metadata has NO disposition, so never
        // "convicted"/"acquitted" — the human reviewer sets the real outcome
        // from the docket. A TERMINATED docket is "closed" (concluded,
        // disposition unverified); an OPEN criminal docket means the defendant
        // is at least "charged"; an open civil matter is pending ("on_trial").
        status: resolvedDate ? "closed" : caseType === "criminal" ? "charged" : "on_trial",
        // A docket party listing is an APPEARANCE (plan 58 §3.8) — not adjudicated.
        recordKind: "appearance"
      };
      if (role) payload.role = role;
      if (court) payload.forum = court;
      if (docketNumber) payload.caseNumber = docketNumber;
      const filedDate = str(r.dateFiled);
      if (filedDate) payload.filedDate = filedDate;
      if (resolvedDate) {
        payload.resolvedDate = resolvedDate;
        payload.outcome = `Docket terminated ${resolvedDate} \u2014 disposition not in RECAP metadata; verify from the docket.`;
      }
      const snippetBits = [caseName, court, judge && `Judge ${judge}`, suitNature, cause].filter(Boolean).join(" \u2014 ");
      const backlink = {
        url: backlinkUrl,
        publisher: "courtlistener.com",
        snippet: snippetBits,
        format: "html",
        locator: docketNumber || void 0,
        retrievedAt: deps.now().toISOString()
      };
      await submitStructuredCreate(client, {
        domain: "legal_cases",
        payload,
        confidence: "medium",
        needsHuman: true,
        // always — outcome + relevance need a human to read the docket
        reasoning: `Sourced from CourtListener/RECAP (Free Law Project); official matched party "${matched}"` + (pacerCaseId ? ` (PACER case id ${pacerCaseId})` : ""),
        agentRunId: deps.agentRunId,
        sources: [backlink]
      });
      out.filed += 1;
    } catch (e) {
      out.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  if (deps.deepLeads) {
    const cleaned = nameTokens(official.name).join(" ");
    for (const lead of out.leads.slice(0, 3)) {
      const id = docketIdOf(lead.url);
      if (!id) continue;
      try {
        const body = await deps.fetchJson(
          `${SEARCH_URL2}?type=rd&q=${encodeURIComponent(`"${cleaned}"`)}&docket_id=${id}`,
          headers
        );
        out.apiRequests += 1;
        const doc = body?.results?.[0];
        if (doc) {
          const desc = str(doc.description);
          const durl = str(doc.absolute_url);
          lead.documentHint = `${desc}${durl ? ` (${SITE}${durl})` : ""}`.trim() || void 0;
        }
      } catch {
        out.apiRequests += 1;
      }
    }
  }
  try {
    await client.query("BEGIN");
    try {
      const prev = await client.query(
        "SELECT note FROM enrichment_attempts WHERE official_id = $1 AND category = 'legal_case' FOR UPDATE",
        [official.id]
      );
      const prevNote = prev.rows?.[0]?.note;
      let oldLeads = [];
      if (prevNote) {
        try {
          oldLeads = JSON.parse(prevNote).leads ?? [];
        } catch {
        }
      }
      const have = new Set(oldLeads.map((l) => `${l.url}|${l.docketNumber}`));
      const mergedLeads = [
        ...oldLeads,
        ...out.leads.filter((l) => !have.has(`${l.url}|${l.docketNumber}`))
      ].slice(0, NOTE_LEADS_CAP);
      const note = JSON.stringify({
        source: "courtlistener",
        usChecked: true,
        totalCount: out.totalCount,
        truncated: out.truncated,
        filed: out.filed,
        apiRequests: out.apiRequests,
        warnings: out.warnings,
        leads: mergedLeads,
        leadsThisRun: out.leads.length,
        leadsStored: mergedLeads.length,
        at: deps.now().toISOString()
      });
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, proposal_count, note, last_attempted_at, next_eligible_at, updated_at)
         VALUES ($1, 'legal_case', $2, $3, $4, now(), now() + interval '${RECHECK_DAYS} days', now())
         ON CONFLICT (official_id, category) DO UPDATE
           SET status = EXCLUDED.status, proposal_count = EXCLUDED.proposal_count,
               note = EXCLUDED.note, last_attempted_at = now(),
               next_eligible_at = now() + interval '${RECHECK_DAYS} days', updated_at = now()`,
        [official.id, out.filed > 0 ? "filled" : "nothing_found", out.filed, note]
      );
      await client.query("COMMIT");
      out.attemptRecorded = true;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {
      });
      throw e;
    }
  } catch {
    out.attemptRecorded = false;
  }
  return out;
}

// apps/api/src/enrichment/sweeper/run-hermes.ts
var import_child_process = require("child_process");
var HERMES_BIN = process.env.HERMES_BIN || "hermes";
var HERMES_SKILL = process.env.HERMES_STRUCTURED_SKILL || "enrichment-structured";
var HERMES_TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MS ?? 8 * 60 * 1e3);
var EXEC_PREFIX = (process.env.HERMES_EXEC_PREFIX || "").trim();
function gapPrompt(gap) {
  const cat = CATEGORY_BY_KEY[gap.category];
  const label = cat?.label ?? gap.category;
  return [
    `Enrich exactly ONE category for ONE Nigerian official, then stop.`,
    `Official: ${gap.name} (id ${gap.officialId}${gap.slug ? `, slug ${gap.slug}` : ""}).`,
    `Category: ${label} [key: ${gap.category}, profile domain: ${gap.domain}].`,
    `Follow the ${HERMES_SKILL} skill: research with the browser, corroborate against the`,
    `'${gap.domain}' profile's source bar, and ONLY if the bar is met call`,
    `submit-structured-create for this official + category. If you cannot corroborate,`,
    `do nothing and report "nothing found". Never touch any other official or category,`,
    `never fabricate, always cite sources.`
  ].join(" ");
}
function runHermes(gap) {
  const hermesArgs = ["-z", gapPrompt(gap), "--skills", HERMES_SKILL, "-t", "browser,terminal,file"];
  const prefix = EXEC_PREFIX ? EXEC_PREFIX.split(/\s+/) : [];
  const argv = [...prefix, HERMES_BIN, ...hermesArgs];
  const [cmd, ...args] = argv;
  return new Promise((resolve) => {
    (0, import_child_process.execFile)(
      cmd,
      args,
      { timeout: HERMES_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
      (err) => resolve({ ok: !err })
    );
  });
}

// apps/api/src/enrichment/sweeper/sweeper.ts
function recheckFor(outcome, cfg) {
  return outcome === "filled" ? cfg.recheckDays.filled : outcome === "nothing_found" ? cfg.recheckDays.nothingFound : cfg.recheckDays.error;
}
async function processGap(gap, deps, cfg) {
  const since = deps.now().toISOString();
  await deps.markPending(gap);
  let run;
  try {
    run = await deps.runHermes(gap);
  } catch (e) {
    run = { ok: false };
    deps.log("hermes threw", { official: gap.officialId, category: gap.category, error: String(e) });
  }
  let outcome;
  let proposalCount = 0;
  if (!run.ok) {
    outcome = "error";
  } else {
    proposalCount = await deps.countNewProposals(gap, since);
    outcome = proposalCount > 0 ? "filled" : "nothing_found";
  }
  await deps.recordOutcome(gap, outcome, proposalCount, recheckFor(outcome, cfg));
  await deps.bumpBudget(run.costUsd ?? 0);
  deps.log("gap processed", { official: gap.officialId, category: gap.category, outcome, proposalCount });
  return outcome;
}
async function runSweepLoop(deps, cfg, maxLoops = Infinity) {
  let loops = 0;
  while (loops < maxLoops) {
    loops++;
    if (deps.killed()) {
      deps.log("kill switch active \u2014 stopping");
      return;
    }
    const spent = await deps.invocationsToday();
    if (spent >= cfg.dailyCap) {
      deps.log("daily budget exhausted \u2014 idling", { spent, cap: cfg.dailyCap });
      await deps.sleep(cfg.idlePollMs);
      continue;
    }
    const gaps = await deps.findGaps(cfg.batch);
    if (gaps.length === 0) {
      deps.log("no eligible gaps \u2014 idling");
      await deps.sleep(cfg.idlePollMs);
      continue;
    }
    for (const gap of gaps) {
      if (deps.killed()) {
        deps.log("kill switch active mid-batch \u2014 stopping");
        return;
      }
      if (await deps.invocationsToday() >= cfg.dailyCap) {
        deps.log("daily budget hit mid-batch \u2014 idling", { cap: cfg.dailyCap });
        break;
      }
      await processGap(gap, deps, cfg);
      await deps.sleep(cfg.paceMs);
    }
  }
}

// apps/api/src/enrichment/sweeper/sweeper.cli.ts
var num = (v, d) => v && !Number.isNaN(Number(v)) ? Number(v) : d;
var config = {
  batch: num(process.env.SWEEPER_BATCH, 5),
  paceMs: num(process.env.SWEEPER_PACE_MS, 9e4),
  // 90s between officials
  idlePollMs: num(process.env.SWEEPER_IDLE_MS, 15 * 60 * 1e3),
  // 15m
  dailyCap: num(process.env.SWEEPER_DAILY_CAP, 100),
  recheckDays: {
    filled: num(process.env.SWEEPER_RECHECK_FILLED_DAYS, 180),
    nothingFound: num(process.env.SWEEPER_RECHECK_NOTHING_DAYS, 90),
    error: num(process.env.SWEEPER_RECHECK_ERROR_DAYS, 1)
  }
};
var KILL_FILE = process.env.SWEEPER_KILL_FILE || "/tmp/enrichment-sweeper.kill";
var VALID_SWEEP_TYPES = /* @__PURE__ */ new Set([
  "presidential",
  "vice_presidential",
  "gubernatorial",
  "deputy_gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "lga_vice_chairman",
  "councilor",
  "other"
]);
var SWEEP_ELECTION_TYPES = (process.env.SWEEPER_ELECTION_TYPES ?? "").split(",").map((t) => t.trim()).filter(Boolean);
for (const t of SWEEP_ELECTION_TYPES) {
  if (!VALID_SWEEP_TYPES.has(t)) throw new Error(`SWEEPER_ELECTION_TYPES: unknown election type "${t}"`);
}
var CL_HOURLY_BUDGET = Number(process.env.SWEEPER_CL_HOURLY_BUDGET || 44);
var CL_DAILY_BUDGET = Number(process.env.SWEEPER_CL_DAILY_BUDGET || 110);
var CL_RESERVE = 9;
var clSpends = [];
function clSpend(n) {
  const now = Date.now();
  const dayCutoff = now - 24 * 60 * 60 * 1e3;
  while (clSpends.length && clSpends[0].at < dayCutoff) clSpends.shift();
  if (n > 0) clSpends.push({ at: now, n });
  const hourCutoff = now - 60 * 60 * 1e3;
  let usedHour = 0;
  let usedDay = 0;
  for (const e of clSpends) {
    usedDay += e.n;
    if (e.at >= hourCutoff) usedHour += e.n;
  }
  return usedHour + CL_RESERVE <= CL_HOURLY_BUDGET && usedDay + CL_RESERVE <= CL_DAILY_BUDGET;
}
function tableFor(gap) {
  return CATEGORY_BY_KEY[gap.category]?.table ?? gap.category;
}
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  const runHermesOrLookup = async (gap) => {
    if (gap.category === "corruption") {
      await lookupCorruptionCases(
        client,
        { id: gap.officialId, name: gap.name },
        { fetchJson: fetchJsonDefault, now: () => /* @__PURE__ */ new Date() }
      );
      return { ok: true, costUsd: 0 };
    }
    if (gap.category === "legal_case" && process.env.COURTLISTENER_TOKEN) {
      const log = (msg, meta) => process.stdout.write(JSON.stringify({ t: (/* @__PURE__ */ new Date()).toISOString(), sweeper: msg, official: gap.officialId, ...meta }) + "\n");
      if (!clSpend(0)) {
        log("courtlistener pre-step skipped (hourly budget exhausted)", { budgetLeft: 0 });
        return runHermes(gap);
      }
      try {
        const res = await lookupCourtRecords(
          client,
          { id: gap.officialId, name: gap.name },
          { fetchJson: fetchJsonDefault2, now: () => /* @__PURE__ */ new Date(), token: process.env.COURTLISTENER_TOKEN }
        );
        clSpend(res.apiRequests);
        log("courtlistener pre-step done", {
          filed: res.filed,
          skipped: res.skipped.length,
          leads: res.leads.length,
          totalCount: res.totalCount,
          truncated: res.truncated,
          apiRequests: res.apiRequests,
          attemptRecorded: res.attemptRecorded,
          warnings: res.warnings
        });
      } catch (e) {
        clSpend(2);
        log("courtlistener pre-step failed (continuing to browse)", {
          error: e instanceof Error ? e.message : String(e)
        });
      }
      return runHermes(gap);
    }
    return runHermes(gap);
  };
  const deps = {
    findGaps: (limit) => findStructuredGaps(client, limit, SWEEP_ELECTION_TYPES.length ? { electionTypes: SWEEP_ELECTION_TYPES } : {}),
    runHermes: runHermesOrLookup,
    async countNewProposals(gap, sinceIso) {
      const res = await client.query(
        `SELECT count(*)::int AS n FROM change_proposals
         WHERE target_table = $1
           AND status IN ('pending', 'needs_human', 'approved')
           AND (proposed_value->>'officialId') = $2
           AND created_at >= $3`,
        [tableFor(gap), gap.officialId, sinceIso]
      );
      return res.rows[0]?.n ?? 0;
    },
    async markPending(gap) {
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, 'pending', now(), now())
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = 'pending', last_attempted_at = now(), updated_at = now()`,
        [gap.officialId, gap.category]
      );
    },
    async recordOutcome(gap, outcome, proposalCount, recheckDays) {
      await client.query(
        `INSERT INTO enrichment_attempts
           (official_id, category, status, proposal_count, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, $3, $4, now(), now() + ($5 || ' days')::interval)
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = $3, proposal_count = $4, last_attempted_at = now(),
                       next_eligible_at = now() + ($5 || ' days')::interval, updated_at = now()`,
        [gap.officialId, gap.category, outcome, proposalCount, String(recheckDays)]
      );
    },
    async invocationsToday() {
      const res = await client.query(
        `SELECT invocations FROM enrichment_budget WHERE day = current_date`
      );
      return res.rows[0]?.invocations ?? 0;
    },
    async bumpBudget(costUsd) {
      await client.query(
        `INSERT INTO enrichment_budget (day, invocations, est_cost_usd)
         VALUES (current_date, 1, $1)
         ON CONFLICT (day)
         DO UPDATE SET invocations = enrichment_budget.invocations + 1,
                       est_cost_usd = enrichment_budget.est_cost_usd + $1, updated_at = now()`,
        [costUsd]
      );
    },
    killed: () => process.env.SWEEPER_KILL === "1" || (0, import_fs.existsSync)(KILL_FILE),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => /* @__PURE__ */ new Date(),
    log: (msg, meta) => process.stdout.write(JSON.stringify({ t: (/* @__PURE__ */ new Date()).toISOString(), sweeper: msg, ...meta }) + "\n")
  };
  deps.log("sweeper starting", { config: { ...config, killFile: KILL_FILE } });
  try {
    await runSweepLoop(deps, config);
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
