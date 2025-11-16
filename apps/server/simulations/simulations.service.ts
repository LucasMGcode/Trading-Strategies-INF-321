/**
 * Serviço responsável por todas as operações relacionadas a simulações.
 * Implementa a lógica de negócio para CRUD, paginação e cálculos.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, SelectSimulation, InsertSimulation, SelectSimulationLeg } from '../db';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'recent' | 'oldest';
}

/**
 * DTO para criar simulação
 */
export class CreateSimulationDto {
    userId: string;
    strategyId: string;
    assetSymbol: string;
    simulationName: string;
    startDate: Date;
    endDate: Date;
    initialCapital: string;
}

/**
 * DTO para atualizar simulação
 */
export class UpdateSimulationDto {
    simulationName?: string;
    totalReturn?: string;
    returnPercentage?: string;
    maxDrawdown?: string;
}

/**
 * DTO para criar perna de simulação
 */
export class CreateSimulationLegDto {
    simulationId: string;
    instrumentType: 'CALL' | 'PUT' | 'STOCK';
    action: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: string;
    exitPrice?: string;
    entryDate: Date;
    exitDate?: Date;
    profitLoss?: string;
}

@Injectable()
export class SimulationsService {
    /**
     * Obtém todas as simulações de um usuário com paginação
     */
    async getUserSimulations(
        userId: string,
        options?: PaginationOptions,
    ): Promise<SelectSimulation[]> {
        try {
            let query = db
                .select()
                .from(schema.simulations)
                .where(eq(schema.simulations.userId, userId)).$dynamic();

            // Ordenação
            if (options?.orderBy === 'oldest') {
                query = query.orderBy(asc(schema.simulations.createdAt));
            } else {
                query = query.orderBy(desc(schema.simulations.createdAt));
            }

            // Paginação
            if (options?.limit) {
                query = query.limit(options.limit);
            }
            if (options?.offset) {
                query = query.offset(options.offset);
            }

            const simulations = await query;
            console.log(
                `[SimulationsService] ${simulations.length} simulações obtidas para usuário ${userId}`,
            );
            return simulations;
        } catch (error) {
            console.error('[SimulationsService] Erro ao obter simulações:', error);
            throw new BadRequestException('Erro ao obter simulações');
        }
    }

    /**
     * Obtém uma simulação por ID com suas pernas
     */
    async getSimulationById(id: string): Promise<
        SelectSimulation & { legs: SelectSimulationLeg[] }
    > {
        try {
            const [simulation] = await db
                .select()
                .from(schema.simulations)
                .where(eq(schema.simulations.id, id))
                .limit(1);

            if (!simulation) {
                throw new NotFoundException(`Simulação com ID ${id} não encontrada`);
            }

            const legs = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.simulationId, id));

            return { ...simulation, legs };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao obter simulação:', error);
            throw new BadRequestException('Erro ao obter simulação');
        }
    }

    /**
     * Cria uma nova simulação
     */
    async createSimulation(
        createSimulationDto: CreateSimulationDto,
    ): Promise<SelectSimulation> {
        try {

            const [simulation] = await db
                .insert(schema.simulations)
                .values(createSimulationDto)
                .returning();

            console.log(`[SimulationsService] Simulação criada: ${simulation.id}`);
            return simulation;
        } catch (error) {
            console.error('[SimulationsService] Erro ao criar simulação:', error);
            throw new BadRequestException('Erro ao criar simulação');
        }
    }

    /**
     * Atualiza uma simulação existente
     */
    async updateSimulation(
        id: string,
        updateSimulationDto: UpdateSimulationDto,
    ): Promise<SelectSimulation> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(id);

            const [simulation] = await db
                .update(schema.simulations)
                .set(updateSimulationDto)
                .where(eq(schema.simulations.id, id))
                .returning();

            console.log(`[SimulationsService] Simulação atualizada: ${id}`);
            return simulation;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao atualizar simulação:', error);
            throw new BadRequestException('Erro ao atualizar simulação');
        }
    }

    /**
     * Deleta uma simulação e suas pernas
     */
    async deleteSimulation(id: string): Promise<{ message: string }> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(id);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, id));

            console.log(`[SimulationsService] Simulação deletada: ${id}`);
            return { message: 'Simulação deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao deletar simulação:', error);
            throw new BadRequestException('Erro ao deletar simulação');
        }
    }

    /**
     * Obtém as pernas de uma simulação
     */
    async getSimulationLegs(simulationId: string): Promise<SelectSimulationLeg[]> {
        try {
            const legs = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.simulationId, simulationId));

            return legs;
        } catch (error) {
            console.error('[SimulationsService] Erro ao obter pernas:', error);
            throw new BadRequestException('Erro ao obter pernas da simulação');
        }
    }

    /**
     * Adiciona uma perna a uma simulação
     */
    async addSimulationLeg(
        createLegDto: CreateSimulationLegDto,
    ): Promise<SelectSimulationLeg> {
        try {
            // Verificar se simulação existe
            await this.getSimulationById(createLegDto.simulationId);

            const [leg] = await db
                .insert(schema.simulationLegs)
                .values(createLegDto)
                .returning();

            console.log(`[SimulationsService] Perna adicionada: ${leg.id}`);
            return leg;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao adicionar perna:', error);
            throw new BadRequestException('Erro ao adicionar perna');
        }
    }

    /**
     * Adiciona múltiplas pernas a uma simulação
     */
    async addMultipleSimulationLegs(
        legs: CreateSimulationLegDto[],
    ): Promise<SelectSimulationLeg[]> {
        try {
            if (!legs.length) return [];

            // Verificar se simulação existe
            if (legs.length > 0) {
                await this.getSimulationById(legs[0].simulationId);
            }

            const inserted = await db
                .insert(schema.simulationLegs)
                .values(legs)
                .returning();

            console.log(`[SimulationsService] ${inserted.length} pernas adicionadas`);
            return inserted;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao adicionar pernas:', error);
            throw new BadRequestException('Erro ao adicionar pernas');
        }
    }

    /**
     * Deleta uma perna de simulação
     */
    async deleteSimulationLeg(legId: string): Promise<{ message: string }> {
        try {
            const [leg] = await db
                .select()
                .from(schema.simulationLegs)
                .where(eq(schema.simulationLegs.id, legId))
                .limit(1);

            if (!leg) {
                throw new NotFoundException(`Perna com ID ${legId} não encontrada`);
            }

            await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.id, legId));

            console.log(`[SimulationsService] Perna deletada: ${legId}`);
            return { message: 'Perna deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao deletar perna:', error);
            throw new BadRequestException('Erro ao deletar perna');
        }
    }

    /**
     * Atualiza uma perna de simulação
     */
    async updateSimulationLeg(
        legId: string,
        updateData: Partial<CreateSimulationLegDto>,
    ): Promise<SelectSimulationLeg> {
        try {
            const [leg] = await db
                .update(schema.simulationLegs)
                .set(updateData)
                .where(eq(schema.simulationLegs.id, legId))
                .returning();

            if (!leg) {
                throw new NotFoundException(`Perna com ID ${legId} não encontrada`);
            }

            console.log(`[SimulationsService] Perna atualizada: ${legId}`);
            return leg;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[SimulationsService] Erro ao atualizar perna:', error);
            throw new BadRequestException('Erro ao atualizar perna');
        }
    }

    /**
     * Calcula estatísticas básicas de simulações de um usuário
     */
    async getUserStatistics(userId: string): Promise<{
        totalSimulations: number;
        profitableSimulations: number;
        losingSimulations: number;
        winRate: string;
        avgReturn: string;
    }> {
        try {
            const simulations = await this.getUserSimulations(userId);

            const totalSimulations = simulations.length;

            if (totalSimulations === 0) {
                return {
                    totalSimulations: 0,
                    profitableSimulations: 0,
                    losingSimulations: 0,
                    winRate: '0.00',
                    avgReturn: '0.00',
                };
            }

            const returns = simulations.map((s) =>
                parseFloat(s.returnPercentage?.toString() ?? '0'),
            );

            const profitableSimulations = simulations.filter((s) => {
                const totalReturn = parseFloat(s.totalReturn?.toString() ?? '0');
                return totalReturn > 0;
            }).length;

            const losingSimulations = totalSimulations - profitableSimulations;

            const winRate = ((profitableSimulations / totalSimulations) * 100).toFixed(2);

            const avgReturn = (returns.reduce((a, b) => a + b, 0) / totalSimulations).toFixed(2);

            console.log(`[SimulationsService] Estatísticas calculadas para usuário ${userId}`);

            return {
                totalSimulations,
                profitableSimulations,
                losingSimulations,
                winRate,
                avgReturn,
            };
        } catch (error) {
            console.error('[SimulationsService] Erro ao calcular estatísticas:', error);
            throw new BadRequestException('Erro ao calcular estatísticas');
        }
    }
}