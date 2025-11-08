import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('horarios')
export class HorariosController {
    constructor(private readonly horariosService: HorariosService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createHorarioDto: CreateHorarioDto) {
        return this.horariosService.create(createHorarioDto);
    }

    @Post('generar-default')
    @UseGuards(JwtAuthGuard)
    generarDefault() {
        return this.horariosService.generarHorariosDefault();
    }

    @Get()
    findAll() {
        return this.horariosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.horariosService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateHorarioDto: UpdateHorarioDto) {
        return this.horariosService.update(+id, updateHorarioDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.horariosService.remove(+id);
    }
}