import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import * as fs from "fs";
import * as path from "path";

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
  private readonly logger = new Logger(GeoService.name);
  private stateFeatures: GeoFeature[] = [];
  private lgaFeatures: GeoFeature[] = [];

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.loadGeoData();
  }

  private loadGeoData() {
    try {
      const basePath = path.resolve(process.cwd(), "../../packages/source/nga_admin_boundaries.geojson");
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
          const state = await this.prisma.nigerianState.findFirst({
            where: { name: { equals: stateName, mode: "insensitive" } },
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
    if (stateCode) {
      let lgaMatchFound = false;
      for (const feature of this.lgaFeatures) {
        if (this.pointInPolygon(lat, lng, feature.geometry)) {
          lgaMatchFound = true;
          const lgaName_ = feature.properties.adm2_name || feature.properties.admin2Name_en || feature.properties.admin2Name || null;
          this.logger.log(`[reverseGeocode] LGA polygon match! extracted lgaName: "${lgaName_}", properties: ${JSON.stringify(feature.properties)}`);
          if (lgaName_) {
            lgaName = lgaName_;
            const lga = await this.prisma.nigerianLga.findFirst({
              where: {
                stateCode,
                name: { equals: lgaName, mode: "insensitive" },
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

  async getStatesWithCodes() {
    return this.prisma.nigerianState.findMany({
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
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
