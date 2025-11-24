/**
 * Serviço responsável por todas as operações relacionadas a estratégias.
 * Implementa a lógica de negócio para CRUD e filtros.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, SelectStrategy, SelectStrategyLeg } from '../db';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { CreateStrategyLegDto } from './dto/create-strategy-leg.dto';

/**
 * Interface para filtros de estratégia
 */
export interface StrategyFilters {
    proficiencyLevel?: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    marketOutlook?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volatilityView?: 'HIGH' | 'NEUTRAL' | 'LOW';
    riskProfile?: 'CAPPED' | 'UNCAPPED';
    rewardProfile?: 'CAPPED' | 'UNCAPPED';
    strategyType?: 'CAPITAL_GAIN' | 'INCOME' | 'PROTECTION';
}

@Injectable()
export class StrategiesService {
    /**
     * Obtém todas as estratégias com filtros opcionais
     */
    async getAllStrategies(filters?: StrategyFilters): Promise<SelectStrategy[]> {
        try {
            let query = db.select().from(schema.strategies).$dynamic();

            if (filters) {
                const conditions = [];

                if (filters.proficiencyLevel) {
                    conditions.push(
                        eq(schema.strategies.proficiencyLevel, filters.proficiencyLevel),
                    );
                }

                if (filters.marketOutlook) {
                    conditions.push(
                        eq(schema.strategies.marketOutlook, filters.marketOutlook),
                    );
                }

                if (filters.volatilityView) {
                    conditions.push(
                        eq(schema.strategies.volatilityView, filters.volatilityView),
                    );
                }

                if (filters.riskProfile) {
                    conditions.push(
                        eq(schema.strategies.riskProfile, filters.riskProfile),
                    );
                }

                if (filters.rewardProfile) {
                    conditions.push(
                        eq(schema.strategies.rewardProfile, filters.rewardProfile),
                    );
                }

                if (filters.strategyType) {
                    conditions.push(
                        eq(schema.strategies.strategyType, filters.strategyType),
                    );
                }

                if (conditions.length > 0) {
                    query = query.where(and(...conditions));
                }
            }

            const strategies = await query.orderBy(asc(schema.strategies.name));
            console.log(`[StrategiesService] ${strategies.length} estratégias obtidas`);
            return strategies;
        } catch (error) {
            console.error('[StrategiesService] Erro ao obter estratégias:', error);
            throw new BadRequestException('Erro ao obter estratégias');
        }
    }

    /**
     * Obtém uma estratégia por ID com suas pernas
     */
    async getStrategyById(id: string): Promise<SelectStrategy & { legs: SelectStrategyLeg[] }> {
        try {
            const [strategy] = await db
                .select()
                .from(schema.strategies)
                .where(eq(schema.strategies.id, id))
                .limit(1);

            if (!strategy) {
                throw new NotFoundException(`Estratégia com ID ${id} não encontrada`);
            }

            const legs = await db
                .select()
                .from(schema.strategyLegs)
                .where(eq(schema.strategyLegs.strategyId, id));

            return { ...strategy, legs };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao obter estratégia:', error);
            throw new BadRequestException('Erro ao obter estratégia');
        }
    }

    /**
     * Cria uma nova estratégia
     */
    async createStrategy(createStrategyDto: CreateStrategyDto): Promise<SelectStrategy> {
        try {
            const [strategy] = await db
                .insert(schema.strategies)
                .values(createStrategyDto)
                .returning();

            console.log(`[StrategiesService] Estratégia criada: ${strategy.id}`);
            return strategy;
        } catch (error) {
            console.error('[StrategiesService] Erro ao criar estratégia:', error);
            throw new BadRequestException('Erro ao criar estratégia');
        }
    }

    /**
     * Atualiza uma estratégia existente
     */
    async updateStrategy(
        id: string,
        updateStrategyDto: UpdateStrategyDto,
    ): Promise<SelectStrategy> {
        try {
            // Verificar se estratégia existe
            await this.getStrategyById(id);

            const [strategy] = await db
                .update(schema.strategies)
                .set({
                    ...updateStrategyDto,
                    updatedAt: new Date(),
                })
                .where(eq(schema.strategies.id, id))
                .returning();

            console.log(`[StrategiesService] Estratégia atualizada: ${id}`);
            return strategy;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao atualizar estratégia:', error);
            throw new BadRequestException('Erro ao atualizar estratégia');
        }
    }

    /**
     * Deleta uma estratégia
     */
    async deleteStrategy(id: string): Promise<{ message: string }> {
        try {
            // Verificar se estratégia existe
            await this.getStrategyById(id);

            await db.delete(schema.strategies).where(eq(schema.strategies.id, id));

            console.log(`[StrategiesService] Estratégia deletada: ${id}`);
            return { message: 'Estratégia deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao deletar estratégia:', error);
            throw new BadRequestException('Erro ao deletar estratégia');
        }
    }

    /**
     * Obtém as pernas de uma estratégia
     */
    async getStrategyLegs(strategyId: string): Promise<SelectStrategyLeg[]> {
        try {
            await this.getStrategyById(strategyId);
            const legs = await db
                .select()
                .from(schema.strategyLegs)
                .where(eq(schema.strategyLegs.strategyId, strategyId));

            return legs;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao obter pernas:', error);
            throw new BadRequestException('Erro ao obter pernas da estratégia');
        }
    }

    /**
     * Adiciona uma perna a uma estratégia
     */
    async addStrategyLeg(
        createLegDto: CreateStrategyLegDto,
    ): Promise<SelectStrategyLeg> {
        try {
            // Verificar se estratégia existe
            await this.getStrategyById(createLegDto.strategyId);

            const [leg] = await db
                .insert(schema.strategyLegs)
                .values(createLegDto)
                .returning();

            console.log(`[StrategiesService] Perna adicionada: ${leg.id}`);
            return leg;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao adicionar perna:', error);
            throw new BadRequestException('Erro ao adicionar perna');
        }
    }

    /**
     * Deleta uma perna de estratégia
     */
    async deleteStrategyLeg(legId: string): Promise<{ message: string }> {
        try {
            const [leg] = await db
                .select()
                .from(schema.strategyLegs)
                .where(eq(schema.strategyLegs.id, legId))
                .limit(1);

            if (!leg) {
                throw new NotFoundException(`Perna com ID ${legId} não encontrada`);
            }

            await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.id, legId));

            console.log(`[StrategiesService] Perna deletada: ${legId}`);
            return { message: 'Perna deletada com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[StrategiesService] Erro ao deletar perna:', error);
            throw new BadRequestException('Erro ao deletar perna');
        }
    }
}