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
import { ClubesService } from './clubes.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CurrentClub } from '../common/decorators/current-club.decorator';
import { Club } from './entities/club.entity';
import { CreateClubConAdminDto } from './dto/create-club-con-admin.dto'; 


@Controller('clubes')
export class ClubesController {
    constructor(private readonly clubesService: ClubesService) { }

    // ✅ NUEVO: pública, devuelve los datos del club resuelto por el subdominio actual
    @Get('info')
    getInfo(@CurrentClub() club: Club) {
        return this.clubesService.getPublicInfo(club);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    create(@Body() createClubDto: CreateClubDto) {
        return this.clubesService.create(createClubDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    findAll() {
        return this.clubesService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    findOne(@Param('id') id: string) {
        return this.clubesService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
        return this.clubesService.update(+id, updateClubDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    remove(@Param('id') id: string) {
        return this.clubesService.remove(+id);
    }

    @Post('con-admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPERADMIN)
    createConAdmin(@Body() dto: CreateClubConAdminDto) {
        return this.clubesService.createConAdmin(dto);
    }
}