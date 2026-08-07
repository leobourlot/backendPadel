import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';
import { LoginSuperAdminDto } from './dto/login-superadmin.dto'; // ✅ NUEVO

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto por IP
    @Post('register')
    async register(@Body() registerDto: RegisterDto, @CurrentClub() club: Club) {
        return await this.authService.register(registerDto, club);
    }

    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto por IP
    @Post('login')
    async login(@Body() loginDto: LoginDto, @CurrentClub() club: Club) {
        return await this.authService.login(loginDto, club);
    }

    @Throttle({ default: { limit: 3, ttl: 60000 } }) // más estricto: es la puerta de entrada al SaaS enter
    @Post('superadmin/login')
    async loginSuperAdmin(@Body() loginDto: LoginSuperAdminDto) {
        return await this.authService.loginSuperAdmin(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user: any) {
        return user;
    }
}