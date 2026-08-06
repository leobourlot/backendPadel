import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { HorariosClubModule } from './horarios-club/horarios-club.module'; // ✅ NUEVO
import { PagosModule } from './pagos/pagos.module';

const cors = require('cors');
import { UsuariosModule } from './usuarios/usuarios.module';
import { CanchasModule } from './canchas/canchas.module';
import { HorariosModule } from './horarios/horarios.module';
import { ReservasModule } from './reservas/reservas.module';
import { ClubesModule } from './clubes/clubes.module';
import { ClubMiddleware } from './common/middleware/club.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: false,
    }),
    ClubesModule,
    AuthModule,
    UsuariosModule,
    CanchasModule,
    HorariosModule,
    HorariosClubModule,
    ReservasModule,
    PagosModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cors({
          origin: (origin, callback) => {
            const allowedPatterns = [
              /^https?:\/\/.*\.bourderweb\.com\.ar$/,
              /^https?:\/\/turnos\.bourderweb\.com\.ar$/,
              /^http:\/\/localhost:\d+$/,
              /^http:\/\/127\.0\.0\.1:\d+$/,
              /^https:\/\/slateblue-locust-897822\.hostingersite\.com$/,
            ];
            if (!origin || allowedPatterns.some((p) => p.test(origin))) {
              callback(null, true);
            } else {
              callback(new Error('No permitido por CORS'));
            }
          },
          credentials: true,
        }),
      )
      .forRoutes('*');
    // Aplicar el middleware a todas las rutas
    consumer.apply(ClubMiddleware).forRoutes('*');
  }
}