import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioClub, DiaSemana } from './entities/horario-club.entity';
import { UpdateHorariosClubDto } from './dto/update-horarios-club.dto';

// Configuración default: todos los días, 8 a 23hs, turnos de 90 min
const DEFAULT_HORARIOS = Object.values(DiaSemana)
    .filter((v) => typeof v === 'number')
    .map((diaSemana) => ({
        diaSemana: diaSemana as DiaSemana,
        horaInicio: '08:00',
        horaFin: '23:00',
        duracionTurno: 90,
        activo: true,
    }));

@Injectable()
export class HorariosClubService {
    constructor(
        @InjectRepository(HorarioClub)
        private horariosClubRepository: Repository<HorarioClub>,
    ) { }

    async findByClub(idClub: number): Promise<HorarioClub[] | typeof DEFAULT_HORARIOS> {
        const horarios = await this.horariosClubRepository.find({
            where: { idClub },
            order: { diaSemana: 'ASC' },
        });

        // Si el club nunca configuró nada, devolvemos el default (no rompe clubes existentes)
        if (horarios.length === 0) {
            return DEFAULT_HORARIOS;
        }
        return horarios;
    }

    async findByClubYDia(idClub: number, diaSemana: number) {
        const horario = await this.horariosClubRepository.findOne({
            where: { idClub, diaSemana },
        });

        if (!horario) {
            return DEFAULT_HORARIOS.find((h) => h.diaSemana === diaSemana);
        }
        return horario;
    }

    async upsertHorarios(idClub: number, dto: UpdateHorariosClubDto): Promise<HorarioClub[]> {
        const resultado: HorarioClub[] = [];

        for (const dia of dto.horarios) {
            let horario = await this.horariosClubRepository.findOne({
                where: { idClub, diaSemana: dia.diaSemana },
            });

            if (horario) {
                Object.assign(horario, dia);
            } else {
                horario = this.horariosClubRepository.create({
                    idClub,
                    ...dia,
                });
            }

            resultado.push(await this.horariosClubRepository.save(horario));
        }

        return resultado.sort((a, b) => a.diaSemana - b.diaSemana);
    }
}