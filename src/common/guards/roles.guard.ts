import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../usuarios/entities/usuario.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();

        // SUPERADMIN siempre tiene acceso a todo
        if (user?.rol === UserRole.SUPERADMIN) return true;

        const hasRole = requiredRoles.some((role) => user.rol === role);

        if (!hasRole) {
            throw new ForbiddenException(`Se requiere rol: ${requiredRoles.join(' o ')}`);
        }

        return hasRole;
    }
}