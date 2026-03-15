import { Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

//this select the password never returns in the response .

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashedPassword = await hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: publicUserSelect,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        ...publicUserSelect,
        borrowed: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...publicUserSelect,
        borrowed: true,
      },
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: publicUserSelect,
    });
  }

  async update(id: number, data: UpdateUserDto) {
    const updateData = data.password
      ? { ...data, password: await hash(data.password, 10) }
      : data;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: publicUserSelect,
    });
  }
}
