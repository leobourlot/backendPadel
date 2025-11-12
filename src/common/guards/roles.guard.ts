import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../usuarios/entities/usuario.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('🔒 RolesGuard - Roles requeridos:', requiredRoles);

        if (!requiredRoles) {
            console.log('✅ No se requieren roles específicos');
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        console.log('👤 Usuario en request:', {
            id: user?.idUsuario,
            email: user?.email,
            rol: user?.rol
        });

        const hasRole = requiredRoles.some((role) => user.rol === role);

        console.log('🔍 ¿Usuario tiene rol requerido?', hasRole);
        console.log('🔍 Rol del usuario:', user.rol);
        console.log('🔍 Roles permitidos:', requiredRoles);

        if (!hasRole) {
            throw new ForbiddenException(`Se requiere rol: ${requiredRoles.join(' o ')}`);
        }

        return hasRole;
    }
}