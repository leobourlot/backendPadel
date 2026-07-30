import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSuperAdminDto {
    @IsNotEmpty()
    @IsString()
    dni: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}