import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorDto } from './dto/create.author.dto';

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateAuthorDto) {
    return this.prisma.author.create({ data });
  }

  findAll() {
    return this.prisma.author.findMany({
      include: { books: true },
    });
  }

  findOne(id: number) {
    return this.prisma.author.findUnique({
      where: { id },
      include: { books: true },
    });
  }

  delete(id: number) {
    return this.prisma.author.delete({
      where: { id },
    });
  }
}
