import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { addDays } from 'date-fns';

@Injectable()
export class ClubesService {
    constructor(
        @InjectRepository(Club)
        private clubsRepository: Repository<Club>,
    ) {}

    async create(createClubDto: CreateClubDto): Promise<Club> {
        const existente = await this.clubsRepository.findOne({
            where: { slug: createClubDto.slug },
        });
        if (existente) {
            throw new ConflictException(`El slug "${createClubDto.slug}" ya está en uso`);
        }

        // Asignar mes de prueba automáticamente
        const hoy = new Date();
        const club = this.clubsRepository.create({
            ...createClubDto,
            fechaInicioPrueba: hoy,
            fechaFinPrueba: addDays(hoy, 30),
            activo: true,
            pagado: false,
        });

        return await this.clubsRepository.save(club);
    }

    async findAll(): Promise<Club[]> {
        return await this.clubsRepository.find({
            order: { fechaCreacion: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Club> {
        const club = await this.clubsRepository.findOne({
            where: { idClub: id },
        });
        if (!club) {
            throw new NotFoundException(`Club con ID ${id} no encontrado`);
        }
        return club;
    }

    async findBySlug(slug: string): Promise<Club | null> {
        return await this.clubsRepository.findOne({ where: { slug } });
    }

    async update(id: number, updateClubDto: UpdateClubDto): Promise<Club> {
        const club = await this.findOne(id);
        Object.assign(club, updateClubDto);
        return await this.clubsRepository.save(club);
    }

    async remove(id: number): Promise<void> {
        const club = await this.findOne(id);
        club.activo = false;
        await this.clubsRepository.save(club);
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
}