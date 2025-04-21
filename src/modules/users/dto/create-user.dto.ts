import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { STATUS } from '../enums/user.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNo: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  photo: string = 'default.png';

  @IsEmpty()
  slug: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsEnum(STATUS)
  status: STATUS;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  packageHours: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  balance: number;
}
