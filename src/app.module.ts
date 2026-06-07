import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { PostsModule } from './posts/posts.module';
import { CloudinaryService } from './cloudinary.service';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, PostsModule, AuthorsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {}
