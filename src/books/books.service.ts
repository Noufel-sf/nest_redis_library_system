import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create.book.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(data: CreateBookDto) {
    const book = await this.prisma.book.create({ data });

    await this.redis.del('books:all');

    return book;
  }

  async findAll() {
    const cacheKey = 'books:all';

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const books = await this.prisma.book.findMany({
      include: { author: true },
    });

    await this.redis.set(cacheKey, JSON.stringify(books), 60);

    return books;
  }

  async findPopular() {
    const books = await this.prisma.book.findMany();

    const booksWithViews = await Promise.all(
      books.map(async (book) => {
        const views = await this.redis.get(`book:${book.id}:views`);

        return {
          ...book,
          views: Number(views || 0),
        };
      }),
    );

    return booksWithViews.sort((a, b) => b.views - a.views);
  }

  async findOne(id: number) {
    const cacheKey = `books:${id}`;

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });

    await this.redis.set(cacheKey, JSON.stringify(book), 60);

    await this.redis.incr(`book:${id}:views`);

    return book;
  }

  async delete(id: number) {
    await this.redis.del(`books:${id}`);
    return this.prisma.book.delete({
      where: { id },
    });
  }

  async update(id: number, data: Partial<CreateBookDto>) {
    await this.redis.del(`books:${id}`);
    return this.prisma.book.update({
      where: { id },
      data,
    });
  }
}
