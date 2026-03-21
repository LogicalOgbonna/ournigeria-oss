import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../auth/decorators/public';
import { DonationService } from './donation.service';
import { InitializeDonationDto } from './dto/initialize-donation.dto';

@ApiTags('Donations')
@Controller('donate')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Public()
  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a donation payment' })
  @ApiResponse({ status: 200, description: 'Returns authorization URL and reference' })
  async initialize(@Body() dto: InitializeDonationDto) {
    // Manual validation
    if (!dto.amount || typeof dto.amount !== 'number' || dto.amount < 10000) {
      throw new BadRequestException('Minimum donation is ₦100 (10000 kobo)');
    }
    if (dto.amount > 1000000000) {
      throw new BadRequestException('Maximum donation is ₦10,000,000');
    }
    if (!dto.email || !dto.email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }
    if (!dto.provider || !['PAYSTACK', 'FLUTTERWAVE'].includes(dto.provider)) {
      throw new BadRequestException('Provider must be PAYSTACK or FLUTTERWAVE');
    }
    if (!dto.callbackUrl) {
      throw new BadRequestException('Callback URL is required');
    }

    return this.donationService.initialize(dto);
  }

  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Missing request body');
    }

    try {
      await this.donationService.handlePaystackWebhook(signature, rawBody);
    } catch (error) {
      if ((error as Error).message === 'Invalid signature') {
        throw new UnauthorizedException('Invalid signature');
      }
      throw error;
    }

    return { status: 'ok' };
  }

  @Public()
  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  async flutterwaveWebhook(
    @Headers('verif-hash') verifHash: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (!verifHash) {
      throw new UnauthorizedException('Missing verification hash');
    }

    try {
      await this.donationService.handleFlutterwaveWebhook(verifHash, body);
    } catch (error) {
      if ((error as Error).message === 'Invalid hash') {
        throw new UnauthorizedException('Invalid hash');
      }
      throw error;
    }

    return { status: 'ok' };
  }

  @Public()
  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify donation status' })
  async verify(@Param('reference') reference: string) {
    const donation = await this.donationService.verifyDonation(reference);
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }
    return donation;
  }

  @Get('history')
  @ApiOperation({ summary: 'Get donation history for authenticated user' })
  async history(@Req() req: Request) {
    const userId = (req as any).userId as string;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.donationService.getDonationHistory(userId);
  }
}
