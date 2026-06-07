import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AiService } from './ai.service';
import { UnsplashService } from './unsplash.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GenerarNoticiaDto } from './dto/generar-noticia.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly aiService: AiService,
    private readonly unsplashService: UnsplashService,
  ) { }

  @Post('generar')
  generar(@Body() body: GenerarNoticiaDto) {
    return this.aiService.generarNoticia(body.tema, body.contextoAutor);
  }

  @Get('imagenes/buscar')
  buscarImagenes(@Query('q') q: string, @Query('page') page: string) {
    return this.unsplashService.buscarImagenes(q, Number(page) || 1);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(createPostDto, file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 9; // Traeremos de 9 en 9 para una grilla perfecta de 3x3
    return this.postsService.findAllPaginated(pageNum, limitNum);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.update(+id, updatePostDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}