import { Controller, Post, Body, Get } from '@nestjs/common'
import { BorrowService } from './borrow.service'

@Controller('borrow')
export class BorrowController {

  constructor(private borrowService: BorrowService) {}

  @Post()
  borrow(@Body() body) {
    return this.borrowService.borrowBook(body.userId, body.bookId)
  }

  @Post('return')
  returnBook(@Body() body) {
    return this.borrowService.returnBook(body.recordId)
  }

  @Get()
  findAll() {
    return this.borrowService.findAll()
  }
}