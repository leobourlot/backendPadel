import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';

@Entity('canchas')
export class Cancha {
    @PrimaryGeneratedColumn()
    idCancha: number;

    @Column({ length: 10 })
    numero: string;

    @Column({ length: 50 })
    tipo: string; // indoor, outdoor

    @Column('text', { nullable: true })
    descripcion: string;

    @Column({ default: true })
    activa: boolean;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    @OneToMany(() => Reserva, (reserva) => reserva.cancha)
    reservas: Reserva[];
}