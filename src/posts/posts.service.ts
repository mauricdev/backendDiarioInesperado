import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary.service';

@Injectable()
export class PostsService {
  // Inyectamos Prisma y Cloudinary
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) { }

  // Función para guardar una nueva historia rata con subida opcional de imagen
  async create(createPostDto: CreatePostDto, file?: Express.Multer.File) {
    let imageUrl: string | null = createPostDto.imageUrl ?? null;

    if (file) {
      imageUrl = await this.cloudinaryService.uploadImage(file);
    }

    const isPublished = typeof createPostDto.published === 'string'
      ? createPostDto.published === 'true'
      : !!createPostDto.published;

    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        description: createPostDto.description,
        content: createPostDto.content,
        imageUrl: imageUrl,
        published: isPublished,
        author: createPostDto.author,
        socialSummary: createPostDto.socialSummary,
      },
    });
  }

  // Función para obtener todas las historias de la revista
  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.prisma.post.findMany({
      skip: skip,
      take: limit,
      orderBy: { id: 'desc' } // Las más nuevas primero
    });
  }

  // Función para obtener una única historia por ID
  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id }
    });
  }

  // Función para actualizar una historia existente
  async update(id: number, updatePostDto: UpdatePostDto, file?: Express.Multer.File) {
    const data: any = {};

    if (updatePostDto.title !== undefined) data.title = updatePostDto.title;
    if (updatePostDto.description !== undefined) data.description = updatePostDto.description;
    if (updatePostDto.content !== undefined) data.content = updatePostDto.content;
    if (updatePostDto.author !== undefined) data.author = updatePostDto.author;
    if (updatePostDto.socialSummary !== undefined) data.socialSummary = updatePostDto.socialSummary;
    if (updatePostDto.imageUrl !== undefined) data.imageUrl = updatePostDto.imageUrl;

    if (updatePostDto.published !== undefined) {
      data.published = typeof updatePostDto.published === 'string'
        ? updatePostDto.published === 'true'
        : !!updatePostDto.published;
    }

    if (file) {
      data.imageUrl = await this.cloudinaryService.uploadImage(file);
    }

    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  // Función para eliminar una historia por ID
  async remove(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}