import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Club } from '../clubes/entities/club.entity';
import { ReservasService } from '../reservas/reservas.service';
import { CreateReservaDto } from '../reservas/dto/create-reserva.dto';

@Injectable()
export class PagosService {
    constructor(
        @InjectRepository(Reserva) private reservasRepository: Repository<Reserva>,
        @InjectRepository(Club) private clubesRepository: Repository<Club>,
        private reservasService: ReservasService,
    ) { }

    async crearPreferencia(dto: CreateReservaDto, idUsuario: number, club: Club) {
        if (!club.mercadopagoHabilitado || !club.mercadopagoAccessToken) {
            throw new BadRequestException('Este club no tiene habilitado el pago con MercadoPago');
        }
        if (!club.precioReserva) {
            throw new BadRequestException('El club no configuró un precio para la seña');
        }

        // Crea la reserva (retiene el horario) en estado pendiente de pago
        const reserva = await this.reservasService.create(
            { ...dto, idUsuario },
            club.idClub,
        );
        reserva.estadoPago = 'pendiente';
        reserva.metodoPago = 'mercadopago';
        await this.reservasRepository.save(reserva);

        const mpClient = new MercadoPagoConfig({ accessToken: club.mercadopagoAccessToken });
        const preference = new Preference(mpClient);

        const frontendUrl = process.env.FRONTEND_URL;
        const backendUrl = process.env.BACKEND_URL;

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: String(reserva.idReserva),
                        title: `Seña reserva - ${club.nombre}`,
                        quantity: 1,
                        unit_price: Number(club.precioReserva),
                        currency_id: 'ARS',
                    },
                ],
                external_reference: String(reserva.idReserva),
                notification_url: `${backendUrl}/pagos/webhook?idReserva=${reserva.idReserva}`,
                back_urls: {
                    success: `${frontendUrl}/mis-reservas?pago=exitoso`,
                    failure: `${frontendUrl}/reservas?pago=fallido`,
                    pending: `${frontendUrl}/mis-reservas?pago=pendiente`,
                },
                auto_return: 'approved',
            },
        });

        reserva.idPagoMercadoPago = result.id; // guardamos el id de la preferencia
        await this.reservasRepository.save(reserva);

        return { initPoint: result.init_point, idReserva: reserva.idReserva };
    }

    async webhook(query: any, body: any) {
        const idReserva = Number(query.idReserva);
        const paymentId = query['data.id'] || body?.data?.id;
        const type = query.type || body?.type;

        if (!idReserva || type !== 'payment' || !paymentId) {
            return { received: true };
        }

        const reserva = await this.reservasRepository.findOne({ where: { idReserva } });
        if (!reserva) return { received: true };

        const club = await this.clubesRepository.findOne({ where: { idClub: reserva.idClub } });
        if (!club?.mercadopagoAccessToken) return { received: true };

        const mpClient = new MercadoPagoConfig({ accessToken: club.mercadopagoAccessToken });
        const paymentClient = new Payment(mpClient);
        const pago = await paymentClient.get({ id: paymentId });

        if (pago.status === 'approved') {
            reserva.estadoPago = 'pagado';
            reserva.estado = 'confirmada';
            reserva.montoPagado = pago.transaction_amount;
            reserva.idPagoMercadoPago = String(pago.id); // reemplazamos por el id real del pago
            await this.reservasRepository.save(reserva);
        } else if (['rejected', 'cancelled'].includes(pago.status)) {
            reserva.estadoPago = 'no_aplica';
            reserva.estado = 'cancelada';
            await this.reservasRepository.save(reserva);
        }

        return { received: true };
    }

    // Cancelación con política de devolución
    async cancelarConPolitica(idReserva: number, idClub: number): Promise<Reserva> {
        const reserva = await this.reservasService.findOne(idReserva, idClub);

        if (reserva.estadoPago === 'pagado') {
            const ahora = new Date();
            const fechaHoraReserva = new Date(`${reserva.fechaReserva}T${reserva.horaInicio}`);
            const limiteDevolucion = new Date(fechaHoraReserva.getTime() - 24 * 60 * 60 * 1000);

            if (ahora <= limiteDevolucion) {
                // Se cancela con más de 1 día de anticipación → reembolso
                const club = await this.clubesRepository.findOne({ where: { idClub } });
                if (club?.mercadopagoAccessToken && reserva.idPagoMercadoPago) {
                    const mpClient = new MercadoPagoConfig({ accessToken: club.mercadopagoAccessToken });
                    const refundClient = new PaymentRefund(mpClient);
                    await refundClient.create({ payment_id: Number(reserva.idPagoMercadoPago) });
                }
                reserva.estadoPago = 'reembolsado';
            }
            // si cancela el mismo día, no tocamos estadoPago: queda 'pagado' → seña perdida
        }

        reserva.estado = 'cancelada';
        return await this.reservasRepository.save(reserva);
    }

    // Para marcar "no se presentó" y aplicar la misma pérdida de seña
    async marcarNoShow(idReserva: number, idClub: number): Promise<Reserva> {
        const reserva = await this.reservasService.findOne(idReserva, idClub);
        reserva.estado = 'no_show';
        // estadoPago se mantiene 'pagado' → seña perdida, no hay reembolso
        return await this.reservasRepository.save(reserva);
    }
}