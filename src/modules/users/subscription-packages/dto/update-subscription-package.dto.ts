import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { PACKAGE_STATUS, PACKAGE_TYPE } from '../../enums/package.enum';

export class UpdateSubscriptionPackageDto {
  @ApiProperty({ description: 'Package Mongo Id (_id)' })
  @IsMongoId()
  id: Types.ObjectId | string;

  @ApiProperty({
    example: 'Basic Plan',
    description: 'The name of the subscription package',
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    example: 'This is a basic plan',
    description: 'The description of the subscription package',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ enum: PACKAGE_TYPE })
  @IsOptional()
  type: PACKAGE_TYPE;

  @ApiProperty({
    example: 9.99,
    description: 'The price of the subscription package',
  })
  @IsOptional()
  @IsNumber()
  price?: number;

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
  @IsOptional()
  @IsNumber()
  totalAnalyses?: number;

  @ApiProperty({ enum: PACKAGE_STATUS })
  @IsOptional()
  status: PACKAGE_STATUS;
}
