import { IsString, IsNumber, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer'; // ✅ NUEVO import

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

    @IsBoolean()
    @IsOptional()
    mercadopagoHabilitado?: boolean;

    @IsString()
    @IsOptional()
    mercadopagoAccessToken?: string;

    @Type(() => Number) // ✅ NUEVO: convierte "5000" a 5000 antes de validar
    @IsNumber()
    @IsOptional()
    precioReserva?: number;
}