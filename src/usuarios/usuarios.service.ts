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

    // Solo devuelve usuarios del mismo club
    async findAll(idClub: number): Promise<Usuario[]> {
        return await this.usuariosRepository.find({
            where: { idClub },
            select: ['idUsuario', 'dni', 'email', 'nombre', 'apellido', 'telefono', 'rol', 'activo', 'fechaCreacion'],
            order: {
                rol: 'DESC',
                nombre: 'ASC',
            },
        });
    }

    async findOne(id: number): Promise<Usuario> {
        const usuario = await this.usuariosRepository.findOne({
            where: { idUsuario: id },
        });
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return usuario;
    }

    // Buscar por DNI dentro del mismo club
    async findByDni(dni: string, idClub: number): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({ where: { dni, idClub } });
    }

    async findByEmail(email: string, idClub: number): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({ where: { email, idClub } });
    }

    async findByDniOrEmail(dni: string, email: string, idClub: number): Promise<Usuario | null> {
        return await this.usuariosRepository
            .createQueryBuilder('usuario')
            .where('(usuario.dni = :dni OR usuario.email = :email) AND usuario.idClub = :idClub', {
                dni,
                email,
                idClub,
            })
            .getOne();
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findOne(id);
        Object.assign(usuario, updateUsuarioDto);
        return await this.usuariosRepository.save(usuario);
    }

    async updateRole(id: number, rol: UserRole): Promise<Usuario> {
        const usuario = await this.findOne(id);
        if (!Object.values(UserRole).includes(rol)) {
            throw new BadRequestException(`Rol inválido: ${rol}`);
        }
        usuario.rol = rol;
        return await this.usuariosRepository.save(usuario);
    }

    async toggleActive(id: number, activo: boolean): Promise<Usuario> {
        const usuario = await this.findOne(id);
        usuario.activo = activo;
        return await this.usuariosRepository.save(usuario);
    }

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id);
        await this.usuariosRepository.remove(usuario);
    }
}