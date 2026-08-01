import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Club } from '../../clubes/entities/club.entity';

export enum DiaSemana {
    DOMINGO = 0,
    LUNES = 1,
    MARTES = 2,
    MIERCOLES = 3,
    JUEVES = 4,
    VIERNES = 5,
    SABADO = 6,
}

@Entity('horarios_club')
@Unique(['idClub', 'diaSemana']) // un solo rango horario por club y día
export class HorarioClub {
    @PrimaryGeneratedColumn()
    idHorarioClub: number;

    @Column()
    idClub: number;

    @ManyToOne(() => Club)
    @JoinColumn({ name: 'idClub' })
    club: Club;

    @Column({ type: 'int' })
    diaSemana: DiaSemana;

    @Column({ type: 'time' })
    horaInicio: string;

    @Column({ type: 'time' })
    horaFin: string;

    @Column({ default: 90 })
    duracionTurno: number;

    @Column({ default: true })
    activo: boolean; // false = ese día el club no atiende

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;
}