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

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { dni, email, clave, ...userData } = registerDto;

        // Verificar si el usuario ya existe
        const existingUser = await this.usuariosService.findByDniOrEmail(
            dni,
            email,
        );
        if (existingUser) {
            throw new ConflictException('El DNI o email ya está registrado');
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(clave, 10);

        // Crear usuario
        const usuario = await this.usuariosService.create({
            dni,
            email,
            clave: hashedPassword,
            ...userData,
        });

        // Generar token
        const token = this.generateToken(usuario);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { dni, password } = loginDto;

        // Buscar usuario
        const usuario = await this.usuariosService.findByDni(dni);
        if (!usuario) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, usuario.clave);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        // Generar token
        const token = this.generateToken(usuario);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
        };
    }

    async validateUser(userId: number) {
        return await this.usuariosService.findOne(userId);
    }

    private generateToken(usuario: any) {
        const payload = {
            sub: usuario.idUsuario,
            dni: usuario.dni,
            email: usuario.email,
        };
        return this.jwtService.sign(payload);
    }

    private sanitizeUser(usuario: any) {
        const { clave, ...result } = usuario;
        return result;
    }
}