import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CloudinaryService } from '../cloudinary.service';
import { AiService } from './ai.service';
import { UnsplashService } from './unsplash.service';
import { FacebookModule } from '../facebook/facebook.module';

@Module({
  imports: [FacebookModule],
  controllers: [PostsController],
  providers: [PostsService, CloudinaryService, AiService, UnsplashService],
})
export class PostsModule { }