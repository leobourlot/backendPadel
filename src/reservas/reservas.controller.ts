import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
    constructor(private readonly reservasService: ReservasService) { }

    @Post()
    create(@Body() createReservaDto: CreateReservaDto, @CurrentUser() user: any) {
        return this.reservasService.create({
            ...createReservaDto,
            idUsuario: user.idUsuario,
        });
    }

    @Get()
    findAll() {
        return this.reservasService.findAll();
    }

    @Get('mis-reservas')
    findMyReservas(@CurrentUser() user: any) {
        return this.reservasService.findByUsuario(user.idUsuario);
    }

    @Get('cancha/:idCancha')
    findByCancha(
        @Param('idCancha') idCancha: string,
        @Query('fecha') fecha: string,
    ) {
        return this.reservasService.findByCancha(+idCancha, new Date(fecha));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reservasService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto) {
        return this.reservasService.update(+id, updateReservaDto);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.reservasService.cancel(+id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.reservasService.remove(+id);
    }
}