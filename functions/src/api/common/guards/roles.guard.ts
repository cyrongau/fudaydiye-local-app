
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/dto/users.dto';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        // If no user attached (e.g. public route but roles decorator used by mistake?), allow?
        // No, if roles are required, user must be authenticated.
        // Ensure JwtAuthGuard runs first.
        if (!user || !user.role) {
            return false;
        }

        return requiredRoles.some((role) => user.role === role);
    }
}
