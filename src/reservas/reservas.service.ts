import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { ReservaRecurrente } from './entities/reserva-recurrente.entity';
import { CreateReservaRecurrenteDto } from './dto/create-reserva-recurrente.dto';

@Injectable()
export class ReservasService {
    constructor(
        @InjectRepository(Reserva)
        private reservasRepository: Repository<Reserva>,
        @InjectRepository(ReservaRecurrente)
        private reservasRecurrentesRepository: Repository<ReservaRecurrente>,
    ) { }

    async create(createReservaDto: CreateReservaDto, idClub: number): Promise<Reserva> {
        const conflicto = await this.verificarDisponibilidad(
            createReservaDto.idCancha,
            createReservaDto.fechaReserva,
            createReservaDto.horaInicio,
            createReservaDto.horaFin,
            idClub,
        );
        if (conflicto) {
            throw new ConflictException('El horario no está disponible');
        }

        const reserva = this.reservasRepository.create({
            ...createReservaDto,
            idClub,
        });
        return await this.reservasRepository.save(reserva);
    }

    async findAll(idClub: number): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            where: { idClub },
            relations: ['usuario', 'cancha'],
            order: { fechaReserva: 'ASC', horaInicio: 'ASC' },
        });
    }

    async findOne(id: number, idClub: number): Promise<Reserva> {
        const reserva = await this.reservasRepository.findOne({
            where: { idReserva: id, idClub },
            relations: ['usuario', 'cancha'],
        });
        if (!reserva) {
            throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
        }
        return reserva;
    }

    async findByUsuario(idUsuario: number, idClub: number): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            where: { idUsuario, idClub },
            relations: ['cancha'],
            order: { fechaReserva: 'ASC', horaInicio: 'ASC' },
        });
    }

    async findByCancha(idCancha: number, fecha: Date, idClub: number): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            where: {
                idCancha,
                fechaReserva: fecha,
                estado: 'confirmada',
                idClub,
            },
            relations: ['usuario', 'cancha'],
            order: { horaInicio: 'ASC' },
        });
    }

    async update(id: number, updateReservaDto: UpdateReservaDto, idClub: number): Promise<Reserva> {
        const reserva = await this.findOne(id, idClub);
        Object.assign(reserva, updateReservaDto);
        return await this.reservasRepository.save(reserva);
    }

    async cancel(id: number, idClub: number): Promise<Reserva> {
        const reserva = await this.findOne(id, idClub);
        reserva.estado = 'cancelada';
        return await this.reservasRepository.save(reserva);
    }

    async remove(id: number, idClub: number): Promise<void> {
        const reserva = await this.findOne(id, idClub);
        await this.reservasRepository.remove(reserva);
    }

    async createRecurrente(
        createDto: CreateReservaRecurrenteDto,
        idClub: number,
    ): Promise<ReservaRecurrente> {
        const { fechaInicio, fechaFin, diaSemana, horaInicio, horaFin, idCancha, idUsuario } = createDto;

        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
            throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        const fechaInicioDate = new Date(fechaInicio);
        if (fechaInicioDate.getDay() !== diaSemana) {
            throw new BadRequestException('El día de la semana no coincide con la fecha de inicio');
        }

        const existente = await this.reservasRecurrentesRepository.findOne({
            where: { idUsuario, idCancha, diaSemana, horaInicio, activa: true, idClub },
        });
        if (existente) {
            throw new ConflictException('Ya tienes una reserva recurrente en este horario');
        }

        const reservaRecurrente = this.reservasRecurrentesRepository.create({
            ...createDto,
            idClub,
        });
        const saved = await this.reservasRecurrentesRepository.save(reservaRecurrente);

        await this.generarReservasDeRecurrente(saved, 4);

        return saved;
    }

    async generarReservasDeRecurrente(
        recurrente: ReservaRecurrente,
        semanas: number = 4,
    ): Promise<void> {
        const reservasACrear: Partial<Reserva>[] = [];
        const fechaActual = new Date();
        const fechaInicio = new Date(recurrente.fechaInicio);

        for (let i = 0; i < semanas; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fecha.getDate() + i * 7);

            if (fecha < fechaActual) continue;
            if (recurrente.fechaFin && fecha > new Date(recurrente.fechaFin)) break;

            const conflicto = await this.verificarDisponibilidad(
                recurrente.idCancha,
                fecha,
                recurrente.horaInicio,
                recurrente.horaFin,
                recurrente.idClub,
            );

            if (!conflicto) {
                reservasACrear.push({
                    idUsuario: recurrente.idUsuario,
                    idCancha: recurrente.idCancha,
                    idClub: recurrente.idClub,
                    fechaReserva: fecha,
                    horaInicio: recurrente.horaInicio,
                    horaFin: recurrente.horaFin,
                    estado: 'confirmada',
                });
            }
        }

        if (reservasACrear.length > 0) {
            await this.reservasRepository.save(reservasACrear);
        }
    }

    async findRecurrentesByUsuario(
        idUsuario: number,
        idClub: number,
    ): Promise<ReservaRecurrente[]> {
        return await this.reservasRecurrentesRepository.find({
            where: { idUsuario, activa: true, idClub },
            relations: ['cancha'],
            order: { diaSemana: 'ASC', horaInicio: 'ASC' },
        });
    }

    async cancelRecurrente(
        id: number,
        idUsuario: number,
        idClub: number,
    ): Promise<ReservaRecurrente> {
        const recurrente = await this.reservasRecurrentesRepository.findOne({
            where: { idReservaRecurrente: id, idClub },
        });

        if (!recurrente) {
            throw new NotFoundException('Reserva recurrente no encontrada');
        }
        if (recurrente.idUsuario !== idUsuario) {
            throw new BadRequestException('No tienes permiso para cancelar esta reserva');
        }

        recurrente.activa = false;
        return await this.reservasRecurrentesRepository.save(recurrente);
    }

    private async verificarDisponibilidad(
        idCancha: number,
        fecha: Date,
        horaInicio: string,
        horaFin: string,
        idClub: number,
    ): Promise<boolean> {
        const reserva = await this.reservasRepository
            .createQueryBuilder('reserva')
            .where('reserva.idCancha = :idCancha', { idCancha })
            .andWhere('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva = :fecha', { fecha })
            .andWhere('reserva.estado = :estado', { estado: 'confirmada' })
            .andWhere(
                '(reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)',
                { horaInicio, horaFin },
            )
            .getOne();

        return !!reserva;
    }
}