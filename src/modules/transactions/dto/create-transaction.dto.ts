import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'TXN-1234567890',
    description: 'Unique transaction ID',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 100.5, description: 'Amount of the transaction' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'subscription-create',
    description: 'Type of the transaction',
  })
  @IsString()
  type: string;

  @ApiProperty({ example: 'pending', description: 'Status of the transaction' })
  status: string;

  @ApiProperty({
    example: 'user-123',
    description: 'ID of the user associated with the transaction',
  })
  @IsMongoId()
  user: string;

  @ApiProperty({
    example: 'package-123',
    description: 'ID of the package associated with the transaction',
  })
  @IsMongoId()
  package: string;
}
