import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({ example: 'George Orwell' })
  @IsString()
  @MinLength(2)
  name: string;
}
