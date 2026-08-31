import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format, eachDayOfInterval, parseISO, subDays } from 'date-fns';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Cancha } from '../canchas/entities/cancha.entity';
import { HorarioClub } from '../horarios-club/entities/horario-club.entity';

interface RangoFechas {
    desde: string; // YYYY-MM-DD
    hasta: string; // YYYY-MM-DD
}

// Estados que efectivamente "ocupan" una cancha (para ocupación y horarios pico)
const ESTADOS_OCUPAN_CANCHA = ['confirmada', 'completada'];

const NOMBRES_DIAS = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];

@Injectable()
export class ReportesService {
    constructor(
        @InjectRepository(Reserva)
        private reservasRepository: Repository<Reserva>,
        @InjectRepository(Cancha)
        private canchasRepository: Repository<Cancha>,
        @InjectRepository(HorarioClub)
        private horariosClubRepository: Repository<HorarioClub>,
    ) { }

    // Si no vienen fechas, default: últimos 30 días (incluye hoy)
    private resolverRango(desde?: string, hasta?: string): RangoFechas {
        const hoy = new Date();
        const hastaFinal = hasta || format(hoy, 'yyyy-MM-dd');
        const desdeFinal = desde || format(subDays(hoy, 29), 'yyyy-MM-dd');
        return { desde: desdeFinal, hasta: hastaFinal };
    }

    private minutosEntre(horaInicio: string, horaFin: string): number {
        const [hI, mI] = horaInicio.split(':').map(Number);
        const [hF, mF] = horaFin.split(':').map(Number);
        return (hF * 60 + mF) - (hI * 60 + mI);
    }

    // Calcula cuántos "slots" de turno estuvieron disponibles en el club durante el rango,
    // en base a horarios_club (por día de semana) y la cantidad de canchas activas.
    private async calcularSlotsDisponibles(idClub: number, desde: string, hasta: string) {
        const [horariosClub, canchasActivas] = await Promise.all([
            this.horariosClubRepository.find({ where: { idClub, activo: true } }),
            this.canchasRepository.count({ where: { idClub, activa: true } }),
        ]);

        const horariosPorDia = new Map<number, HorarioClub>();
        horariosClub.forEach((h) => horariosPorDia.set(h.diaSemana, h));

        const dias = eachDayOfInterval({ start: parseISO(desde), end: parseISO(hasta) });

        let totalSlots = 0;
        const slotsPorDia: { fecha: string; slots: number }[] = [];

        for (const dia of dias) {
            const diaSemana = dia.getDay(); // 0 = domingo, igual que el enum DiaSemana
            const horario = horariosPorDia.get(diaSemana);
            let slotsDelDia = 0;

            if (horario && canchasActivas > 0 && horario.duracionTurno > 0) {
                const minutos = this.minutosEntre(horario.horaInicio, horario.horaFin);
                const turnosPorCancha = Math.floor(minutos / horario.duracionTurno);
                slotsDelDia = Math.max(turnosPorCancha, 0) * canchasActivas;
            }

            totalSlots += slotsDelDia;
            slotsPorDia.push({ fecha: format(dia, 'yyyy-MM-dd'), slots: slotsDelDia });
        }

        return { totalSlots, slotsPorDia, canchasActivas };
    }

    // ============================
    // RESUMEN (dashboard combinado)
    // ============================
    async getResumen(idClub: number, desdeInput?: string, hastaInput?: string) {
        const { desde, hasta } = this.resolverRango(desdeInput, hastaInput);

        const [ocupacion, ingresos, cancelaciones] = await Promise.all([
            this.getOcupacion(idClub, desde, hasta),
            this.getIngresos(idClub, desde, hasta),
            this.getCancelaciones(idClub, desde, hasta),
        ]);

        return {
            rango: { desde, hasta },
            totalReservas: ocupacion.totalReservas,
            ocupacionPromedio: ocupacion.ocupacionPromedio,
            ingresosTotales: ingresos.ingresosTotales,
            ticketPromedio: ingresos.ticketPromedio,
            tasaCancelacion: cancelaciones.tasaCancelacion,
        };
    }

    // ============================
    // OCUPACIÓN
    // ============================
    async getOcupacion(idClub: number, desdeInput?: string, hastaInput?: string) {
        const { desde, hasta } = this.resolverRango(desdeInput, hastaInput);

        const { totalSlots, slotsPorDia, canchasActivas } =
            await this.calcularSlotsDisponibles(idClub, desde, hasta);

        const reservas = await this.reservasRepository
            .createQueryBuilder('reserva')
            .leftJoin('reserva.cancha', 'cancha')
            .select('reserva.fechaReserva', 'fecha')
            .addSelect('reserva.idCancha', 'idCancha')
            .addSelect('cancha.numero', 'numeroCancha')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('reserva.estado IN (:...estados)', { estados: ESTADOS_OCUPAN_CANCHA })
            .getRawMany();

        const totalReservas = reservas.length;
        const ocupacionPromedio = totalSlots > 0
            ? Number(((totalReservas / totalSlots) * 100).toFixed(1))
            : 0;

        // Ocupación día por día
        const reservasPorFecha = new Map<string, number>();
        reservas.forEach((r) => {
            const fecha = format(new Date(r.fecha), 'yyyy-MM-dd');
            reservasPorFecha.set(fecha, (reservasPorFecha.get(fecha) || 0) + 1);
        });

        const ocupacionPorDia = slotsPorDia.map((d) => {
            const reservasDelDia = reservasPorFecha.get(d.fecha) || 0;
            return {
                fecha: d.fecha,
                reservas: reservasDelDia,
                slotsDisponibles: d.slots,
                ocupacionPct: d.slots > 0
                    ? Number(((reservasDelDia / d.slots) * 100).toFixed(1))
                    : 0,
            };
        });

        // Ocupación por cancha (reparte el total de slots en partes iguales entre canchas activas)
        const reservasPorCancha = new Map<number, { numero: string; reservas: number }>();
        reservas.forEach((r) => {
            const actual = reservasPorCancha.get(r.idCancha) || { numero: r.numeroCancha, reservas: 0 };
            actual.reservas += 1;
            reservasPorCancha.set(r.idCancha, actual);
        });

        const slotsPorCancha = canchasActivas > 0 ? totalSlots / canchasActivas : 0;
        const ocupacionPorCancha = Array.from(reservasPorCancha.entries())
            .map(([idCancha, data]) => ({
                idCancha,
                numero: data.numero,
                reservas: data.reservas,
                ocupacionPct: slotsPorCancha > 0
                    ? Number(((data.reservas / slotsPorCancha) * 100).toFixed(1))
                    : 0,
            }))
            .sort((a, b) => b.reservas - a.reservas);

        return {
            rango: { desde, hasta },
            totalReservas,
            totalSlots,
            ocupacionPromedio,
            ocupacionPorDia,
            ocupacionPorCancha,
        };
    }

    // ============================
    // INGRESOS / FACTURACIÓN
    // ============================
    async getIngresos(idClub: number, desdeInput?: string, hastaInput?: string) {
        const { desde, hasta } = this.resolverRango(desdeInput, hastaInput);

        const baseQuery = () => this.reservasRepository
            .createQueryBuilder('reserva')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('reserva.estadoPago = :estadoPago', { estadoPago: 'pagado' });

        const totalRow = await baseQuery()
            .select('COALESCE(SUM(reserva.montoPagado), 0)', 'total')
            .addSelect('COUNT(*)', 'cantidad')
            .getRawOne();

        const ingresosTotales = Number(totalRow.total);
        const cantidadPagos = Number(totalRow.cantidad);
        const ticketPromedio = cantidadPagos > 0
            ? Number((ingresosTotales / cantidadPagos).toFixed(2))
            : 0;

        const porDia = await baseQuery()
            .select('reserva.fechaReserva', 'fecha')
            .addSelect('SUM(reserva.montoPagado)', 'total')
            .groupBy('reserva.fechaReserva')
            .orderBy('reserva.fechaReserva', 'ASC')
            .getRawMany();

        const porCancha = await baseQuery()
            .leftJoin('reserva.cancha', 'cancha')
            .select('reserva.idCancha', 'idCancha')
            .addSelect('cancha.numero', 'numeroCancha')
            .addSelect('SUM(reserva.montoPagado)', 'total')
            .addSelect('COUNT(*)', 'cantidad')
            .groupBy('reserva.idCancha')
            .addGroupBy('cancha.numero')
            .orderBy('total', 'DESC')
            .getRawMany();

        const porMetodo = await baseQuery()
            .select('reserva.metodoPago', 'metodo')
            .addSelect('SUM(reserva.montoPagado)', 'total')
            .addSelect('COUNT(*)', 'cantidad')
            .groupBy('reserva.metodoPago')
            .getRawMany();

        return {
            rango: { desde, hasta },
            ingresosTotales,
            ticketPromedio,
            ingresosPorDia: porDia.map((r) => ({
                fecha: format(new Date(r.fecha), 'yyyy-MM-dd'),
                total: Number(r.total),
            })),
            ingresosPorCancha: porCancha.map((r) => ({
                idCancha: r.idCancha,
                numero: r.numeroCancha,
                total: Number(r.total),
                cantidad: Number(r.cantidad),
            })),
            ingresosPorMetodo: porMetodo.map((r) => ({
                metodo: r.metodo || 'sin_especificar',
                total: Number(r.total),
                cantidad: Number(r.cantidad),
            })),
        };
    }

    // ============================
    // HORARIOS PICO
    // ============================
    async getHorariosPico(idClub: number, desdeInput?: string, hastaInput?: string) {
        const { desde, hasta } = this.resolverRango(desdeInput, hastaInput);

        const porHorarioRaw = await this.reservasRepository
            .createQueryBuilder('reserva')
            .select('reserva.horaInicio', 'horaInicio')
            .addSelect('COUNT(*)', 'cantidad')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('reserva.estado IN (:...estados)', { estados: ESTADOS_OCUPAN_CANCHA })
            .groupBy('reserva.horaInicio')
            .orderBy('reserva.horaInicio', 'ASC')
            .getRawMany();

        const porHorario = porHorarioRaw.map((r) => ({
            horaInicio: r.horaInicio,
            cantidad: Number(r.cantidad),
        }));

        // DAYOFWEEK de MySQL: 1=domingo ... 7=sábado. Restamos 1 para alinear con el enum DiaSemana (0=domingo).
        const porDiaSemanaRaw = await this.reservasRepository
            .createQueryBuilder('reserva')
            .select('DAYOFWEEK(reserva.fechaReserva)', 'diaSemana')
            .addSelect('COUNT(*)', 'cantidad')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('reserva.estado IN (:...estados)', { estados: ESTADOS_OCUPAN_CANCHA })
            .groupBy('diaSemana')
            .orderBy('diaSemana', 'ASC')
            .getRawMany();

        return {
            rango: { desde, hasta },
            porHorario,
            horarioMasPopular: porHorario.length
                ? porHorario.reduce((max, actual) => (actual.cantidad > max.cantidad ? actual : max))
                : null,
            porDiaSemana: porDiaSemanaRaw.map((r) => {
                const diaSemana = Number(r.diaSemana) - 1;
                return {
                    diaSemana,
                    nombre: NOMBRES_DIAS[diaSemana],
                    cantidad: Number(r.cantidad),
                };
            }),
        };
    }

    // ============================
    // CANCELACIONES
    // ============================
    async getCancelaciones(idClub: number, desdeInput?: string, hastaInput?: string) {
        const { desde, hasta } = this.resolverRango(desdeInput, hastaInput);

        const baseQuery = () => this.reservasRepository
            .createQueryBuilder('reserva')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta });

        const [totalCreadas, canceladas, noShow] = await Promise.all([
            baseQuery().getCount(),
            baseQuery().andWhere('reserva.estado = :estado', { estado: 'cancelada' }).getCount(),
            baseQuery().andWhere('reserva.estado = :estado', { estado: 'no_show' }).getCount(),
        ]);

        const tasaCancelacion = totalCreadas > 0
            ? Number(((canceladas / totalCreadas) * 100).toFixed(1))
            : 0;

        const canceladasPorDiaRaw = await this.reservasRepository
            .createQueryBuilder('reserva')
            .select('reserva.fechaReserva', 'fecha')
            .addSelect('COUNT(*)', 'cantidad')
            .where('reserva.idClub = :idClub', { idClub })
            .andWhere('reserva.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('reserva.estado = :estado', { estado: 'cancelada' })
            .groupBy('reserva.fechaReserva')
            .orderBy('reserva.fechaReserva', 'ASC')
            .getRawMany();

        return {
            rango: { desde, hasta },
            totalCreadas,
            canceladas,
            noShow,
            tasaCancelacion,
            canceladasPorDia: canceladasPorDiaRaw.map((r) => ({
                fecha: format(new Date(r.fecha), 'yyyy-MM-dd'),
                cantidad: Number(r.cantidad),
            })),
        };
    }
}