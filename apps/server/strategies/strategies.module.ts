/**
 * Módulo que agrupa o controller e service de estratégias.
 * Responsável por encapsular toda a lógica de estratégias.
 */
import { Module } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { StrategiesController } from './strategies.controller';

@Module({
    controllers: [StrategiesController],
    providers: [StrategiesService],
    exports: [StrategiesService],
})
export class StrategiesModule {}
