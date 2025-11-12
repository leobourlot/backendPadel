import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private usuariosRepository: Repository<Usuario>,
    ) { }

    async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const usuario = this.usuariosRepository.create(createUsuarioDto);
        return await this.usuariosRepository.save(usuario);
    }

    async findAll(): Promise<Usuario[]> {
        return await this.usuariosRepository.find({
            select: ['idUsuario', 'dni', 'email', 'nombre', 'apellido', 'telefono', 'rol', 'activo', 'fechaCreacion'],
            order: {
                rol: 'DESC',  // Admins primero
                nombre: 'ASC'
            }
        });
    }

    async findOne(id: number): Promise<Usuario> {
        const usuario = await this.usuariosRepository.findOne({
            where: { idUsuario: id },
        });
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        console.log('📊 Usuario encontrado:', {
            id: usuario.idUsuario,
            email: usuario.email,
            rol: usuario.rol  // ← Debe aparecer aquí
        });

        return usuario;
    }

    async findByDni(dni: string): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({ where: { dni } });
    }

    async findByEmail(email: string): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({ where: { email } });
    }

    async findByDniOrEmail(dni: string, email: string): Promise<Usuario | null> {
        return await this.usuariosRepository
            .createQueryBuilder('usuario')
            .where('usuario.dni = :dni OR usuario.email = :email', { dni, email })
            .getOne();
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findOne(id);
        Object.assign(usuario, updateUsuarioDto);
        return await this.usuariosRepository.save(usuario);
    }

    // ✅ NUEVO: Cambiar el rol de un usuario
    async updateRole(id: number, rol: UserRole): Promise<Usuario> {
        const usuario = await this.findOne(id);

        if (!Object.values(UserRole).includes(rol)) {
            throw new BadRequestException(`Rol inválido: ${rol}`);
        }

        console.log(`📝 Cambiando rol de ${usuario.email} de ${usuario.rol} a ${rol}`);

        usuario.rol = rol;
        return await this.usuariosRepository.save(usuario);
    }

    // ✅ NUEVO: Activar/Desactivar usuario
    async toggleActive(id: number, activo: boolean): Promise<Usuario> {
        const usuario = await this.findOne(id);

        console.log(`📝 Cambiando estado de ${usuario.email} a ${activo ? 'activo' : 'inactivo'}`);

        usuario.activo = activo;
        return await this.usuariosRepository.save(usuario);
    }

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id);
        await this.usuariosRepository.remove(usuario);
    }
}