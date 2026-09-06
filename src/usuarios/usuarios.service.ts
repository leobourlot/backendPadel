import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcryptjs';


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

    // ✅ NUEVO: para el panel de superadmin. Devuelve usuarios de TODOS los clubes,
    // opcionalmente filtrados por idClub, incluyendo el nombre/slug del club de cada uno.
    async findAllGlobal(idClub?: number): Promise<Usuario[]> {
        const query = this.usuariosRepository
            .createQueryBuilder('usuario')
            .leftJoin('usuario.club', 'club')
            .select([
                'usuario.idUsuario',
                'usuario.dni',
                'usuario.email',
                'usuario.nombre',
                'usuario.apellido',
                'usuario.telefono',
                'usuario.rol',
                'usuario.activo',
                'usuario.idClub',
                'usuario.fechaCreacion',
                'club.idClub',
                'club.nombre',
                'club.slug',
            ])
            .orderBy('usuario.rol', 'DESC')
            .addOrderBy('usuario.nombre', 'ASC');

        if (idClub) {
            query.andWhere('usuario.idClub = :idClub', { idClub });
        }

        return await query.getMany();
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

    async update(
        id: number,
        updateUsuarioDto: UpdateUsuarioDto,
        idClubSolicitante?: number,
        esSuperAdmin?: boolean,
    ): Promise<Usuario> {
        const usuario = await this.findOne(id);

        // Si no es superadmin, solo puede editar usuarios de su propio club
        if (!esSuperAdmin && idClubSolicitante && usuario.idClub !== idClubSolicitante) {
            throw new ForbiddenException('No tenés permiso para editar este usuario');
        }

        const dataToUpdate: any = { ...updateUsuarioDto };

        if (dataToUpdate.clave) {
            dataToUpdate.clave = await bcrypt.hash(dataToUpdate.clave, 10);
        } else {
            delete dataToUpdate.clave; // no pisar la contraseña si no se envió una nueva
        }

        Object.assign(usuario, dataToUpdate);
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

    // ✅ CAMBIADO: ahora respeta el mismo scoping por club que update() (solo cambia
    // comportamiento si el controller pasa idClubSolicitante/esSuperAdmin explícitamente;
    // llamadas existentes sin esos argumentos siguen funcionando igual que antes).
    async remove(id: number, idClubSolicitante?: number, esSuperAdmin?: boolean): Promise<void> {
        const usuario = await this.findOne(id);

        if (!esSuperAdmin && idClubSolicitante && usuario.idClub !== idClubSolicitante) {
            throw new ForbiddenException('No tenés permiso para eliminar este usuario');
        }

        await this.usuariosRepository.remove(usuario);
    }

    async findSuperAdminByDni(dni: string): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({
            where: { dni, rol: UserRole.SUPERADMIN },
        });
    }
}