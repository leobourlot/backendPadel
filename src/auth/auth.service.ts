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
import { Club } from '../clubes/entities/club.entity';

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto, club: Club) {
        const { dni, email, clave, confirmPassword, ...userData } = registerDto;

        // Verificar unicidad dentro del mismo club
        const existingUser = await this.usuariosService.findByDniOrEmail(
            dni,
            email,
            club.idClub,
        );
        if (existingUser) {
            throw new ConflictException('El DNI o email ya está registrado en este club');
        }

        const hashedPassword = await bcrypt.hash(clave, 10);

        const usuario = await this.usuariosService.create({
            dni,
            email,
            clave: hashedPassword,
            rol: UserRole.JUGADOR,
            idClub: club.idClub,
            ...userData,
        });

        const token = this.generateToken(usuario, club);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
            club: {
                slug: club.slug,
                nombre: club.nombre,
            },
        };
    }

    async login(loginDto: LoginDto, club: Club) {
        const { dni, password } = loginDto;

        // Buscar usuario dentro del club
        const usuario = await this.usuariosService.findByDni(dni, club.idClub);
        if (!usuario) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        if (!usuario.activo) {
            throw new UnauthorizedException('Usuario desactivado. Contacta al administrador.');
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.clave);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        const token = this.generateToken(usuario, club);

        return {
            usuario: this.sanitizeUser(usuario),
            token,
            club: {
                slug: club.slug,
                nombre: club.nombre,
            },
        };
    }

    async validateUser(userId: number) {
        const usuario = await this.usuariosService.findOne(userId);
        if (!usuario.activo) {
            throw new UnauthorizedException('Usuario desactivado');
        }
        return usuario;
    }

    private generateToken(usuario: any, club: Club) {
        const payload = {
            sub: usuario.idUsuario,
            dni: usuario.dni,
            email: usuario.email,
            rol: usuario.rol,
            idClub: club.idClub,
            slugClub: club.slug,
        };
        return this.jwtService.sign(payload);
    }

    private sanitizeUser(usuario: any) {
        const { clave, ...result } = usuario;
        return result;
    }
}