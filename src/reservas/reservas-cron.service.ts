import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ReservaRecurrente } from './entities/reserva-recurrente.entity';
import { Reserva } from './entities/reserva.entity';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class ReservasCronService {
    private readonly logger = new Logger(ReservasCronService.name);

    constructor(
        @InjectRepository(ReservaRecurrente)
        private reservasRecurrentesRepository: Repository<ReservaRecurrente>,
        @InjectRepository(Reserva)
        private reservasRepository: Repository<Reserva>,
    ) { }

    // ✅ Ejecutar cada día a las 2:00 AM
    @Cron('0 2 * * *', {
        name: 'regenerar-reservas-recurrentes',
        timeZone: 'America/Argentina/Buenos_Aires', // ← Tu zona horaria
    })


    async regenerarReservasRecurrentes() {
        this.logger.log('🔄 Iniciando regeneración de reservas recurrentes...');

        try {
            // Obtener todas las reservas recurrentes activas
            const recurrentes = await this.reservasRecurrentesRepository.find({
                where: { activa: true },
                relations: ['cancha', 'usuario'],
            });

            this.logger.log(`📋 Encontradas ${recurrentes.length} reservas recurrentes activas`);

            let totalCreadas = 0;
            let totalOmitidas = 0;

            for (const recurrente of recurrentes) {
                try {
                    const resultado = await this.generarReservasParaRecurrente(recurrente);
                    totalCreadas += resultado.creadas;
                    totalOmitidas += resultado.omitidas;
                } catch (error) {
                    this.logger.error(`❌ Error creando reserva: ${getErrorMessage(error)}`);

                }
            }

            this.logger.log(
                `✅ Proceso completado: ${totalCreadas} reservas creadas, ${totalOmitidas} omitidas`,
            );
        } catch (error) {
            this.logger.error(`❌ Error creando reserva: ${getErrorMessage(error)}`);
        }
    }

    // ✅ Generar reservas para una recurrente específica
    private async generarReservasParaRecurrente(
        recurrente: ReservaRecurrente,
    ): Promise<{ creadas: number; omitidas: number }> {
        const hoy = new Date();
        const semanasAGenerar = 4; // Siempre mantener 4 semanas adelante
        let creadas = 0;
        let omitidas = 0;

        this.logger.log(
            `🔍 Procesando recurrente #${recurrente.idReservaRecurrente} - Día ${recurrente.diaSemana} a las ${recurrente.horaInicio}`,
        );

        // Encontrar la próxima ocurrencia del día de la semana
        const fechaInicio = new Date(recurrente.fechaInicio);
        let fechaActual = new Date(hoy);

        // Ajustar al día de la semana correcto
        while (fechaActual.getDay() !== recurrente.diaSemana) {
            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        // Generar reservas para las próximas N semanas
        for (let semana = 0; semana < semanasAGenerar; semana++) {
            const fechaReserva = new Date(fechaActual);
            fechaReserva.setDate(fechaActual.getDate() + semana * 7);

            // Validar que esté dentro del rango de la recurrente
            if (fechaReserva < fechaInicio) {
                continue;
            }

            if (recurrente.fechaFin && fechaReserva > new Date(recurrente.fechaFin)) {
                this.logger.log(
                    `⏭️ Fecha ${fechaReserva.toISOString().split('T')[0]} supera fecha fin`,
                );
                break;
            }

            // Verificar si ya existe la reserva
            const yaExiste = await this.reservasRepository.findOne({
                where: {
                    idUsuario: recurrente.idUsuario,
                    idCancha: recurrente.idCancha,
                    idClub: recurrente.idClub,
                    fechaReserva: fechaReserva,
                    horaInicio: recurrente.horaInicio,
                    estado: 'confirmada',
                },
            });

            if (yaExiste) {
                this.logger.debug(
                    `⏭️ Ya existe reserva para ${fechaReserva.toISOString().split('T')[0]}`,
                );
                omitidas++;
                continue;
            }

            // Verificar disponibilidad
            const conflicto = await this.verificarDisponibilidad(
                recurrente.idCancha,
                fechaReserva,
                recurrente.horaInicio,
                recurrente.horaFin,
            );

            if (conflicto) {
                this.logger.warn(
                    `⚠️ Horario ocupado para ${fechaReserva.toISOString().split('T')[0]} - Omitiendo`,
                );
                omitidas++;
                continue;
            }

            // Crear la reserva
            try {
                const nuevaReserva = this.reservasRepository.create({
                    idUsuario: recurrente.idUsuario,
                    idCancha: recurrente.idCancha,
                    idClub: recurrente.idClub,
                    fechaReserva: fechaReserva,
                    horaInicio: recurrente.horaInicio,
                    horaFin: recurrente.horaFin,
                    estado: 'confirmada',
                });

                await this.reservasRepository.save(nuevaReserva);
                creadas++;

                this.logger.log(
                    `✅ Creada reserva para ${fechaReserva.toISOString().split('T')[0]} - Usuario #${recurrente.idUsuario}`,
                );
            } catch (error) {
                this.logger.error(`❌ Error creando reserva: ${getErrorMessage(error)}`);

                omitidas++;
            }
        }

        return { creadas, omitidas };
    }

    // ✅ Verificar disponibilidad de horario
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

    // ✅ Endpoint manual para testing (opcional)
    async regenerarManualmente(): Promise<{ message: string; stats: any }> {
        this.logger.log('🔧 Regeneración manual iniciada');
        await this.regenerarReservasRecurrentes();
        return {
            message: 'Regeneración completada',
            stats: {
                timestamp: new Date(),
            },
        };
    }

    // ✅ Limpiar reservas pasadas (ejecutar cada semana)
    @Cron('0 3 * * 0', {
        name: 'limpiar-reservas-pasadas',
        timeZone: 'America/Argentina/Buenos_Aires',
    })
    async limpiarReservasPasadas() {
        this.logger.log('🧹 Limpiando reservas pasadas...');

        try {
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);

            const resultado = await this.reservasRepository.update(
                {
                    fechaReserva: LessThan(hace30Dias),
                    estado: 'confirmada',
                },
                {
                    estado: 'completada',
                },
            );

            this.logger.log(
                `✅ Marcadas ${resultado.affected} reservas pasadas como completadas`,
            );
        } catch (error) {
            this.logger.error(`❌ Error creando reserva: ${getErrorMessage(error)}`);
        }
    }
}
