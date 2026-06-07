import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
    title: string;
    description: string;
    content: string;
    imageUrl?: string;
    published?: boolean;
    author?: string;

    @IsOptional()
    @IsString()
    socialSummary?: string;
}