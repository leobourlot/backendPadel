import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        const usuario = await this.authService.validateUser(payload.sub);
        if (!usuario) {
            throw new UnauthorizedException();
        }
        
        console.log('🔐 Usuario validado en JWT:', {
            id: usuario.idUsuario,
            email: usuario.email,
            rol: usuario.rol  // ← Verificar que el rol esté aquí
        });
        
        return usuario;
    }
}