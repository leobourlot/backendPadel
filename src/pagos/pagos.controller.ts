import { Controller, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreateReservaDto } from '../reservas/dto/create-reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';

@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post('crear-preferencia')
    @UseGuards(JwtAuthGuard)
    crearPreferencia(
        @Body() dto: CreateReservaDto,
        @CurrentUser() user: any,
        @CurrentClub() club: Club,
    ) {
        return this.pagosService.crearPreferencia(dto, user.idUsuario, club);
    }

    // Pública: la llama MercadoPago, no el usuario
    @Post('webhook')
    webhook(@Query() query: any, @Body() body: any) {
        return this.pagosService.webhook(query, body);
    }
}