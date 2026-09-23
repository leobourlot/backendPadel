import type { Response } from 'express';
import { Controller, Post, Body, Query, UseGuards, Req, Res, Get, Delete } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreateReservaDto } from '../reservas/dto/create-reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
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

    // ✅ NUEVO — solo el admin del club puede iniciar la conexión
    @Get('mp/conectar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    conectarMP(@CurrentClub() club: Club) {
        return this.pagosService.generarUrlConexionMP(club);
    }

    // ✅ NUEVO — pública: la llama el navegador al volver de Mercado Pago (no hay token de sesión ni club por subdominio acá)
    @Get('mp/callback')
    async callbackMP(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        const destino = await this.pagosService.procesarCallbackMP(code, state);
        return res.redirect(destino);
    }

    // ✅ NUEVO
    @Get('mp/estado')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    estadoMP(@CurrentClub() club: Club) {
        return this.pagosService.estadoConexionMP(club);
    }

    // ✅ NUEVO
    @Delete('mp/desconectar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    desconectarMP(@CurrentClub() club: Club) {
        return this.pagosService.desconectarMP(club.idClub);
    }
}