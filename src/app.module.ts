import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
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
      synchronize: true,
      logging: false,
    }),
    ClubesModule,
    AuthModule,
    UsuariosModule,
    CanchasModule,
    HorariosModule,
    ReservasModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar el middleware a todas las rutas
    consumer.apply(ClubMiddleware).forRoutes('*');
  }
}