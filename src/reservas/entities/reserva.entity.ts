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

@Entity('reservas')
export class Reserva {
    @PrimaryGeneratedColumn()
    idReserva: number;

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
    estado: string; // confirmada, cancelada, completada

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;
}