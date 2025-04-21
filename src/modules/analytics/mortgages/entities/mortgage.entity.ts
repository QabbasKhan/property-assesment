import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class NoiProjection extends Document {
  @Prop({ required: true })
  targetNoi: number;

  @Prop({ required: true })
  realizedNoi: number;
}

export const NoiProjectionSchema = SchemaFactory.createForClass(NoiProjection);

// @Schema({ _id: false })
// export class CapRate extends Document {
//   @Prop({ required: true })
//   month: string;

//   @Prop({ required: true })
//   capRate: number;
// }

// export const CapRateSchema = SchemaFactory.createForClass(CapRate);

@Schema({ _id: false })
export class RefinancePayment extends Document {
  @Prop({ required: true })
  month: string;

  @Prop({ type: [Number], required: true })
  payments: number[];
}

export const RefinancePaymentSchema =
  SchemaFactory.createForClass(RefinancePayment);

@Schema({ _id: false })
export class PrimaryRefinanceData extends Document {
  @Prop({ type: [Number], required: true })
  primary: number[];

  @Prop({ type: [RefinancePayment], required: true })
  refinanced: RefinancePayment[];
}

export const PrimaryRefinanceDataSchema =
  SchemaFactory.createForClass(PrimaryRefinanceData);

@Schema({ _id: false })
export class FinancialData extends Document {
  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  capRate: number;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  mortgage: number;

  @Prop({ required: true, default: 0 })
  feesAndCosts: number;

  @Prop({ required: true, default: 0 })
  capitalLift: number;

  @Prop({ required: true })
  refinancePMT: number;
}

export const FinancialDataSchema = SchemaFactory.createForClass(FinancialData);

@Schema({ timestamps: true })
export class Mortgage extends Document {
  @Prop({ required: true })
  loanAmount: number;

  @Prop({ required: true })
  monthlyRate: number;

  @Prop({ required: true })
  totalPayments: number;

  @Prop({ required: true })
  monthlyPayment: number;

  @Prop({ required: true })
  interestOnlyPayment: number;

  // @Prop({ type: [NoiProjection], required: true })
  // noiProjection: NoiProjection[];

  //   @Prop({ type: [CapRate], required: true })
  //   capRates: CapRate[];

  @Prop({ type: PrimaryRefinanceData, required: true })
  primaryAndRefinanceData: PrimaryRefinanceData;

  @Prop({ type: [FinancialData], required: true })
  refinanceCalculation: FinancialData[];
}

export const MortgageSchema = SchemaFactory.createForClass(Mortgage);
