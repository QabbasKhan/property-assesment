import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DROP_DOWN } from '../enums/input-fields.enum';

export class CreateAnalyticsDto {
  @IsString()
  @IsOptional()
  saveAs: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @Type(() => Number)
  @IsNumber()
  asking_price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  offer_perc: number;

  @Type(() => Number)
  @IsNumber()
  noi: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  annual_noi_increase: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  financing_ltv_perc: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  loan_annual_intr: number;

  @Type(() => Number)
  @IsNumber()
  loan_terms_inyear: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(36)
  number_months_intr_only: number;

  @Type(() => Number)
  @IsNumber()
  first_month_principal_and_intr_payment: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  reserved_amount: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  bank_fee_and_closing_cost: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  preferred_ann_return_perc: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  waterfall_share: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  syndi_origination_fee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  syndi_aum_ann_fee: number;

  @IsEnum(DROP_DOWN)
  @IsOptional()
  dynamic_drop_down_one?: string = DROP_DOWN.NO;

  @Type(() => Number)
  @IsNumber()
  property_manager_fee: number;

  @IsEnum(DROP_DOWN)
  @IsOptional()
  dynamic_drop_down_two?: string = DROP_DOWN.NO;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  syndi_sale_price_fee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  transaction_and_bank_fee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  realtor_fee: number;

  @IsNumber()
  occupancy1: number;
  @IsNumber()
  occupancy2: number;
  @IsNumber()
  occupancy3: number;
  @IsNumber()
  occupancy4: number;
  @IsNumber()
  occupancy5: number;
  @IsNumber()
  occupancy6: number;
  @IsNumber()
  occupancy7: number;
  @IsNumber()
  occupancy8: number;
  @IsNumber()
  occupancy9: number;
  @IsNumber()
  occupancy10: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  year_5_cap_rate: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  year_7_cap_rate: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  year_10_cap_rate: number;

  // Flattened refinance_37 fields
  @Type(() => Number)
  @IsNumber()
  refinance_37_rate: number;

  @Type(() => Number)
  @IsNumber()
  refinance_37_term_years: number;

  // Flattened refinance_49 fields
  @Type(() => Number)
  @IsNumber()
  refinance_49_rate: number;

  @Type(() => Number)
  @IsNumber()
  refinance_49_term_years: number;

  // Flattened refinance_61 fields
  @Type(() => Number)
  @IsNumber()
  refinance_61_rate: number;

  @Type(() => Number)
  @IsNumber()
  refinance_61_term_years: number;
}
