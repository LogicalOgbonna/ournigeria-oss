import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { AdminDonationController } from './admin-donation.controller';
import { DonationService } from './donation.service';

@Module({
  controllers: [DonationController, AdminDonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
