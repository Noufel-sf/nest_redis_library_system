import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
      },
    },
  })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all users with their borrow records' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          borrowed: {
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
              },
            },
          },
        },
      },
    },
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
        borrowed: {
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
            },
          },
        },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
      },
    },
  })
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
      },
    },
  })
  delete(@Param('id') id: string) {
    return this.usersService.delete(Number(id));
  }
}
