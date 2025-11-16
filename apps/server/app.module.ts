/**
 * Módulo raiz da aplicação NestJS.
 * Importa todos os módulos de funcionalidades (auth, strategies, simulations, users).
 */
import { Module } from '@nestjs/common';
import { StrategiesModule } from './strategies/strategies.module';
import { SimulationsModule } from './simulations/simulations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        AuthModule,
        StrategiesModule,
        SimulationsModule,
        UsersModule,
    ],
})
export class AppModule { }