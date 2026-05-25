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
}