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

@Controller('canchas')
export class CanchasController {
    constructor(private readonly canchasService: CanchasService) { }

    // ✅ Solo ADMIN puede crear
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() createCanchaDto: CreateCanchaDto) {
        return this.canchasService.create(createCanchaDto);
    }

    // ✅ Todos pueden ver (sin guard)
    @Get()
    findAll() {
        return this.canchasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.canchasService.findOne(+id);
    }

    // ✅ Solo ADMIN puede actualizar
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateCanchaDto: UpdateCanchaDto) {
        return this.canchasService.update(+id, updateCanchaDto);
    }

    // ✅ Solo ADMIN puede eliminar
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.canchasService.remove(+id);
    }
}