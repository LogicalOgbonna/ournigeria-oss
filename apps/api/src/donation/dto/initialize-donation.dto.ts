import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DonationProviderDto {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
}

export class InitializeDonationDto {
  @ApiProperty({ description: 'Amount in the smallest currency unit (kobo for NGN, cents for USD)', minimum: 10000 })
  amount!: number;

  @ApiProperty({ description: 'Donor email address' })
  email!: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'NGN' })
  currency?: string;

  @ApiProperty({ description: 'Payment provider', enum: DonationProviderDto })
  provider!: DonationProviderDto;

  @ApiPropertyOptional({ description: 'User ID if authenticated' })
  userId?: string;

  @ApiPropertyOptional({ description: 'Donor display name' })
  donorName?: string;

  @ApiPropertyOptional({ description: 'Whether this is a recurring donation', default: false })
  isRecurring?: boolean;

  @ApiProperty({ description: 'URL to redirect to after payment' })
  callbackUrl!: string;
}
