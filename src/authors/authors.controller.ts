import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create.author.dto';
import {
  AuthorDetailDto,
  AuthorSummaryDto,
} from '../common/swagger/library-docs.dto';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private authorsService: AuthorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new author' })
  @ApiCreatedResponse({ type: AuthorSummaryDto })
  create(@Body() body: CreateAuthorDto) {
    return this.authorsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all authors with their books' })
  @ApiOkResponse({ type: AuthorDetailDto, isArray: true })
  findAll() {
    return this.authorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one author by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: AuthorDetailDto })
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an author by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: AuthorSummaryDto })
  delete(@Param('id') id: string) {
    return this.authorsService.delete(Number(id));
  }
}
