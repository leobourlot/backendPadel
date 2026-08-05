import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cancha } from '../../canchas/entities/cancha.entity';
import { Club } from '../../clubes/entities/club.entity';

@Entity('reservas')
export class Reserva {
    @PrimaryGeneratedColumn()
    idReserva: number;

    @Column()
    idClub: number;

    @ManyToOne(() => Club, (club) => club.reservas)
    @JoinColumn({ name: 'idClub' })
    club: Club;

    @ManyToOne(() => Usuario, (usuario) => usuario.reservas)
    @JoinColumn({ name: 'idUsuario' })
    usuario: Usuario;

    @Column()
    idUsuario: number;

    @ManyToOne(() => Cancha, (cancha) => cancha.reservas)
    @JoinColumn({ name: 'idCancha' })
    cancha: Cancha;

    @Column()
    idCancha: number;

    @Column({ type: 'date' })
    fechaReserva: Date;

    @Column({ type: 'time' })
    horaInicio: string;

    @Column({ type: 'time' })
    horaFin: string;

    @Column({ length: 50, default: 'confirmada' })
    estado: string;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    @Column({ length: 20, default: 'no_aplica' })
    estadoPago: string; // no_aplica | pendiente | pagado | reembolsado

    @Column({ length: 100, nullable: true })
    idPagoMercadoPago: string; // id del payment de MP

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    montoPagado: number;

    @Column({ length: 20, nullable: true })
    metodoPago: string; // mercadopago | presencial
}