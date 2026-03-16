import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PACKAGE_INTERVAL, PACKAGE_TYPE } from '../../enums/package.enum';

export class CreateSubscriptionPackageDto {
  @ApiProperty({
    example: 'Basic Plan',
    description: 'The name of the subscription package',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    example: 'This is a basic plan',
    description: 'The description of the subscription package',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PACKAGE_TYPE)
  type: PACKAGE_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PACKAGE_INTERVAL)
  interval: PACKAGE_INTERVAL;

  @ApiProperty({
    example: 9.99,
    description: 'The price of the subscription package',
  })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be a positive number' })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: true,
    description: 'Whether the subscription package has a trial',
  })
  @IsBoolean({ message: 'Trial must be a boolean' })
  @IsOptional()
  hasTrial: boolean;

  @ApiProperty({
    example: ['Feature 1', 'Feature 2'],
    description: 'A list of features included in the subscription package',
  })
  @IsOptional()
  @IsString({ each: true, message: 'Each feature must be a string' })
  features?: string[];

  @ApiProperty({
    example: 100,
    description:
      'The total number of analyses allowed for this subscription package',
  })
  @IsNotEmpty()
  @IsNumber()
  totalAnalyses: number;

  @IsEmpty()
  stripePriceId: string;

  @IsEmpty()
  stripeProductId: string;
}
