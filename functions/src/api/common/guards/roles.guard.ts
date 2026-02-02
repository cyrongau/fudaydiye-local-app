
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/dto/users.dto';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        // 1. Check Token Claims (Fast Path)
        if (user.role && requiredRoles.some((role) => user.role === role)) {
            return true;
        }

        // 2. Fallback: Check Firestore (Robus Path for Missing Claims)
        try {
            const admin = await import('firebase-admin');
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();

            if (userDoc.exists) {
                const dbRole = userDoc.data()?.role;
                if (requiredRoles.some((role) => dbRole === role)) {
                    // Optional: Self-heal custom claims?
                    // await admin.auth().setCustomUserClaims(user.uid, { role: dbRole });
                    return true;
                }
            }
        } catch (e) {
            console.error('RolesGuard Firestore Fallback Error', e);
        }

        return false;
    }
}
