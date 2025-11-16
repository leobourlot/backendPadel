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

export enum DiaSemana {
    LUNES = 0,
    MARTES = 1,
    MIERCOLES = 2,
    JUEVES = 3,
    VIERNES = 4,
    SABADO = 5,
    DOMINGO = 6,
}

@Entity('reservas_recurrentes')
export class ReservaRecurrente {
    @PrimaryGeneratedColumn()
    idReservaRecurrente: number;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'idUsuario' })
    usuario: Usuario;

    @Column()
    idUsuario: number;

    @ManyToOne(() => Cancha)
    @JoinColumn({ name: 'idCancha' })
    cancha: Cancha;

    @Column()
    idCancha: number;

    @Column({
        type: 'int',
        comment: '0=Lunes, 1=Martes, 2=Miercoles, etc.'
    })
    diaSemana: DiaSemana;

    @Column({ type: 'time' })
    horaInicio: string;

    @Column({ type: 'time' })
    horaFin: string;

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date', nullable: true })
    fechaFin: Date; // null = indefinido

    @Column({ default: true })
    activa: boolean;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;
}