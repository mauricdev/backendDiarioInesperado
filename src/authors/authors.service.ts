import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  async create(createAuthorDto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: {
        name: createAuthorDto.name,
        bio: createAuthorDto.bio,
      },
    });
  }

  async findAll() {
    return this.prisma.author.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.author.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateAuthorDto: UpdateAuthorDto) {
    return this.prisma.author.update({
      where: { id },
      data: {
        name: updateAuthorDto.name,
        bio: updateAuthorDto.bio,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.author.delete({
      where: { id },
    });
  }
}
