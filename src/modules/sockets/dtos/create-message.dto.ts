import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ACTIVITY_TYPE } from 'src/modules/users/enums/activity.enum';
import { CHAT_TYPE } from '../enums/chat.enum';

export class PayloadDto {
  @ApiProperty({
    description: 'Provide the Activity Type',
    enum: ACTIVITY_TYPE,
  })
  @IsEnum(ACTIVITY_TYPE)
  activity: ACTIVITY_TYPE;

  @ApiProperty()
  @IsObject()
  data: Record<string, any>;
}

export class StartChatDto {
  @ApiProperty({ description: 'Array of users mongo Ids' })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  userIds: string[];

  @ApiProperty({ description: 'Provide the child Id' })
  @IsNotEmpty()
  @IsString()
  child: string;

  @ApiProperty({ description: 'Provide the Booking Id' })
  @IsNotEmpty()
  @IsString()
  booking: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  media?: string[];

  @ApiPropertyOptional({
    description: 'Provide The Chat Type',
    enum: CHAT_TYPE,
  })
  @IsOptional()
  @IsEnum(CHAT_TYPE)
  type?: CHAT_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: PayloadDto;
}
