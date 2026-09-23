import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Club } from '../clubes/entities/club.entity';
import { ReservasService } from '../reservas/reservas.service';
import { CreateReservaDto } from '../reservas/dto/create-reserva.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PagosService {
    constructor(
        @InjectRepository(Reserva) private reservasRepository: Repository<Reserva>,
        @InjectRepository(Club) private clubesRepository: Repository<Club>,
        private reservasService: ReservasService,
        private jwtService: JwtService, // ✅ NUEVO
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

        const dominioBase = process.env.DOMINIO_BASE; // ej: bourderweb.com.ar
        const frontendUrlDelClub = `https://${club.slug}.${dominioBase}`;
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
                    success: `${frontendUrlDelClub}/mis-reservas?pago=exitoso`,
                    failure: `${frontendUrlDelClub}/reservas?pago=fallido`,
                    pending: `${frontendUrlDelClub}/mis-reservas?pago=pendiente`,
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
            // console.log('🔍 Cancelación - ahora:', ahora, '| límite:', limiteDevolucion, '| aplica reembolso:', ahora <= limiteDevolucion);


            if (ahora <= limiteDevolucion) {
                // Se cancela con más de 1 día de anticipación → reembolso
                const club = await this.clubesRepository.findOne({ where: { idClub } });
                if (club?.mercadopagoAccessToken && reserva.idPagoMercadoPago) {
                    try {
                        // console.log('💰 Intentando reembolso de payment_id:', reserva.idPagoMercadoPago);
                        const mpClient = new MercadoPagoConfig({ accessToken: club.mercadopagoAccessToken });
                        const refundClient = new PaymentRefund(mpClient);
                        const resultado = await refundClient.create({ payment_id: Number(reserva.idPagoMercadoPago) });
                        // console.log('✅ Reembolso creado:', resultado);
                    } catch (error) {
                        console.error('❌ Error al reembolsar en MercadoPago:', error);
                        throw new BadRequestException('No se pudo procesar el reembolso. Contactá al club.');
                    }
                } else {
                    console.warn('⚠️ No se pudo reembolsar: falta accessToken o idPagoMercadoPago', {
                        tieneToken: !!club?.mercadopagoAccessToken,
                        idPago: reserva.idPagoMercadoPago,
                    });
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

    // Genera la URL de autorización de MP para que el admin conecte su cuenta
    async generarUrlConexionMP(club: Club): Promise<{ url: string }> {
        const state = this.jwtService.sign({ idClub: club.idClub }, { expiresIn: '10m' });
        const redirectUri = `${process.env.BACKEND_URL}/pagos/mp/callback`;

        const url =
            `https://auth.mercadopago.com/authorization` +
            `?client_id=${process.env.MP_CLIENT_ID}` +
            `&response_type=code` +
            `&platform_id=mp` +
            `&state=${state}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}`;

        return { url };
    }

    // Procesa el regreso de MP con el code, y devuelve la URL a la que redirigir el navegador
    async procesarCallbackMP(code: string, state: string): Promise<string> {
        let payload: { idClub: number };
        try {
            payload = this.jwtService.verify(state);
        } catch {
            return `${process.env.BACKEND_URL}?mp=error_state`; // state inválido o vencido (>10 min)
        }

        const club = await this.clubesRepository.findOne({ where: { idClub: payload.idClub } });
        if (!club) return `${process.env.BACKEND_URL}?mp=error_club`;

        const frontendUrl = `https://${club.slug}.${process.env.DOMINIO_BASE}/admin/mercadopago`;
        const redirectUri = `${process.env.BACKEND_URL}/pagos/mp/callback`;

        try {
            const resp = await fetch('https://api.mercadopago.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_secret: process.env.MP_CLIENT_SECRET,
                    client_id: process.env.MP_CLIENT_ID,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                }),
            });
            const data = await resp.json();

            if (!resp.ok || !data.access_token) {
                console.error('❌ Error canjeando code de MP:', data);
                return `${frontendUrl}?mp=error`;
            }

            club.mercadopagoAccessToken = data.access_token;   // TODO: encriptar (próxima etapa)
            club.mercadopagoRefreshToken = data.refresh_token; // TODO: encriptar
            club.mercadopagoUserId = String(data.user_id);
            club.mercadopagoTokenExpira = new Date(Date.now() + data.expires_in * 1000);
            club.mercadopagoHabilitado = true;
            await this.clubesRepository.save(club);

            return `${frontendUrl}?mp=conectado`;
        } catch (error) {
            console.error('❌ Error en callback OAuth de MP:', error);
            return `${frontendUrl}?mp=error`;
        }
    }

    async estadoConexionMP(club: Club) {
        return {
            conectado: !!club.mercadopagoAccessToken && club.mercadopagoHabilitado,
            mercadopagoUserId: club.mercadopagoUserId || null,
            expiraEl: club.mercadopagoTokenExpira || null,
        };
    }

    async desconectarMP(idClub: number) {
        const club = await this.clubesRepository.findOne({ where: { idClub } });
        if (!club) return { desconectado: false };

        club.mercadopagoAccessToken = null;
        club.mercadopagoRefreshToken = null;
        club.mercadopagoUserId = null;
        club.mercadopagoTokenExpira = null;
        club.mercadopagoHabilitado = false;
        await this.clubesRepository.save(club);

        return { desconectado: true };
    }
}