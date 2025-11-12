import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/usuario.entity';

export class UpdateRoleDto {
    @IsEnum(UserRole)
    rol: UserRole;
}