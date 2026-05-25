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
import { CanchasService } from './canchas.service';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from '../clubes/entities/club.entity';

@Controller('canchas')
export class CanchasController {
    constructor(private readonly canchasService: CanchasService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() createCanchaDto: CreateCanchaDto, @CurrentClub() club: Club) {
        return this.canchasService.create(createCanchaDto, club.idClub);
    }

    // Todos pueden ver las canchas de su club
    @Get()
    findAll(@CurrentClub() club: Club) {
        return this.canchasService.findAll(club.idClub);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentClub() club: Club) {
        return this.canchasService.findOne(+id, club.idClub);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateCanchaDto: UpdateCanchaDto,
        @CurrentClub() club: Club,
    ) {
        return this.canchasService.update(+id, updateCanchaDto, club.idClub);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string, @CurrentClub() club: Club) {
        return this.canchasService.remove(+id, club.idClub);
    }
}