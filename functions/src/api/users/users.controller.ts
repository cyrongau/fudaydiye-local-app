import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateProfileDto, UpdateRoleDto, UserRole, UpdateUserStatusDto } from './dto/users.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    findAll(@Query('role') role?: UserRole) {
        return this.usersService.findAll(role);
    }

    @Get(':uid')
    findOne(@Param('uid') uid: string) {
        return this.usersService.findOne(uid);
    }

    @Patch(':uid')
    update(@Param('uid') uid: string, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.update(uid, updateProfileDto);
    }

    @Post(':uid/role')
    setRole(@Param('uid') uid: string, @Body() body: UpdateRoleDto) {
        return this.usersService.setRole(uid, body.role);
    }

    @Patch(':uid/status')
    updateStatus(@Param('uid') uid: string, @Body() body: UpdateUserStatusDto) {
        return this.usersService.updateStatus(uid, body);
    }
}
