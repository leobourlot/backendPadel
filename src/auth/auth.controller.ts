import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto, @CurrentClub() club: Club) {
        return await this.authService.register(registerDto, club);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto, @CurrentClub() club: Club) {
        return await this.authService.login(loginDto, club);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user: any) {
        return user;
    }
}