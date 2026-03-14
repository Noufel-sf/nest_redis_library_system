import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create.book.dto';
import { UpdateBookDto } from './dto/update.book.dto';
import {
  BookDetailDto,
  BookSummaryDto,
  PopularBookDto,
} from '../common/swagger/library-docs.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List all books with author data' })
  @ApiOkResponse({ type: BookDetailDto, isArray: true })
  findAll() {
    return this.booksService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiCreatedResponse({ type: BookSummaryDto })
  create(@Body() body: CreateBookDto) {
    return this.booksService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing book' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: BookSummaryDto })
  update(@Param('id') id: string, @Body() body: UpdateBookDto) {
    return this.booksService.update(Number(id), body);
  }

  @Get('popular')
  @ApiOperation({ summary: 'List books ordered by tracked view count' })
  @ApiOkResponse({ type: PopularBookDto, isArray: true })
  findPopular() {
    return this.booksService.findPopular();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one book by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: BookDetailDto })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: BookSummaryDto })
  delete(@Param('id') id: string) {
    return this.booksService.delete(Number(id));
  }
}
