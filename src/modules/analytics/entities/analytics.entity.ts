import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { DROP_DOWN } from '../enums/input-fields.enum';

@Schema({ timestamps: true })
export class Analytics {
  @Prop()
  saveAs: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  asking_price: number;

  @Prop({ required: true, min: 0, max: 100 })
  offer_perc: number;

  @Prop({ required: true })
  noi: number;

  @Prop({ required: true, min: 0, max: 100 })
  annual_noi_increase: number;

  @Prop({ required: true, min: 0, max: 100 })
  financing_ltv_perc: number;

  @Prop({ required: true, min: 0, max: 100 })
  loan_annual_intr: number;

  @Prop({ required: true })
  loan_terms_inyear: number;

  @Prop({ required: true, min: 0, max: 36 })
  number_months_intr_only: number;

  @Prop({ required: true })
  first_month_principal_and_intr_payment: number;

  @Prop()
  reserved_amount: number;

  @Prop()
  bank_fee_and_closing_cost: number;

  @Prop({ required: true, min: 0, max: 100 })
  preferred_ann_return_perc: number;

  @Prop({ required: true, min: 0, max: 100 })
  waterfall_share: number;

  @Prop({ required: true, min: 0, max: 100 })
  syndi_origination_fee: number;

  @Prop({ required: true, min: 1, max: 5 })
  syndi_aum_ann_fee: number;

  @Prop({ enum: DROP_DOWN, default: DROP_DOWN.NO })
  dynamic_drop_down_one: string;

  @Prop({ required: true })
  property_manager_fee: number;

  @Prop({ enum: DROP_DOWN, default: DROP_DOWN.NO })
  dynamic_drop_down_two: string;

  @Prop({ required: true, min: 0, max: 100 })
  syndi_sale_price_fee: number;

  @Prop({ required: true, min: 0, max: 100 })
  transaction_and_bank_fee: number;

  @Prop({ required: true, min: 0, max: 100 })
  realtor_fee: number;

  @Prop({ required: true })
  occupancy1: number;

  @Prop({ required: true })
  occupancy2: number;

  @Prop({ required: true })
  occupancy3: number;

  @Prop({ required: true })
  occupancy4: number;

  @Prop({ required: true })
  occupancy5: number;

  @Prop({ required: true })
  occupancy6: number;

  @Prop({ required: true })
  occupancy7: number;

  @Prop({ required: true })
  occupancy8: number;

  @Prop({ required: true })
  occupancy9: number;

  @Prop({ required: true })
  occupancy10: number;

  @Prop({ required: true, min: 0, max: 100 })
  purchase_cap_rate: number;

  @Prop({ required: true, min: 0, max: 100 })
  year_5_cap_rate: number;

  @Prop({ required: true, min: 0, max: 100 })
  year_7_cap_rate: number;

  @Prop({ required: true, min: 0, max: 100 })
  year_10_cap_rate: number;

  @Prop({ required: true })
  refinance_37_rate: number;

  @Prop({ required: true })
  refinance_37_term_years: number;

  @Prop({ required: true })
  refinance_49_rate: number;

  @Prop({ required: true })
  refinance_49_term_years: number;

  @Prop({ required: true })
  refinance_61_rate: number;

  @Prop({ required: true })
  refinance_61_term_years: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
export type IAnalytics = HydratedDocument<Analytics>;
