import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public';
import { AdminGuard } from '../admin/admin.guard';
import { DonationService } from './donation.service';
import { DonationProvider, DonationStatus } from '@prisma/client';

@Public()
@UseGuards(AdminGuard)
@ApiTags('Admin - Donations')
@Controller('admin/donations')
export class AdminDonationController {
  constructor(private readonly donationService: DonationService) {}

  @Get()
  @ApiOperation({ summary: 'List all donations (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DonationStatus })
  @ApiQuery({ name: 'provider', required: false, enum: DonationProvider })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: DonationStatus,
    @Query('provider') provider?: DonationProvider,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.donationService.getAdminDonations({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      provider,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get donation statistics' })
  async stats() {
    return this.donationService.getAdminStats();
  }
}
