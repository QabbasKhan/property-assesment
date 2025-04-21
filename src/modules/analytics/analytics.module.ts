import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MortgagesController } from './mortgages/mortgages.controller';
import { ValuationsController } from './valuations/valuations.controller';
import { ValuationsService } from './valuations/valuations.service';
import { MortgagesService } from './mortgages/mortgages.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Mortgage, MortgageSchema } from './mortgages/entities/mortgage.entity';
import { Analytics, AnalyticsSchema } from './entities/analytics.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mortgage.name, schema: MortgageSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
    ]),
  ],
  controllers: [AnalyticsController, ValuationsController, MortgagesController],
  providers: [AnalyticsService, ValuationsService, MortgagesService],
})
export class AnalyticsModule {}
