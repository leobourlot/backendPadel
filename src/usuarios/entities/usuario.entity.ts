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
import { Exclude } from 'class-transformer';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Club } from '../../clubes/entities/club.entity';

export enum UserRole {
    JUGADOR = 'jugador',
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin', // ← Vos, el dueño del SaaS
}

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    idUsuario: number;

    // null solo para SUPERADMIN (no pertenece a ningún club)
    @Column({ nullable: true })
    idClub: number;

    @ManyToOne(() => Club, (club) => club.usuarios, { nullable: true })
    @JoinColumn({ name: 'idClub' })
    club: Club;

    @Column({ unique: true, length: 20 })
    dni: string;

    @Column({ unique: true, length: 100 })
    email: string;

    @Column({ length: 100 })
    nombre: string;

    @Column({ length: 100 })
    apellido: string;

    @Column({ length: 20 })
    telefono: string;

    @Column()
    @Exclude()
    clave: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.JUGADOR,
    })
    rol: UserRole;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    @OneToMany(() => Reserva, (reserva) => reserva.usuario)
    reservas: Reserva[];
}