import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../usuarios/entities/usuario.entity';

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { dni, email, clave, ...userData } = registerDto;

        const existingUser = await this.usuariosService.findByDniOrEmail(dni, email);
        if (existingUser) {
            throw new ConflictException('El DNI o email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(clave, 10);

        // Crear usuario SIEMPRE como JUGADOR
        const usuario = await this.usuariosService.create({
            dni,
            email,
            clave: hashedPassword,
            rol: UserRole.JUGADOR, // ← Forzar rol jugador
            ...userData,
        });

        const token = this.generateToken(usuario);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { dni, password } = loginDto;

        const usuario = await this.usuariosService.findByDni(dni);
        if (!usuario) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.clave);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        const token = this.generateToken(usuario);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
        };
    }

    async validateUser(userId: number) {
        const usuario = await this.usuariosService.findOne(userId);

        console.log('👤 validateUser:', {
            id: usuario?.idUsuario,
            email: usuario?.email,
            rol: usuario?.rol  // ← Verificar que exista
        });

        return usuario;

    }

    private generateToken(usuario: any) {
        const payload = {
            sub: usuario.idUsuario,
            dni: usuario.dni,
            email: usuario.email,
            rol: usuario.rol, // ← Incluir rol en el token
        };

        return this.jwtService.sign(payload);
    }

    private sanitizeUser(usuario: any) {
        const { clave, ...result } = usuario;

        return result;
    }
}