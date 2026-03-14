import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'George Orwell' })
  name: string;
}

export class BookSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1984' })
  title: string;

  @ApiProperty({ example: '9780451524935' })
  isbn: string;

  @ApiProperty({ example: 4 })
  availableCopies: number;

  @ApiProperty({ example: 1 })
  authorId: number;
}

export class BorrowRecordSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2026-03-14T12:00:00.000Z', format: 'date-time' })
  borrowDate: Date;

  @ApiPropertyOptional({
    example: '2026-03-21T12:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  returnDate: Date | null;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  bookId: number;
}

export class UserSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;
}

export class AuthorDetailDto extends AuthorSummaryDto {
  @ApiProperty({ type: () => [BookSummaryDto] })
  books: BookSummaryDto[];
}

export class BookDetailDto extends BookSummaryDto {
  @ApiProperty({ type: () => AuthorSummaryDto })
  author: AuthorSummaryDto;
}

export class PopularBookDto extends BookSummaryDto {
  @ApiProperty({ example: 18 })
  views: number;
}

export class UserDetailDto extends UserSummaryDto {
  @ApiProperty({ type: () => [BorrowRecordSummaryDto] })
  borrowed: BorrowRecordSummaryDto[];
}

export class BorrowRecordDetailDto extends BorrowRecordSummaryDto {
  @ApiProperty({ type: () => UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({ type: () => BookSummaryDto })
  book: BookSummaryDto;
}
