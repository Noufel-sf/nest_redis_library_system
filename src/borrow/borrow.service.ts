import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BorrowService {

  constructor(private prisma: PrismaService) {}

  async borrowBook(userId: number, bookId: number) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book || book.availableCopies <= 0) {
      throw new BadRequestException('Book not available')
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        availableCopies: { decrement: 1 }
      },
    })

    return this.prisma.borrowRecord.create({
      data: {
        userId,
        bookId
      }
    })
  }

  async returnBook(recordId: number) {

    const record = await this.prisma.borrowRecord.findUnique({
      where: { id: recordId }
    })

    if (!record) {
      throw new BadRequestException('Record not found')
    }

    await this.prisma.book.update({
      where: { id: record.bookId },
      data: {
        availableCopies: { increment: 1 }
      }
    })

    return this.prisma.borrowRecord.update({
      where: { id: recordId },
      data: {
        returnDate: new Date()
      }
    })
  }

  findAll() {
    return this.prisma.borrowRecord.findMany({
      include: {
        user: true,
        book: true
      }
    })
  }
}