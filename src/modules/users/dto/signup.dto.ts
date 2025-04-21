import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLE, STATUS } from '../enums/user.enum';

export class SignupDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'please provide first name' })
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide email.' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide password.' })
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  password: string;

  @IsEmpty()
  slug: string;

  @IsEmpty()
  role: ROLE;

  @IsEmpty()
  status: STATUS;
}
