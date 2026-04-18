import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import * as fs from "node:fs";
import * as path from "node:path";

interface GeoFeature {
  type: string;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any[];
  };
}

interface GeoCollection {
  type: string;
  features: GeoFeature[];
}

@Injectable()
export class GeoService implements OnModuleInit {
  async getStats() {
    try {
      const [states, lgas, wards, minFaac, maxFaac] = await Promise.all([
        this.prisma.nigerianState.count(),
        this.prisma.nigerianLga.count(),
        this.prisma.nigerianWard.count(),
        this.prisma.faacDisbursement.aggregate({ _min: { disbursementYear: true } }),
        this.prisma.faacDisbursement.aggregate({ _max: { disbursementYear: true } }),
      ]);

      const minYear = minFaac._min.disbursementYear || 2019;
      const maxYear = maxFaac._max.disbursementYear || 2024;
      const faacYears = `${minYear}-${maxYear.toString().slice(2)}`;

      return {
        states,
        lgas,
        wards,
        faacYears,
      };
    } catch (error) {
      this.logger.error("Error fetching stats", error);
      return { states: 36, lgas: 774, wards: 8809, faacYears: "2019-24" };
    }
  }

  private readonly logger = new Logger(GeoService.name);
  private stateFeatures: GeoFeature[] = [];
  private lgaFeatures: GeoFeature[] = [];

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.loadGeoData();
  }

  private loadGeoData() {
    try {
      let basePath = path.resolve(process.cwd(), "../../packages/source/nga_admin_boundaries.geojson");
      if (!fs.existsSync(basePath)) {
        basePath = path.resolve(process.cwd(), "packages/source/nga_admin_boundaries.geojson");
      }
      this.logger.log(`GeoJSON base path: ${basePath}, exists: ${fs.existsSync(basePath)}`);

      const statePath = path.join(basePath, "nga_admin1.geojson");
      if (fs.existsSync(statePath)) {
        const data = JSON.parse(fs.readFileSync(statePath, "utf-8")) as GeoCollection;
        this.stateFeatures = data.features;
        this.logger.log(`Loaded ${this.stateFeatures.length} state boundaries`);
        if (this.stateFeatures.length > 0) {
          this.logger.log(`Sample state property keys: ${Object.keys(this.stateFeatures[0].properties).join(", ")}`);
        }
      } else {
        this.logger.warn(`State GeoJSON NOT FOUND at: ${statePath}`);
      }

      const lgaPath = path.join(basePath, "nga_admin2.geojson");
      if (fs.existsSync(lgaPath)) {
        const data = JSON.parse(fs.readFileSync(lgaPath, "utf-8")) as GeoCollection;
        this.lgaFeatures = data.features;
        this.logger.log(`Loaded ${this.lgaFeatures.length} LGA boundaries`);
      } else {
        this.logger.warn(`LGA GeoJSON NOT FOUND at: ${lgaPath}`);
      }
    } catch (err) {
      this.logger.warn("Could not load GeoJSON boundaries. Reverse geocoding will be unavailable.", err);
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<{
    stateCode: string | null;
    stateName: string | null;
    lgaCode: string | null;
    lgaName: string | null;
    wardCode: string | null;
    wardName: string | null;
  }> {
    this.logger.log(`[reverseGeocode] input: lat=${lat}, lng=${lng}`);
    this.logger.log(`[reverseGeocode] stateFeatures count: ${this.stateFeatures.length}, lgaFeatures count: ${this.lgaFeatures.length}`);

    let stateCode: string | null = null;
    let stateName: string | null = null;
    let lgaCode: string | null = null;
    let lgaName: string | null = null;

    // Find state
    let stateMatchFound = false;
    for (const feature of this.stateFeatures) {
      if (this.pointInPolygon(lat, lng, feature.geometry)) {
        stateMatchFound = true;
        this.logger.log(`[reverseGeocode] polygon match! feature properties: ${JSON.stringify(feature.properties)}`);
        stateName = feature.properties.adm1_name || feature.properties.admin1Name_en || feature.properties.admin1Name || null;
        this.logger.log(`[reverseGeocode] extracted stateName: "${stateName}"`);
        // Look up state code from DB
        if (stateName) {
          let searchStateName = stateName;
          if (stateName === "Federal Capital Territory") {
            searchStateName = "FCT";
          }
          
          const state = await this.prisma.nigerianState.findFirst({
            where: { name: { equals: searchStateName, mode: "insensitive" } },
          });
          this.logger.log(`[reverseGeocode] DB state lookup result: ${JSON.stringify(state)}`);
          stateCode = state?.code ?? null;
        }
        break;
      }
    }
    if (!stateMatchFound) {
      this.logger.warn(`[reverseGeocode] NO state polygon matched for lat=${lat}, lng=${lng}`);
    }

    // Find LGA
    let lgaMatchFound = false;
    for (const feature of this.lgaFeatures) {
      if (this.pointInPolygon(lat, lng, feature.geometry)) {
        lgaMatchFound = true;
        const lgaName_ = feature.properties.adm2_name || feature.properties.admin2Name_en || feature.properties.admin2Name || null;
        this.logger.log(`[reverseGeocode] LGA polygon match! extracted lgaName: "${lgaName_}", properties: ${JSON.stringify(feature.properties)}`);

        if (lgaName_ && stateCode) {
          lgaName = lgaName_;
          
          let searchLgaName = lgaName as string;

          const lga = await this.prisma.nigerianLga.findFirst({
            where: {
              stateCode,
              OR: [
                { name: { equals: searchLgaName, mode: "insensitive" } },
                { name: { startsWith: searchLgaName, mode: "insensitive" } }
              ]
            },
          });
          this.logger.log(`[reverseGeocode] DB LGA lookup result: ${JSON.stringify(lga)}`);
          lgaCode = lga?.code ?? null;
        }
        break;
      }
    }
    if (!lgaMatchFound) {
      this.logger.warn(`[reverseGeocode] NO LGA polygon matched for lat=${lat}, lng=${lng}`);
    }

    // Ward-level: attempt DB lookup via LGA → wards if LGA is found
    // (Full point-in-polygon for wards would require admin3 GeoJSON which is incomplete)
    let wardCode: string | null = null;
    let wardName: string | null = null;

    const result = { stateCode, stateName, lgaCode, lgaName, wardCode, wardName };
    this.logger.log(`[reverseGeocode] final result: ${JSON.stringify(result)}`);
    return result;
  }

  async detectStateFromIp(ip: string): Promise<{ stateCode: string | null; stateName: string | null }> {
    // IP geolocation would use MaxMind or similar service
    // For now, return null to trigger manual selection fallback
    return { stateCode: null, stateName: null };
  }

  async getStateDetails(slug: string, year?: number, month?: number) {
    let searchName = slug.replace(/-state$/i, '').replace(/-/g, ' ');
    if (searchName.toLowerCase() === "federal capital territory") {
      searchName = "FCT";
    }
    
    const state = await this.prisma.nigerianState.findFirst({
      where: {
        name: { startsWith: searchName, mode: "insensitive" }
      },
      include: {
        lgas: {
          select: {
            code: true,
            name: true,
            fiscalEntity: {
              include: {
                faacLgaAllocations: {
                  where: year || month ? {
                    disbursement: {
                      ...(year ? { disbursementYear: year } : {}),
                      ...(month ? { disbursementMonth: month } : {})
                    }
                  } : undefined,
                  orderBy: { createdAt: "desc" },
                  take: year && month ? 1 : 12,
                  include: { disbursement: true }
                }
              }
            }
          }
        },
        officialPositions: {
          where: { role: { equals: "governor", mode: "insensitive" }, status: "active" },
          include: {
            official: true
          }
        },
        fiscalEntity: {
          include: {
            budgetMetadata: {
              orderBy: { fiscalYear: "desc" },
              take: 1
            },
            populationEstimates: {
              where: year ? { year } : undefined,
              orderBy: { year: "desc" },
              take: 1
            },
            gdpRecords: {
              where: year ? { year } : undefined,
              orderBy: { year: "desc" },
              take: 1
            },
            debtRecords: {
              orderBy: { quarter: "desc" },
              take: 4 // Might need both domestic and external
            },
            igrRecords: {
              where: year ? { fiscalYear: year } : undefined,
              orderBy: { fiscalYear: "desc" },
              take: 1
            },
            faacStateAllocations: {
              where: year || month ? {
                disbursement: {
                  ...(year ? { disbursementYear: year } : {}),
                  ...(month ? { disbursementMonth: month } : {})
                }
              } : undefined,
              orderBy: { createdAt: "desc" },
              take: year && month ? 1 : 12,
              include: { disbursement: true }
            }
          }
        }
      }
    });

    if (!state) return null;

    // Formatting the response to match the frontend expectations
    const governorPosition = state.officialPositions[0];
    const governor = governorPosition ? {
      id: governorPosition.official.id,
      name: governorPosition.official.name,
      party: governorPosition.partyAcronym || "N/A",
      term: governorPosition.endDate ? `${governorPosition.startDate.getFullYear()} - ${governorPosition.endDate.getFullYear()}` : `${governorPosition.startDate.getFullYear()} - Present`,
      image: governorPosition.official.imageUrl,
      email: governorPosition.official.email,
    } : null;

    const fiscal = state.fiscalEntity;
    const latestBudget = fiscal?.budgetMetadata[0];
    const population = fiscal?.populationEstimates[0];
    const gdp = fiscal?.gdpRecords[0];
    const domesticDebt = fiscal?.debtRecords.find(d => d.debtType === "domestic");
    const externalDebt = fiscal?.debtRecords.find(d => d.debtType === "external");
    const igr = fiscal?.igrRecords[0];
    
    // Calculate YTD FAAC
    const faacYtd = fiscal?.faacStateAllocations.reduce((sum, record) => {
      return sum + (Number(record.totalNet) || 0);
    }, 0) || 0;

    let budgetTotal = "N/A";
    if (latestBudget) {
      const budgetSum = await this.prisma.budgetLineItem.aggregate({
        where: {
          entityCode: state.code,
          fiscalYear: latestBudget.fiscalYear
        },
        _sum: {
          approvedBudget: true
        }
      });
      const sumValue = budgetSum._sum.approvedBudget;
      if (sumValue) {
        budgetTotal = `₦${(Number(sumValue) / 1_000_000_000_000).toFixed(2)}T`;
      }
    }

    // Get counts and lists for National and State Assembly
    const senatorPositions = await this.prisma.officialPosition.findMany({
      where: {
        role: { equals: "senator", mode: "insensitive" },
        status: "active",
        constituency: {
          stateCode: state.code
        }
      },
      include: { official: true, constituency: true }
    });

    const houseMemberPositions = await this.prisma.officialPosition.findMany({
      where: {
        role: { equals: "rep", mode: "insensitive" },
        status: "active",
        constituency: {
          stateCode: state.code
        }
      },
      include: { official: true, constituency: true }
    });

    const stateAssemblyPositions = await this.prisma.officialPosition.findMany({
      where: {
        role: { equals: "mha", mode: "insensitive" },
        status: "active",
        constituency: {
          stateCode: state.code
        }
      },
      include: { official: true, constituency: true }
    });

    const mapOfficial = (pos: any) => ({
      id: pos.official.id,
      name: pos.official.name,
      party: pos.partyAcronym || "N/A",
      constituency: pos.constituency?.name || "Unknown Constituency",
      image: pos.official.imageUrl,
      email: pos.official.email,
    });

    const senators = senatorPositions.map(mapOfficial);
    const houseMembers = houseMemberPositions.map(mapOfficial);
    const stateAssemblyMembers = stateAssemblyPositions.map(mapOfficial);

    let faacDate = "";
    if (faacYtd > 0) {
      const latestFaac = fiscal?.faacStateAllocations?.[0];
      if (latestFaac?.disbursement) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        faacDate = `${monthNames[latestFaac.disbursement.disbursementMonth - 1]} '${latestFaac.disbursement.disbursementYear.toString().slice(-2)}`;
      }
    }

    return {
      code: state.code,
      name: state.name,
      governor,
      officials: {
        senators,
        houseMembers,
        stateAssembly: stateAssemblyMembers,
      },
      stats: {
        budget: budgetTotal,
        faac: faacYtd ? `₦${(faacYtd / 1_000_000_000).toFixed(1)}B` : "N/A",
        faacDate: faacDate || undefined,
        igr: igr ? `₦${(Number(igr.total) / 1_000_000_000).toFixed(1)}B` : "N/A",
        senators: senators.length,
        houseMembers: houseMembers.length,
        stateAssembly: stateAssemblyMembers.length,
      },
      economy: {
        population: population ? `${(Number(population.population) / 1_000_000).toFixed(1)}M` : "N/A",
        gdp: gdp ? `$${(Number(gdp.amount) / 1_000_000_000).toFixed(1)}B` : "N/A",
        domesticDebt: domesticDebt ? `₦${(Number(domesticDebt.amount) / 1_000_000_000).toFixed(1)}B` : "N/A",
        externalDebt: externalDebt ? `$${(Number(externalDebt.amount) / 1_000_000_000).toFixed(2)}B` : "N/A",
      },
      lgas: state.lgas.map(lga => {
        const lgaFaac = lga.fiscalEntity?.faacLgaAllocations?.reduce((sum, record) => {
          return sum + (Number(record.totalNet) || 0);
        }, 0) || 0;
        
        let faacFormatted = "N/A";
        let faacDate = "";
        if (lgaFaac > 0) {
          if (lgaFaac >= 1_000_000_000) {
            faacFormatted = `₦${(lgaFaac / 1_000_000_000).toFixed(1)}B`;
          } else {
            faacFormatted = `₦${(lgaFaac / 1_000_000).toFixed(1)}M`;
          }
          const latestFaac = lga.fiscalEntity?.faacLgaAllocations?.[0];
          if (latestFaac?.disbursement) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            faacDate = `${monthNames[latestFaac.disbursement.disbursementMonth - 1]} '${latestFaac.disbursement.disbursementYear.toString().slice(-2)}`;
          }
        }

        return {
          code: lga.code,
          name: lga.name,
          faac: faacFormatted,
          faacDate: faacDate || undefined
        };
      }),
      availablePeriods: await this.getAvailableFaacPeriods(),
    };
  }

  async getStatesWithCodes() {
    const states = await this.prisma.nigerianState.findMany({
      orderBy: { name: "asc" },
      include: {
        zone: true,
        officialPositions: {
          where: { role: { equals: "governor", mode: "insensitive" }, status: "active" },
          take: 1
        },
        fiscalEntity: {
          include: {
            faacStateAllocations: {
              orderBy: [
                { disbursement: { disbursementYear: "desc" } },
                { disbursement: { disbursementMonth: "desc" } }
              ],
              take: 1,
              include: {
                disbursement: true
              }
            }
          }
        }
      }
    });

    return states.map(state => {
      const governorPosition = state.officialPositions[0];
      const party = governorPosition?.partyAcronym || "N/A";
      
      const latestFaac = state.fiscalEntity?.faacStateAllocations?.[0];
      const faacAmount = latestFaac ? Number(latestFaac.totalNet) || 0 : 0;
      
      let faacDate = "";
      if (faacAmount) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthStr = latestFaac?.disbursement ? monthNames[latestFaac.disbursement.disbursementMonth - 1] : "";
        const yearStr = latestFaac?.disbursement ? latestFaac.disbursement.disbursementYear.toString().slice(-2) : "";
        faacDate = monthStr && yearStr ? `${monthStr} '${yearStr}` : "";
      }

      return {
        code: state.code,
        name: state.name,
        region: state.zone?.name || "Unknown",
        party: party,
        faac: faacAmount ? `₦${(faacAmount / 1_000_000_000).toFixed(1)}B` : "N/A",
        faacDate: faacDate || undefined
      };
    });
  }

  async getLgaDetails(stateSlug: string, lgaSlug: string, year?: number, month?: number) {
    let stateSearchName = stateSlug.replace(/-state$/i, '').replace(/-/g, ' ');
    if (stateSearchName.toLowerCase() === "federal capital territory") {
      stateSearchName = "FCT";
    }

    const state = await this.prisma.nigerianState.findFirst({
      where: {
        name: { startsWith: stateSearchName, mode: "insensitive" }
      }
    });

    if (!state) return null;

    const lga = await this.prisma.nigerianLga.findFirst({
      where: {
        stateCode: state.code,
        OR: [
          { name: { startsWith: lgaSlug, mode: "insensitive" } },
          { name: { startsWith: lgaSlug.replace(/-/g, ' '), mode: "insensitive" } }
        ]
      },
      include: {
        wards: {
          select: {
            code: true,
            name: true,
          }
        },
        officialPositions: {
          where: { role: { equals: "lga_chairman", mode: "insensitive" }, status: "active" },
          include: {
            official: true
          }
        },
        fiscalEntity: {
          include: {
            faacLgaAllocations: {
              where: year || month ? {
                disbursement: {
                  ...(year ? { disbursementYear: year } : {}),
                  ...(month ? { disbursementMonth: month } : {})
                }
              } : undefined,
              orderBy: { createdAt: "desc" },
              take: year && month ? 1 : 12,
              include: { disbursement: true }
            }
          }
        }
      }
    });

    if (!lga) return null;

    // Fetch councilors for this LGA
    const councilorPositions = await this.prisma.officialPosition.findMany({
      where: {
        ward: {
          lgaCode: lga.code
        },
        role: "councilor",
        status: "active"
      },
      include: {
        official: true,
        ward: true
      }
    });

    const councilors = councilorPositions.map(pos => ({
      id: pos.official.id,
      name: pos.official.name,
      party: pos.partyAcronym || "N/A",
      ward: pos.ward?.name || "Unknown Ward",
      leadershipRole: pos.leadershipRole,
      image: pos.official.imageUrl,
      email: pos.official.email,
    }));

    const chairmanPosition = lga.officialPositions[0];
    const chairman = chairmanPosition ? {
      id: chairmanPosition.official.id,
      name: chairmanPosition.official.name,
      party: chairmanPosition.partyAcronym || "N/A",
      term: chairmanPosition.endDate ? `${chairmanPosition.startDate.getFullYear()} - ${chairmanPosition.endDate.getFullYear()}` : `${chairmanPosition.startDate.getFullYear()} - Present`,
      image: chairmanPosition.official.imageUrl,
      email: chairmanPosition.official.email,
    } : null;

    // Fetch Senator
    const senatorPosition = await this.prisma.officialPosition.findFirst({
      where: {
        role: { equals: "senator", mode: "insensitive" },
        status: "active",
        constituency: {
          lgaMappings: {
            some: {
              lgaCode: lga.code
            }
          }
        }
      },
      include: { official: true, constituency: true }
    });

    const senator = senatorPosition ? {
      id: senatorPosition.official.id,
      name: senatorPosition.official.name,
      party: senatorPosition.partyAcronym || "N/A",
      constituency: senatorPosition.constituency?.name || "Unknown Constituency",
      image: senatorPosition.official.imageUrl,
      email: senatorPosition.official.email,
    } : null;

    // Fetch House of Reps Members
    const houseMemberPositions = await this.prisma.officialPosition.findMany({
      where: {
        role: { equals: "rep", mode: "insensitive" },
        status: "active",
        constituency: {
          wardMappings: {
            some: {
              ward: {
                lgaCode: lga.code
              }
            }
          }
        }
      },
      include: { official: true, constituency: true }
    });

    const houseMembers = houseMemberPositions.map(pos => ({
      id: pos.official.id,
      name: pos.official.name,
      party: pos.partyAcronym || "N/A",
      constituency: pos.constituency?.name || "Unknown Constituency",
      image: pos.official.imageUrl,
      email: pos.official.email,
    }));

    // Fetch State Assembly Members
    const stateAssemblyPositions = await this.prisma.officialPosition.findMany({
      where: {
        role: { equals: "mha", mode: "insensitive" },
        status: "active",
        constituency: {
          wardMappings: {
            some: {
              ward: {
                lgaCode: lga.code
              }
            }
          }
        }
      },
      include: { official: true, constituency: true }
    });

    const stateAssemblyMembers = stateAssemblyPositions.map(pos => ({
      id: pos.official.id,
      name: pos.official.name,
      party: pos.partyAcronym || "N/A",
      constituency: pos.constituency?.name || "Unknown Constituency",
      image: pos.official.imageUrl,
      email: pos.official.email,
    }));

    const fiscal = lga.fiscalEntity;
    const faacYtd = fiscal?.faacLgaAllocations.reduce((sum, record) => {
      return sum + (Number(record.totalNet) || 0);
    }, 0) || 0;

    let faacFormatted = "N/A";
    let faacDate = "";
    if (faacYtd > 0) {
      if (faacYtd >= 1_000_000_000) {
        faacFormatted = `₦${(faacYtd / 1_000_000_000).toFixed(1)}B`;
      } else {
        faacFormatted = `₦${(faacYtd / 1_000_000).toFixed(1)}M`;
      }
      const latestFaac = fiscal?.faacLgaAllocations?.[0];
      if (latestFaac?.disbursement) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        faacDate = `${monthNames[latestFaac.disbursement.disbursementMonth - 1]} '${latestFaac.disbursement.disbursementYear.toString().slice(-2)}`;
      }
    }

    return {
      code: lga.code,
      name: lga.name,
      stateCode: state.code,
      stateName: state.name,
      chairman,
      senator,
      houseMembers,
      stateAssemblyMembers,
      councilors,
      stats: {
        faac: faacFormatted,
        faacDate: faacDate || undefined,
        igr: "N/A", // Not tracked at LGA level currently
        population: "N/A", // Not tracked at LGA level currently
      },
      wards: lga.wards.map(ward => ({
        code: ward.code,
        name: ward.name,
      }))
    };
  }

  async getWardDetails(stateSlug: string, lgaSlug: string, wardSlug: string) {
    let stateSearchName = stateSlug.replace(/-state$/i, '').replace(/-/g, ' ');
    if (stateSearchName.toLowerCase() === "federal capital territory") {
      stateSearchName = "FCT";
    }

    const state = await this.prisma.nigerianState.findFirst({
      where: {
        name: { startsWith: stateSearchName, mode: "insensitive" }
      }
    });

    if (!state) return null;

    const lga = await this.prisma.nigerianLga.findFirst({
      where: {
        stateCode: state.code,
        OR: [
          { name: { startsWith: lgaSlug, mode: "insensitive" } },
          { name: { startsWith: lgaSlug.replace(/-/g, ' '), mode: "insensitive" } }
        ]
      }
    });

    if (!lga) return null;

    const ward = await this.prisma.nigerianWard.findFirst({
      where: {
        lgaCode: lga.code,
        OR: [
          { name: { startsWith: wardSlug, mode: "insensitive" } },
          { name: { startsWith: wardSlug.replace(/-/g, ' '), mode: "insensitive" } },
          { name: { startsWith: wardSlug.replace(/-ward$/i, '').replace(/-/g, ' '), mode: "insensitive" } }
        ]
      },
      include: {
        officialPositions: {
          where: { role: { equals: "councilor", mode: "insensitive" }, status: "active" },
          include: {
            official: true
          }
        }
      }
    });

    if (!ward) return null;

    const councilorPosition = ward.officialPositions[0];
    const councilor = councilorPosition ? {
      id: councilorPosition.official.id,
      name: councilorPosition.official.name,
      party: councilorPosition.partyAcronym || "N/A",
      phone: councilorPosition.official.phoneNumber || "N/A",
      image: councilorPosition.official.imageUrl,
      email: councilorPosition.official.email,
    } : null;

    return {
      code: ward.code,
      name: ward.name,
      stateCode: state.code,
      lgaCode: lga.code,
      lgaName: lga.name,
      stateName: state.name,
      councilor,
      projects: [],
      civicUpdates: [],
    };
  }

  async getLgasByState(stateCode: string) {
    return this.prisma.nigerianLga.findMany({
      where: { stateCode },
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
  }

  async getWardsByLga(lgaCode: string) {
    return this.prisma.nigerianWard.findMany({
      where: { lgaCode },
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
  }

  async getParties() {
    return this.prisma.politicalParty.findMany({
      where: { isActive: true },
      orderBy: { acronym: "asc" },
      select: { acronym: true, name: true },
    });
  }

  async getRegions() {
    return this.prisma.geopoliticalZone.findMany({
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
  }

  async getConstituenciesByState(stateCode: string, type?: string) {
    return this.prisma.nigerianConstituency.findMany({
      where: {
        stateCode,
        ...(type ? { type } : {}),
      },
      orderBy: { name: "asc" },
      select: { code: true, name: true, type: true },
    });
  }

  /**
   * Simple ray-casting point-in-polygon test.
   * Works for Polygon and MultiPolygon geometries.
   */
  private pointInPolygon(lat: number, lng: number, geometry: { type: string; coordinates: any[] }): boolean {
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];

    for (const polygon of rings) {
      const outerRing = polygon[0];
      if (this.raycast(lng, lat, outerRing)) {
        return true;
      }
    }
    return false;
  }

  async getAvailableFaacPeriods(): Promise<{
    years: number[];
    monthsByYear: Record<number, number[]>;
  }> {
    const disbursements = await this.prisma.faacDisbursement.findMany({
      select: {
        disbursementYear: true,
        disbursementMonth: true,
      },
      orderBy: [
        { disbursementYear: "desc" },
        { disbursementMonth: "desc" },
      ],
    });

    const monthsByYear: Record<number, number[]> = {};
    for (const d of disbursements) {
      if (!monthsByYear[d.disbursementYear]) {
        monthsByYear[d.disbursementYear] = [];
      }
      if (!monthsByYear[d.disbursementYear].includes(d.disbursementMonth)) {
        monthsByYear[d.disbursementYear].push(d.disbursementMonth);
      }
    }

    for (const year of Object.keys(monthsByYear)) {
      monthsByYear[Number(year)].sort((a, b) => a - b);
    }

    const years = Object.keys(monthsByYear)
      .map(Number)
      .sort((a, b) => b - a);

    return { years, monthsByYear };
  }

  private raycast(x: number, y: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1];
      const xj = ring[j][0],
        yj = ring[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
}
