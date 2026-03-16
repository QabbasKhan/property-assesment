import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { STATUS } from '../enums/user.enum';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(STATUS)
  status?: STATUS;
}
