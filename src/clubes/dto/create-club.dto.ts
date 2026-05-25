import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';

export class CreateClubDto {
    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsEmail()
    @IsOptional()
    emailContacto?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;

    @IsDateString()
    @IsOptional()
    fechaInicioPrueba?: Date;

    @IsDateString()
    @IsOptional()
    fechaFinPrueba?: Date;
}