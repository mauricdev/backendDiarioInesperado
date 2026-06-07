import { IsNotEmpty, IsString } from 'class-validator';

export class GenerarNoticiaDto {
  @IsString()
  @IsNotEmpty()
  tema: string;

  @IsString()
  @IsNotEmpty()
  contextoAutor: string;
}
