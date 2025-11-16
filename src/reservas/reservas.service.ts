import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

    async createRecurrente(createDto: CreateReservaRecurrenteDto): Promise<ReservaRecurrente> {
        const { fechaInicio, fechaFin, diaSemana, horaInicio, horaFin, idCancha, idUsuario } = createDto;

        // Validar fechas
        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
            throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // Validar que el día de la semana coincida con la fecha de inicio
        const fechaInicioDate = new Date(fechaInicio);
        if (fechaInicioDate.getDay() !== diaSemana) {
            console.log('fechaInicio es: ', fechaInicio)
            console.log('fechaInicio.GetDay es: ', fechaInicio.getDay())
            console.log('diaSemana es: ', diaSemana)
            throw new BadRequestException('El día de la semana no coincide con la fecha de inicio');
        }

        // Verificar si ya existe una reserva recurrente similar
        const existente = await this.reservasRecurrentesRepository.findOne({
            where: {
                idUsuario,
                idCancha,
                diaSemana,
                horaInicio,
                activa: true,
            },
        });

        if (existente) {
            throw new ConflictException('Ya tienes una reserva recurrente en este horario');
        }

        const reservaRecurrente = this.reservasRecurrentesRepository.create(createDto);
        const saved = await this.reservasRecurrentesRepository.save(reservaRecurrente);

        // Generar reservas para las próximas semanas (por ejemplo, 4 semanas)
        await this.generarReservasDeRecurrente(saved, 4);

        return saved;
    }

    // ✅ NUEVO: Generar reservas individuales desde una recurrente
    async generarReservasDeRecurrente(recurrente: ReservaRecurrente, semanas: number = 4): Promise<void> {
        const reservasACrear: Partial<Reserva>[] = [];
        const fechaActual = new Date();
        const fechaInicio = new Date(recurrente.fechaInicio);

        for (let i = 0; i < semanas; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fecha.getDate() + (i * 7));

            // No crear si es fecha pasada
            if (fecha < fechaActual) {
                continue;
            }

            // No crear si supera la fecha fin
            if (recurrente.fechaFin && fecha > new Date(recurrente.fechaFin)) {
                break;
            }

            // Verificar disponibilidad
            const conflicto = await this.verificarDisponibilidad(
                recurrente.idCancha,
                fecha,
                recurrente.horaInicio,
                recurrente.horaFin,
            );

            if (!conflicto) {
                reservasACrear.push({
                    idUsuario: recurrente.idUsuario,
                    idCancha: recurrente.idCancha,
                    fechaReserva: fecha,
                    horaInicio: recurrente.horaInicio,
                    horaFin: recurrente.horaFin,
                    estado: 'confirmada',
                });
            }
        }

        if (reservasACrear.length > 0) {
            await this.reservasRepository.save(reservasACrear);
            console.log(`✅ Generadas ${reservasACrear.length} reservas desde recurrente #${recurrente.idReservaRecurrente}`);
        }
    }

    // ✅ NUEVO: Listar reservas recurrentes de un usuario
    async findRecurrentesByUsuario(idUsuario: number): Promise<ReservaRecurrente[]> {
        return await this.reservasRecurrentesRepository.find({
            where: { idUsuario, activa: true },
            relations: ['cancha'],
            order: { diaSemana: 'ASC', horaInicio: 'ASC' },
        });
    }

    // ✅ NUEVO: Cancelar reserva recurrente
    async cancelRecurrente(id: number, idUsuario: number): Promise<ReservaRecurrente> {
        const recurrente = await this.reservasRecurrentesRepository.findOne({
            where: { idReservaRecurrente: id },
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