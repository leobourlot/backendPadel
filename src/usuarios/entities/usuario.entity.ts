import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Reserva } from '../../reservas/entities/reserva.entity';

export enum UserRole {
    JUGADOR = 'jugador',
    ADMIN = 'admin',
}

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    idUsuario: number;

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
        default: UserRole.JUGADOR, // ← Por defecto jugador
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