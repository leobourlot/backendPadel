import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { UserRole } from '../entities/usuario.entity';

export class UpdateUsuarioSuperAdminDto extends UpdateUsuarioDto {
    @IsEnum(UserRole)
    @IsOptional()
    rol?: UserRole;

    // Permitir null explícito para "sin club" (caso: crear otro superadmin)
    @IsNumber()
    @IsOptional()
    idClub?: number | null;
}