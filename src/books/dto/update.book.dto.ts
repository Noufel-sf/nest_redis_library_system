import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Animal Farm' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '9780451526342' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ example: 3, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  availableCopies?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  authorId?: number;
}
