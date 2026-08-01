import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClubesService } from '../../clubes/clubes.service';

@Injectable()
export class ClubMiddleware implements NestMiddleware {
    constructor(private readonly clubesService: ClubesService) { }

    async use(req: any, res: any, next: () => void) {
        if (req.method === 'OPTIONS') {
            return next();
        }

        const host: string = req.headers.host || '';

        // El slug puede venir del header X-Club-Slug (mandado por el frontend)
        // o del primer segmento del subdominio del host
        const slugFromHeader = req.headers['x-club-slug'] as string;
        const slugFromHost = host.split('.')[0];
        const slugFinal = slugFromHeader || slugFromHost;

        // Rutas que no necesitan club (panel super admin)
        const rutasPublicas = ['/clubes', '/auth/superadmin', '/horarios-club'];
        const esRutaSuperAdminHorarios = /^\/horarios-club\/\d+$/.test(req.path || '');

        const path = req.originalUrl || req.path || req.url; // ✅ más robusto
        const esRutaPublica = rutasPublicas.some(ruta => path?.startsWith(ruta) || esRutaSuperAdminHorarios);
        // const esRutaPublica = rutasPublicas.some(ruta => req.path?.startsWith(ruta));
        if (esRutaPublica) return next();

        console.log('🔍 Path recibido:', path, '| Es ruta pública:', esRutaPublica); // ✅ TEMPORAL, para debug


        // En desarrollo local sin header, usar club por defecto
        if (slugFinal === 'localhost' || slugFinal === '127') {
            const clubDev = await this.clubesService.findBySlug('slateblue-locust-897822');
            if (clubDev) {
                req['club'] = clubDev;
                return next();
            }
            return next(); // Si tampoco encuentra el club dev, continuar igual
        }

        try {
            const club = await this.clubesService.findBySlug(slugFinal);

            if (!club) {
                return res.status(404).json({
                    statusCode: 404,
                    message: 'Club no encontrado',
                });
            }

            // Verificar si el club está activo (pagado o en período de prueba)
            if (!this.clubesService.isClubActivo(club)) {
                return res.status(403).json({
                    statusCode: 403,
                    message: 'El período de prueba ha vencido. Contacta a tu proveedor.',
                    vencido: true,
                });
            }

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