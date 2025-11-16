/**
 * Módulo que agrupa o controller e service de simulações.
 * Responsável por encapsular toda a lógica de simulações.
 */
import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';

@Module({
    controllers: [SimulationsController],
    providers: [SimulationsService],
    exports: [SimulationsService],
})
export class SimulationsModule { }