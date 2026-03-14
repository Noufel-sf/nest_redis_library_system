import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './dto/borrow.book.dto';
import { ReturnBookDto } from './dto/return.book.dto';

@ApiTags('Borrow')
@Controller('borrow')
export class BorrowController {
  constructor(private borrowService: BorrowService) {}

  @Post()
  @ApiOperation({ summary: 'Borrow a book for a user' })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        borrowDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-03-14T12:00:00.000Z',
        },
        returnDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: null,
        },
        userId: { type: 'number', example: 1 },
        bookId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Book not available.' })
  borrow(@Body() body: BorrowBookDto) {
    return this.borrowService.borrowBook(body.userId, body.bookId);
  }

  @Post('return')
  @ApiOperation({ summary: 'Return a borrowed book' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        borrowDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-03-14T12:00:00.000Z',
        },
        returnDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2026-03-21T12:00:00.000Z',
        },
        userId: { type: 'number', example: 1 },
        bookId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Borrow record not found.' })
  returnBook(@Body() body: ReturnBookDto) {
    return this.borrowService.returnBook(body.recordId);
  }

  @Get()
  @ApiOperation({ summary: 'List borrow records with user and book data' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          borrowDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-14T12:00:00.000Z',
          },
          returnDate: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null,
          },
          userId: { type: 'number', example: 1 },
          bookId: { type: 'number', example: 1 },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Jane Doe' },
              email: { type: 'string', example: 'jane@example.com' },
            },
          },
          book: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '1984' },
              isbn: { type: 'string', example: '9780451524935' },
              availableCopies: { type: 'number', example: 4 },
              authorId: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  findAll() {
    return this.borrowService.findAll();
  }
}
