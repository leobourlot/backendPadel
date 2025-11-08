import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
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
            select: ['idUsuario', 'dni', 'email', 'nombre', 'apellido', 'telefono', 'activo'],
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

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id);
        await this.usuariosRepository.remove(usuario);
    }
}