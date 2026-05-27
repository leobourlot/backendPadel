import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClubesService } from '../../clubes/clubes.service';

@Injectable()
export class ClubMiddleware implements NestMiddleware {
    constructor(private readonly clubesService: ClubesService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const host = req.headers.host || '';

        // Ejemplos de host:
        // "clubdelrio.turnos.bourderweb.com.ar"  → slug = "clubdelrio"
        // "localhost:4000"                        → slug = "localhost" (desarrollo)
        // "turnos.bourderweb.com.ar"             → panel principal (sin club)

        const slug = host.split('.')[0];

        // En desarrollo local podés usar el header X-Club-Slug para testear
        const slugOverride = req.headers['x-club-slug'] as string;
        const slugFinal = slugOverride || slug;

        // Rutas que no necesitan club (panel super admin)
        const rutasPublicas = [
            '/clubes',
            '/auth/superadmin',
        ];

        const esRutaPublica = rutasPublicas.some(ruta =>
            req.path.startsWith(ruta)
        );

        if (esRutaPublica) {
            return next();
        }

        // Ignorar si es localhost sin override (desarrollo sin club específico)
        if (slugFinal === 'localhost' && !slugOverride) {
            return next();
        }

        try {
            const club = await this.clubesService.findBySlug(slugFinal);

            if (!club) {
                return res.status(404).json({
                    statusCode: 404,
                    message: 'Club no encontrado',
                });
            }

            // Verificar si el club está activo (pagado o en prueba)
            if (!this.clubesService.isClubActivo(club)) {
                return res.status(403).json({
                    statusCode: 403,
                    message: 'El período de prueba ha vencido. Contacta a tu proveedor.',
                    vencido: true,
                });
            }

            // Inyectar el club en el request para usarlo en los controllers
            req['club'] = club;
            next();
        } catch (error) {
            return res.status(500).json({
                statusCode: 500,
                message: 'Error al verificar el club',
            });
        }
    }
}