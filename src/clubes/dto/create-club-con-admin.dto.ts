import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateClubDto } from './create-club.dto';

class AdminInicialDto {
    @IsString()
    @IsNotEmpty()
    dni: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsString()
    @IsNotEmpty()
    telefono: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    clave: string;
}

export class CreateClubConAdminDto extends CreateClubDto {
    @ValidateNested()
    @Type(() => AdminInicialDto)
    admin: AdminInicialDto;
}