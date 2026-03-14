import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  isbn: string;

  @IsInt()
  @Min(0)
  availableCopies: number;

  @IsInt()
  authorId: number;
}
