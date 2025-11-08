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

    async create(createCanchaDto: CreateCanchaDto): Promise<Cancha> {
        const cancha = this.canchasRepository.create(createCanchaDto);
        return await this.canchasRepository.save(cancha);
    }

    async findAll(): Promise<Cancha[]> {
        return await this.canchasRepository.find({
            where: { activa: true },
            order: { numero: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Cancha> {
        const cancha = await this.canchasRepository.findOne({
            where: { idCancha: id },
        });
        if (!cancha) {
            throw new NotFoundException(`Cancha con ID ${id} no encontrada`);
        }
        return cancha;
    }

    async update(id: number, updateCanchaDto: UpdateCanchaDto): Promise<Cancha> {
        const cancha = await this.findOne(id);
        Object.assign(cancha, updateCanchaDto);
        return await this.canchasRepository.save(cancha);
    }

    async remove(id: number): Promise<void> {
        const cancha = await this.findOne(id);
        cancha.activa = false;
        await this.canchasRepository.save(cancha);
    }
}
