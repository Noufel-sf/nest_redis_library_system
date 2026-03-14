import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: '1984' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: '9780451524935' })
  @IsString()
  isbn: string;

  @ApiProperty({ example: 4, minimum: 0 })
  @IsInt()
  @Min(0)
  availableCopies: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  authorId: number;
}
