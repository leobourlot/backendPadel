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

// Solo superadmin puede gestionar clubes (vos, el dueño del SaaS)
@Controller('clubes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class ClubesController {
    constructor(private readonly clubesService: ClubesService) { }

    @Post()
    create(@Body() createClubDto: CreateClubDto) {
        return this.clubesService.create(createClubDto);
    }

    @Get()
    findAll() {
        return this.clubesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clubesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
        return this.clubesService.update(+id, updateClubDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clubesService.remove(+id);
    }
}