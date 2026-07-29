import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { addDays } from 'date-fns';
import * as bcrypt from 'bcryptjs';
import { CreateClubConAdminDto } from './dto/create-club-con-admin.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { UserRole } from '../usuarios/entities/usuario.entity';


@Injectable()
export class ClubesService {
    constructor(
        @InjectRepository(Club)
        private clubesRepository: Repository<Club>,
        private usuariosService: UsuariosService,
    ) { }

    async create(createClubDto: CreateClubDto): Promise<Club> {
        const existente = await this.clubesRepository.findOne({
            where: { slug: createClubDto.slug },
        });
        if (existente) {
            throw new ConflictException(`El slug "${createClubDto.slug}" ya está en uso`);
        }

        // Asignar mes de prueba automáticamente
        const hoy = new Date();
        const club = this.clubesRepository.create({
            ...createClubDto,
            fechaInicioPrueba: hoy,
            fechaFinPrueba: addDays(hoy, 30),
            activo: true,
            pagado: false,
        });

        return await this.clubesRepository.save(club);
    }

    async findAll(): Promise<Club[]> {
        return await this.clubesRepository.find({
            order: { fechaCreacion: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Club> {
        const club = await this.clubesRepository.findOne({
            where: { idClub: id },
        });
        if (!club) {
            throw new NotFoundException(`Club con ID ${id} no encontrado`);
        }
        return club;
    }

    async findBySlug(slug: string): Promise<Club | null> {
        return await this.clubesRepository.findOne({ where: { slug } });
    }

    async update(id: number, updateClubDto: UpdateClubDto): Promise<Club> {
        const club = await this.findOne(id);
        Object.assign(club, updateClubDto);
        return await this.clubesRepository.save(club);
    }

    async remove(id: number): Promise<void> {
        const club = await this.findOne(id);
        club.activo = false;
        await this.clubesRepository.save(club);
    }

    // Verifica si el club está en período de prueba o pagado
    isClubActivo(club: Club): boolean {
        if (!club.activo) return false;
        if (club.pagado) return true;

        // Verificar si está dentro del período de prueba
        const hoy = new Date();
        if (club.fechaFinPrueba && hoy <= new Date(club.fechaFinPrueba)) {
            return true;
        }

        return false;
    }

    async createConAdmin(dto: CreateClubConAdminDto): Promise<{ club: Club; admin: any }> {
        const { admin, ...clubData } = dto;

        const existente = await this.clubesRepository.findOne({
            where: { slug: clubData.slug },
        });
        if (existente) {
            throw new ConflictException(`El slug "${clubData.slug}" ya está en uso`);
        }

        const hoy = new Date();
        const club = this.clubesRepository.create({
            ...clubData,
            fechaInicioPrueba: hoy,
            fechaFinPrueba: addDays(hoy, 30),
            activo: true,
            pagado: false,
        });
        const clubGuardado = await this.clubesRepository.save(club);

        try {
            const hashedPassword = await bcrypt.hash(admin.clave, 10);
            const usuarioAdmin = await this.usuariosService.create({
                dni: admin.dni,
                email: admin.email,
                nombre: admin.nombre,
                apellido: admin.apellido,
                telefono: admin.telefono,
                clave: hashedPassword,
                rol: UserRole.ADMIN,
                idClub: clubGuardado.idClub,
            });

            const { clave, ...adminSinClave } = usuarioAdmin;
            return { club: clubGuardado, admin: adminSinClave };
        } catch (error: unknown) {
            await this.clubesRepository.remove(clubGuardado);
            const err = error as { code?: string };
            if (err.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('El DNI o email del administrador ya está en uso');
            }
            throw error;
        }
    }

    getPublicInfo(club: Club) {
        return {
            slug: club.slug,
            nombre: club.nombre,
            emailContacto: club.emailContacto,
            telefono: club.telefono,
            direccion: club.direccion,
            facebookUrl: club.facebookUrl,
            instagramUrl: club.instagramUrl,
            twitterUrl: club.twitterUrl,
            horarioSemana: club.horarioSemana,
            horarioFinde: club.horarioFinde,
        };
    }
}