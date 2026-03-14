import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnBookDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  recordId: number;
}
