import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cancha } from './entities/cancha.entity';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';

@Injectable()
export class CanchasService {
    constructor(
        @InjectRepository(Cancha)
        private canchasRepository: Repository<Cancha>,
    ) { }

    async create(createCanchaDto: CreateCanchaDto, idClub: number): Promise<Cancha> {
        const cancha = this.canchasRepository.create({
            ...createCanchaDto,
            idClub,
        });
        return await this.canchasRepository.save(cancha);
    }

    async findAll(idClub: number): Promise<Cancha[]> {
        return await this.canchasRepository.find({
            where: { activa: true, idClub },
            order: { numero: 'ASC' },
        });
    }

    async findOne(id: number, idClub: number): Promise<Cancha> {
        const cancha = await this.canchasRepository.findOne({
            where: { idCancha: id, idClub },
        });
        if (!cancha) {
            throw new NotFoundException(`Cancha con ID ${id} no encontrada`);
        }
        return cancha;
    }

    async update(id: number, updateCanchaDto: UpdateCanchaDto, idClub: number): Promise<Cancha> {
        const cancha = await this.findOne(id, idClub);
        Object.assign(cancha, updateCanchaDto);
        return await this.canchasRepository.save(cancha);
    }

    async remove(id: number, idClub: number): Promise<void> {
        const cancha = await this.findOne(id, idClub);
        cancha.activa = false;
        await this.canchasRepository.save(cancha);
    }
}