import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty({ description: 'User Email', required: true })
  @IsNotEmpty({ message: 'Email is Required' })
  @IsEmail()
  email: string;
}
