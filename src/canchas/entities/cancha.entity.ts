import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Club } from '../../clubes/entities/club.entity';

@Entity('canchas')
export class Cancha {
    @PrimaryGeneratedColumn()
    idCancha: number;

    @Column()
    idClub: number;

    @ManyToOne(() => Club, (club) => club.canchas)
    @JoinColumn({ name: 'idClub' })
    club: Club;

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