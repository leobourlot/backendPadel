import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
    constructor(
        @InjectRepository(Reserva)
        private reservasRepository: Repository<Reserva>,
    ) { }

    async create(createReservaDto: CreateReservaDto): Promise<Reserva> {
        // Verificar disponibilidad
        const conflicto = await this.verificarDisponibilidad(
            createReservaDto.idCancha,
            createReservaDto.fechaReserva,
            createReservaDto.horaInicio,
            createReservaDto.horaFin,
        );

        if (conflicto) {
            throw new ConflictException('El horario no está disponible');
        }

        const reserva = this.reservasRepository.create(createReservaDto);
        return await this.reservasRepository.save(reserva);
    }

    async findAll(): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            relations: ['usuario', 'cancha'],
            order: { fechaReserva: 'ASC', horaInicio: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Reserva> {
        const reserva = await this.reservasRepository.findOne({
            where: { idReserva: id },
            relations: ['usuario', 'cancha'],
        });
        if (!reserva) {
            throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
        }
        return reserva;
    }

    async findByUsuario(idUsuario: number): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            where: { idUsuario },
            relations: ['cancha'],
            order: { fechaReserva: 'ASC', horaInicio: 'ASC' },
        });
    }

    async findByCancha(idCancha: number, fecha: Date): Promise<Reserva[]> {
        return await this.reservasRepository.find({
            where: {
                idCancha,
                fechaReserva: fecha,
                estado: 'confirmada',
            },
            order: { horaInicio: 'ASC' },
        });
    }

    async update(id: number, updateReservaDto: UpdateReservaDto): Promise<Reserva> {
        const reserva = await this.findOne(id);
        Object.assign(reserva, updateReservaDto);
        return await this.reservasRepository.save(reserva);
    }

    async cancel(id: number): Promise<Reserva> {
        const reserva = await this.findOne(id);
        reserva.estado = 'cancelada';
        return await this.reservasRepository.save(reserva);
    }

    async remove(id: number): Promise<void> {
        const reserva = await this.findOne(id);
        await this.reservasRepository.remove(reserva);
    }

    private async verificarDisponibilidad(
        idCancha: number,
        fecha: Date,
        horaInicio: string,
        horaFin: string,
    ): Promise<boolean> {
        const reserva = await this.reservasRepository
            .createQueryBuilder('reserva')
            .where('reserva.idCancha = :idCancha', { idCancha })
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