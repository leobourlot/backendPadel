import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCanchaDto {
    @IsNotEmpty()
    @IsString()
    numero: string;

    @IsNotEmpty()
    @IsString()
    tipo: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    activa?: boolean;
}