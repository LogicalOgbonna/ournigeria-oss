import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ournigeria/database';
import { DonationProvider, DonationStatus } from '@prisma/client';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { InitializeDonationDto } from './dto/initialize-donation.dto';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private generateReference(provider: string): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `ON-${provider.slice(0, 2)}-${timestamp}-${random}`.toUpperCase();
  }

  async initialize(dto: InitializeDonationDto) {
    const reference = this.generateReference(dto.provider);
    const currency = dto.currency || 'NGN';

    if (dto.provider === 'PAYSTACK') {
      return this.initializePaystack(dto, reference, currency);
    } else if (dto.provider === 'FLUTTERWAVE') {
      return this.initializeFlutterwave(dto, reference, currency);
    }

    throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
  }

  private async initializePaystack(
    dto: InitializeDonationDto,
    reference: string,
    currency: string,
  ) {
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    const payload: Record<string, unknown> = {
      email: dto.email,
      amount: dto.amount,
      reference,
      currency,
      callback_url: dto.callbackUrl,
      metadata: {
        donor_name: dto.donorName || undefined,
        user_id: dto.userId || undefined,
        is_recurring: dto.isRecurring || false,
      },
    };

    if (dto.isRecurring) {
      payload.channels = ['card'];
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Paystack initialize failed: ${error}`);
      throw new BadRequestException('Could not initialize payment. Please try again.');
    }

    const data = await response.json();

    await this.prisma.donation.create({
      data: {
        reference,
        amount: dto.amount,
        currency,
        email: dto.email,
        donorName: dto.donorName,
        provider: DonationProvider.PAYSTACK,
        status: DonationStatus.PENDING,
        isRecurring: dto.isRecurring || false,
        userId: dto.userId || null,
        metadata: payload.metadata as object,
      },
    });

    return {
      authorization_url: data.data.authorization_url,
      reference,
      access_code: data.data.access_code,
    };
  }

  private async initializeFlutterwave(
    dto: InitializeDonationDto,
    reference: string,
    currency: string,
  ) {
    const secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) {
      throw new BadRequestException('Flutterwave is not configured');
    }

    const payload: Record<string, unknown> = {
      tx_ref: reference,
      amount: dto.amount / 100, // Flutterwave uses major units, not kobo
      currency,
      redirect_url: dto.callbackUrl,
      customer: {
        email: dto.email,
        name: dto.donorName || undefined,
      },
      customizations: {
        title: 'OurNigeria Donation',
        description: 'Support OurNigeria - Track Every Naira',
      },
      meta: {
        user_id: dto.userId || undefined,
        is_recurring: dto.isRecurring || false,
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Flutterwave initialize failed: ${error}`);
      throw new BadRequestException('Could not initialize payment. Please try again.');
    }

    const data = await response.json();

    await this.prisma.donation.create({
      data: {
        reference,
        amount: dto.amount,
        currency,
        email: dto.email,
        donorName: dto.donorName,
        provider: DonationProvider.FLUTTERWAVE,
        status: DonationStatus.PENDING,
        isRecurring: dto.isRecurring || false,
        userId: dto.userId || null,
        metadata: payload.meta as object,
      },
    });

    return {
      authorization_url: data.data.link,
      reference,
    };
  }

  async handlePaystackWebhook(signature: string, body: Buffer) {
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('Paystack webhook received but PAYSTACK_SECRET_KEY not configured');
      return;
    }

    const hash = createHmac('sha512', secretKey)
      .update(body)
      .digest('hex');

    const hashBuf = Buffer.from(hash, "hex");
    const sigBuf  = Buffer.from(signature, "hex");
    if (hashBuf.length !== sigBuf.length || !timingSafeEqual(hashBuf, sigBuf)) {
      this.logger.warn('Invalid Paystack webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(body.toString());
    const eventType = event.event as string;
    const data = event.data;

    if (eventType === 'charge.success') {
      await this.updateDonationStatus(
        data.reference,
        DonationStatus.COMPLETED,
        data.id?.toString(),
        data.authorization?.authorization_code,
      );
    } else if (eventType === 'charge.failed') {
      await this.updateDonationStatus(
        data.reference,
        DonationStatus.FAILED,
        data.id?.toString(),
      );
    }
  }

  async handleFlutterwaveWebhook(verifHash: string, body: Record<string, unknown>) {
    const secretHash = this.config.get<string>('FLUTTERWAVE_SECRET_HASH');
    if (!secretHash) {
      this.logger.error('Flutterwave webhook received but FLUTTERWAVE_SECRET_HASH not configured');
      return;
    }

    const a = Buffer.from(verifHash, "utf8");
    const b = Buffer.from(secretHash, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Invalid Flutterwave webhook hash');
      throw new BadRequestException('Invalid hash');
    }

    const data = body.data as Record<string, unknown>;
    if (!data) return;

    const txRef = data.tx_ref as string;
    const status = data.status as string;

    // Verify transaction with Flutterwave API
    const secretKey = this.config.get<string>('FLUTTERWAVE_SECRET_KEY');
    const transactionId = data.id;

    if (secretKey && transactionId) {
      const verifyResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        },
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const verifiedStatus = verifyData.data?.status;

        if (verifiedStatus === 'successful') {
          await this.updateDonationStatus(
            txRef,
            DonationStatus.COMPLETED,
            transactionId.toString(),
          );
        } else {
          await this.updateDonationStatus(
            txRef,
            DonationStatus.FAILED,
            transactionId.toString(),
          );
        }
        return;
      }
    }

    // Fallback: use webhook status directly
    if (status === 'successful') {
      await this.updateDonationStatus(txRef, DonationStatus.COMPLETED, data.id?.toString());
    } else {
      await this.updateDonationStatus(txRef, DonationStatus.FAILED, data.id?.toString());
    }
  }

  private async updateDonationStatus(
    reference: string,
    status: DonationStatus,
    providerRef?: string,
    subscriptionCode?: string,
  ) {
    const existing = await this.prisma.donation.findUnique({
      where: { reference },
    });

    if (!existing) {
      this.logger.warn(`Donation not found for reference: ${reference}`);
      return;
    }

    // Idempotency: don't update if already completed
    if (existing.status === DonationStatus.COMPLETED) {
      this.logger.log(`Donation ${reference} already completed, skipping`);
      return;
    }

    await this.prisma.donation.update({
      where: { reference },
      data: {
        status,
        providerRef: providerRef || existing.providerRef,
        subscriptionCode: subscriptionCode || existing.subscriptionCode,
      },
    });

    this.logger.log(`Donation ${reference} updated to ${status}`);
  }

  async verifyDonation(reference: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { reference },
    });

    if (!donation) {
      return null;
    }

    return {
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      provider: donation.provider,
      isRecurring: donation.isRecurring,
      createdAt: donation.createdAt,
    };
  }

  async getDonationHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({ where: { userId } }),
    ]);

    return { donations, total, page, limit };
  }

  async getAdminDonations(query: {
    page?: number;
    limit?: number;
    status?: DonationStatus;
    provider?: DonationProvider;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true, phoneNumber: true } } },
      }),
      this.prisma.donation.count({ where }),
    ]);

    return { donations, total, page, limit };
  }

  async getAdminStats() {
    const [totalDonations, completedDonations, byProvider, byStatus] = await Promise.all([
      this.prisma.donation.count(),
      this.prisma.donation.findMany({
        where: { status: DonationStatus.COMPLETED },
        select: { amount: true, currency: true },
      }),
      this.prisma.donation.groupBy({
        by: ['provider'],
        _count: true,
        _sum: { amount: true },
        where: { status: DonationStatus.COMPLETED },
      }),
      this.prisma.donation.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const totalRaised = completedDonations.reduce((sum, d) => sum + d.amount, 0);

    const recentDonations = await this.prisma.donation.findMany({
      where: { status: DonationStatus.COMPLETED },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        reference: true,
        amount: true,
        currency: true,
        donorName: true,
        provider: true,
        createdAt: true,
      },
    });

    return {
      totalDonations,
      totalRaised,
      byProvider,
      byStatus,
      recentDonations,
    };
  }
}
