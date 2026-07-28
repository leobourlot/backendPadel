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

    @IsString()
    @IsOptional()
    direccion?: string;
    
    @IsString()
    @IsOptional()
    mail?: string;

    @IsString()
    @IsOptional()
    facebookUrl?: string;

    @IsString()
    @IsOptional()
    instagramUrl?: string;

    @IsString()
    @IsOptional()
    twitterUrl?: string;

    @IsString()
    @IsOptional()
    horarioSemana?: string;

    @IsString()
    @IsOptional()
    horarioFinde?: string;

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