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
    DOMINGO = 0,
    LUNES = 1,
    MARTES = 2,
    MIERCOLES = 3,
    JUEVES = 4,
    VIERNES = 5,
    SABADO = 6,
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
        comment: '0=Domingo, 1=Lunes, 2=Martes, etc.'
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