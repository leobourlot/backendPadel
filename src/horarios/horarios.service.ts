import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorariosService {
    constructor(
        @InjectRepository(Horario)
        private horariosRepository: Repository<Horario>,
    ) { }

    async create(createHorarioDto: CreateHorarioDto): Promise<Horario> {
        const horario = this.horariosRepository.create(createHorarioDto);
        return await this.horariosRepository.save(horario);
    }

    async findAll(): Promise<Horario[]> {
        return await this.horariosRepository.find({
            where: { activo: true },
            order: { horaInicio: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Horario> {
        const horario = await this.horariosRepository.findOne({
            where: { idHorario: id },
        });
        if (!horario) {
            throw new NotFoundException(`Horario con ID ${id} no encontrado`);
        }
        return horario;
    }

    async update(id: number, updateHorarioDto: UpdateHorarioDto): Promise<Horario> {
        const horario = await this.findOne(id);
        Object.assign(horario, updateHorarioDto);
        return await this.horariosRepository.save(horario);
    }

    async remove(id: number): Promise<void> {
        const horario = await this.findOne(id);
        horario.activo = false;
        await this.horariosRepository.save(horario);
    }

    async generarHorariosDefault(): Promise<Horario[]> {
        const horarios = [];
        for (let hour = 8; hour <= 22; hour += 1.5) {
            const wholeHour = Math.floor(hour);
            const minutes = (hour % 1) * 60;
            const horaInicio = `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            const endHour = hour + 1.5;
            const endWholeHour = Math.floor(endHour);
            const endMinutes = (endHour % 1) * 60;
            const horaFin = `${String(endWholeHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

            horarios.push(
                this.horariosRepository.create({
                    horaInicio,
                    horaFin,
                    duracionMinutos: 90,
                }),
            );
        }
        return await this.horariosRepository.save(horarios);
    }
}