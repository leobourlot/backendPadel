import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cancha } from '../../canchas/entities/cancha.entity';
import { Reserva } from '../../reservas/entities/reserva.entity';

@Entity('clubs')
export class Club {
    @PrimaryGeneratedColumn()
    idClub: number;

    @Column({ unique: true, length: 100 })
    slug: string; // "clubdelrio" → usado en el subdominio

    @Column({ length: 150 })
    nombre: string;

    @Column({ length: 100, nullable: true })
    emailContacto: string;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ default: false })
    pagado: boolean;

    @Column({ type: 'date', nullable: true })
    fechaInicioPrueba: Date;

    @Column({ type: 'date', nullable: true })
    fechaFinPrueba: Date;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    @OneToMany(() => Usuario, (usuario) => usuario.club)
    usuarios: Usuario[];

    @OneToMany(() => Cancha, (cancha) => cancha.club)
    canchas: Cancha[];

    @OneToMany(() => Reserva, (reserva) => reserva.club)
    reservas: Reserva[];
}