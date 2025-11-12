import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    @IsNotEmpty()
    @IsString()
    dni: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsNotEmpty()
    @IsString()
    apellido: string;

    @IsNotEmpty()
    @IsString()
    telefono: string;

    @IsNotEmpty()
    @IsString()
    clave: string;

    @IsEnum(UserRole)
    @IsOptional()
    rol: UserRole
}