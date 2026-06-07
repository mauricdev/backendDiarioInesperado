import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CloudinaryService } from '../cloudinary.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, CloudinaryService],
})
export class PostsModule { }