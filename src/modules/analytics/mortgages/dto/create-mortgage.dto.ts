import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { DROP_DOWN } from '../../enums/input-fields.enum';

export class CreateMortgageDto {
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
  noi: number; //D9

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  annual_noi_increase: number; //D10;

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
  number_months_intr_only: number; //D16

  @Type(() => Number)
  @IsNumber()
  first_month_principal_and_intr_payment: number; //D17

  //-----------optional

  @IsOptional()
  @IsNumber()
  bank_fee_and_closing_cost: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  reserved_amount: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  preferred_ann_return_perc: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  waterfall_share: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  syndi_origination_fee: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  syndi_aum_ann_fee: number;

  @IsEnum(DROP_DOWN)
  @IsOptional()
  dynamic_drop_down_one?: string = DROP_DOWN.NO;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  property_manager_fee: number;

  @IsEnum(DROP_DOWN)
  @IsOptional()
  dynamic_drop_down_two?: string = DROP_DOWN.NO;

  //-----------------------end-----------------

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
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  realtor_fee: number;

  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(100, { each: true })
  occupancy: number[];

  // @IsNumber()
  // occupancy_year1: number;
  // @IsNumber()
  // occupancy_year2: number;
  // @IsNumber()
  // occupancy_year3: number;
  // @IsNumber()
  // occupancy_year4: number;
  // @IsNumber()
  // occupancy_year5: number;
  // @IsNumber()
  // occupancy_year6: number;
  // @IsNumber()
  // occupancy_year7: number;
  // @IsNumber()
  // occupancy_year8: number;
  // @IsNumber()
  // occupancy_year9: number;
  // @IsNumber()
  // occupancy_year10: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  purchase_cap_rate: number;

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

  //   // Flattened refinance_37 fields
  @Type(() => Number)
  @IsNumber()
  refinance_37_rate: number;

  @Type(() => Number)
  @IsNumber()
  refinance_37_term_years: number;

  //   // Flattened refinance_49 fields
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
