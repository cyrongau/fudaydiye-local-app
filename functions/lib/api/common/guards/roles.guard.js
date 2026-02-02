"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        var _a;
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
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
            const admin = await Promise.resolve().then(() => require('firebase-admin'));
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const dbRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
                if (requiredRoles.some((role) => dbRole === role)) {
                    // Optional: Self-heal custom claims?
                    // await admin.auth().setCustomUserClaims(user.uid, { role: dbRole });
                    return true;
                }
            }
        }
        catch (e) {
            console.error('RolesGuard Firestore Fallback Error', e);
        }
        return false;
    }
};
RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
exports.RolesGuard = RolesGuard;
//# sourceMappingURL=roles.guard.js.map