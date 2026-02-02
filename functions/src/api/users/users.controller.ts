import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateProfileDto, UpdateRoleDto, UserRole, UpdateUserStatusDto } from './dto/users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }


    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    findAll(@Query('role') role?: UserRole) {
        return this.usersService.findAll(role);
    }

    @Get(':uid')
    findOne(@Param('uid') uid: string, @Req() req: any) {
        // Allow if owner or Admin
        const user = req.user;
        if (user.uid !== uid && !['ADMIN', 'FUDAYDIYE_ADMIN'].includes(user.role)) {
            throw new ForbiddenException("You can only view your own profile.");
        }
        return this.usersService.findOne(uid);
    }

    @Patch(':uid')
    update(@Param('uid') uid: string, @Body() updateProfileDto: UpdateProfileDto, @Req() req: any) {
        const user = req.user;
        if (user.uid !== uid && !['ADMIN', 'FUDAYDIYE_ADMIN'].includes(user.role)) {
            throw new ForbiddenException("You can only update your own profile.");
        }
        return this.usersService.update(uid, updateProfileDto);
    }

    @Post(':uid/role')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    setRole(@Param('uid') uid: string, @Body() body: UpdateRoleDto) {
        return this.usersService.setRole(uid, body.role);
    }

    @Patch(':uid/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    updateStatus(@Param('uid') uid: string, @Body() body: UpdateUserStatusDto) {
        return this.usersService.updateStatus(uid, body);
    }

    @Delete(':uid')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    delete(@Param('uid') uid: string) {
        return this.usersService.deleteUser(uid);
    }

    @Post(':uid/reset-password')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    resetPassword(@Param('uid') uid: string) {
        return this.usersService.resetPassword(uid);
    }

    @Post(':uid/kyc')
    uploadKyc(@Param('uid') uid: string, @Body() body: any, @Req() req: any) {
        const user = req.user;
        if (user.uid !== uid) {
            throw new ForbiddenException("You can only upload KYC for your own profile.");
        }
        return this.usersService.uploadKyc(uid, body);
    }

    @Post('me/sync-claims')
    async syncMyClaims(@Req() req: any) {
        // Self-service endpoint: sync custom claims from Firestore
        const user = req.user;
        return this.usersService.syncCustomClaims(user.uid);
    }
}
