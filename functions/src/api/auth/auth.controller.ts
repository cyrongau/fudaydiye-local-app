
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, RegisterUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) { }

    @Post('otp/request')
    requestOtp(@Body() requestOtpDto: RequestOtpDto) {
        return this.authService.requestOtp(requestOtpDto);
    }

    @Post('otp/verify')
    verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    @Post('register')
    register(@Body() dto: RegisterUserDto) {
        return this.authService.registerUser(dto);
    }

    @Post('bootstrap-claims')
    @UseGuards(JwtAuthGuard)
    async bootstrapClaims(@Req() req: any) {
        // Bootstrap endpoint: only requires JWT auth, no role check
        // Used for initial claims sync when user doesn't have role claims yet
        const user = req.user;
        return this.usersService.syncCustomClaims(user.uid);
    }
}
