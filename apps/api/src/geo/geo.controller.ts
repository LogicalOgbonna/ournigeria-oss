import { Controller, Get, Query, Req, Res, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../auth/decorators/public";
import { GeoService } from "./geo.service";

@Controller("geo")
export class GeoController {
  constructor(private service: GeoService) {}

  @Public()
  @Get("reverse")
  async reverse(
    @Query("lat") lat: string | undefined,
    @Query("lng") lng: string | undefined,
    @Res() res: Response,
  ) {
    try {
      if (!lat || !lng) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "lat and lng are required" });
      }

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "lat and lng must be numbers" });
      }

      // Basic Nigeria bounding box check
      if (latNum < 4 || latNum > 14 || lngNum < 2.5 || lngNum > 15) {
        return res.json({
          stateCode: null,
          stateName: null,
          lgaCode: null,
          lgaName: null,
          wardCode: null,
          wardName: null,
          message: "Coordinates outside Nigeria",
        });
      }

      const result = await this.service.reverseGeocode(latNum, lngNum);
      return res.json(result);
    } catch (err) {
      console.error("geo reverse error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("detect")
  async detect(@Req() req: Request, @Res() res: Response) {
    try {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
      const result = await this.service.detectStateFromIp(ip);
      return res.json(result);
    } catch (err) {
      console.error("geo detect error:", err);
      return res.json({ stateCode: null, stateName: null });
    }
  }

  @Public()
  @Get("faac-periods")
  async faacPeriods(@Res() res: Response) {
    try {
      const periods = await this.service.getAvailableFaacPeriods();
      return res.json(periods);
    } catch (err) {
      console.error("geo faac-periods error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("states/:slug")
  async stateDetails(
    @Req() req: Request, 
    @Res() res: Response,
    @Query("year") year?: string,
    @Query("month") month?: string
  ) {
    try {
      const slug = req.params.slug as string;
      const yearNum = year ? parseInt(year, 10) : undefined;
      const monthNum = month ? parseInt(month, 10) : undefined;
      const stateDetails = await this.service.getStateDetails(slug, yearNum, monthNum);
      if (!stateDetails) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "State not found" });
      }
      return res.json(stateDetails);
    } catch (err) {
      console.error("geo state details error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("states/:stateSlug/lgas/:lgaSlug")
  async lgaDetails(
    @Req() req: Request, 
    @Res() res: Response,
    @Query("year") year?: string,
    @Query("month") month?: string
  ) {
    try {
      const stateSlug = req.params.stateSlug as string;
      const lgaSlug = req.params.lgaSlug as string;
      const yearNum = year ? parseInt(year, 10) : undefined;
      const monthNum = month ? parseInt(month, 10) : undefined;
      const lgaDetails = await this.service.getLgaDetails(stateSlug, lgaSlug, yearNum, monthNum);
      if (!lgaDetails) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "LGA not found" });
      }
      return res.json(lgaDetails);
    } catch (err) {
      console.error("geo lga details error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("states/:stateSlug/lgas/:lgaSlug/wards/:wardSlug")
  async wardDetails(@Req() req: Request, @Res() res: Response) {
    try {
      const stateSlug = req.params.stateSlug as string;
      const lgaSlug = req.params.lgaSlug as string;
      const wardSlug = req.params.wardSlug as string;
      const wardDetails = await this.service.getWardDetails(stateSlug, lgaSlug, wardSlug);
      if (!wardDetails) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Ward not found" });
      }
      return res.json(wardDetails);
    } catch (err) {
      console.error("geo ward details error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("states")
  async states(@Res() res: Response) {
    try {
      const states = await this.service.getStatesWithCodes();
      return res.json(states);
    } catch (err) {
      console.error("geo states error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("lgas")
  async lgas(@Query("state") stateCode: string | undefined, @Res() res: Response) {
    try {
      if (!stateCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "state parameter is required" });
      }
      const lgas = await this.service.getLgasByState(stateCode);
      return res.json(lgas);
    } catch (err) {
      console.error("geo lgas error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("wards")
  async wards(@Query("lga") lgaCode: string | undefined, @Res() res: Response) {
    try {
      if (!lgaCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "lga parameter is required" });
      }
      const wards = await this.service.getWardsByLga(lgaCode);
      return res.json(wards);
    } catch (err) {
      console.error("geo wards error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("parties")
  async parties(@Res() res: Response) {
    try {
      const parties = await this.service.getParties();
      return res.json(parties);
    } catch (err) {
      console.error("geo parties error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("regions")
  async regions(@Res() res: Response) {
    try {
      const regions = await this.service.getRegions();
      return res.json(regions);
    } catch (err) {
      console.error("geo regions error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("constituencies")
  async constituencies(
    @Query("state") stateCode: string | undefined,
    @Query("type") type: string | undefined,
    @Res() res: Response,
  ) {
    try {
      if (!stateCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "state parameter is required" });
      }
      const constituencies = await this.service.getConstituenciesByState(stateCode, type);
      return res.json(constituencies);
    } catch (err) {
      console.error("geo constituencies error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
