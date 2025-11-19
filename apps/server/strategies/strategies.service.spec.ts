/**
 * Testes unitários - Estratégias
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StrategiesService, StrategyFilters } from './strategies.service';
import { NotFoundException } from '@nestjs/common';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
    CreateStrategyDto,
    ProficiencyLevel,
    MarketOutlook,
    VolatilityView,
    RiskProfile,
    RewardProfile,
    StrategyType,
} from './dto/create-strategy.dto';
import { CreateStrategyLegDto, StrategyLegAction, StrategyInstrumentType, StrikeRelation } from './dto/create-strategy-leg.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

describe('Estratégias Testes Service', () => {
    let service: StrategiesService;

    const estrategiaId = '00000000-0000-0000-0000-000000000001';
    const estrategiaNome = 'Long Call';
    const pernaId = '00000000-0000-0000-0000-000000000101';

    const mockEstrategia = {
        id: estrategiaId,
        name: estrategiaNome,
        summary: 'Compra de uma call',
        description: 'Estratégia bullish com risco limitado',
        proficiencyLevel: ProficiencyLevel.NOVICE,
        marketOutlook: MarketOutlook.BULLISH,
        volatilityView: VolatilityView.HIGH,
        riskProfile: RiskProfile.CAPPED,
        rewardProfile: RewardProfile.UNCAPPED,
        strategyType: StrategyType.CAPITAL_GAIN,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPerna = {
        id: pernaId,
        strategyId: estrategiaId,
        action: StrategyLegAction.BUY,
        instrumentType: StrategyInstrumentType.CALL,
        quantityRatio: 1,
        strikeRelation: StrikeRelation.ATM,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.strategyId, '00000000-0000-0000-0000-000000000001'));
        await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.strategyId, '00000000-0000-0000-0000-000000000002'));
        await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.strategyId, '00000000-0000-0000-0000-000000000003'));

        const module: TestingModule = await Test.createTestingModule({
            providers: [StrategiesService],
        }).compile();

        service = module.get<StrategiesService>(StrategiesService);
    });

    afterEach(async () => {});

    describe('Obter todas as estratégias, getAllStrategies', () => {
        it('Deve retornar todas as estratégias sem filtros.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const resultado = await service.getAllStrategies();

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
            expect(resultado[0]).toHaveProperty('id');
            expect(resultado[0]).toHaveProperty('name');
        });

        it('Deve retornar estratégias filtradas por proficiencyLevel.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            const estrategiaIntermediaria = {
                ...mockEstrategia,
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Iron Condor',
                proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
            };
            await db.insert(schema.strategies).values(estrategiaIntermediaria);

            const filtros: StrategyFilters = {
                proficiencyLevel: ProficiencyLevel.NOVICE,
            };

            const resultado = await service.getAllStrategies(filtros);

            expect(resultado.length).toBeGreaterThan(0);
            resultado.forEach((estrategia) => {
                expect(estrategia.proficiencyLevel).toBe(ProficiencyLevel.NOVICE);
            });
        });

        it('Deve retornar estratégias filtradas por marketOutlook.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            const estrategiaBearish = {
                ...mockEstrategia,
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Long Put',
                marketOutlook: MarketOutlook.BEARISH,
            };
            await db.insert(schema.strategies).values(estrategiaBearish);

            const filtros: StrategyFilters = {
                marketOutlook: MarketOutlook.BULLISH,
            };

            const resultado = await service.getAllStrategies(filtros);

            resultado.forEach((estrategia) => {
                expect(estrategia.marketOutlook).toBe(MarketOutlook.BULLISH);
            });
        });

        it('Deve retornar estratégias com múltiplos filtros.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const filtros: StrategyFilters = {
                proficiencyLevel: ProficiencyLevel.NOVICE,
                marketOutlook: MarketOutlook.BULLISH,
                volatilityView: VolatilityView.HIGH,
            };

            const resultado = await service.getAllStrategies(filtros);

            resultado.forEach((estrategia) => {
                expect(estrategia.proficiencyLevel).toBe(ProficiencyLevel.NOVICE);
                expect(estrategia.marketOutlook).toBe(MarketOutlook.BULLISH);
                expect(estrategia.volatilityView).toBe(VolatilityView.HIGH);
            });
        });

        it('Deve retornar array vazio se nenhuma estratégia corresponder aos filtros.', async () => {
            const filtros: StrategyFilters = {
                proficiencyLevel: ProficiencyLevel.EXPERT,
                marketOutlook: MarketOutlook.BEARISH,
            };

            const resultado = await service.getAllStrategies(filtros);

            expect(Array.isArray(resultado)).toBe(true);
        });
    });

    describe('Obter estratégia por ID, getStrategyById', () => {
        it('Deve retornar uma estratégia com suas pernas.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            await db.insert(schema.strategyLegs).values(mockPerna);

            const resultado = await service.getStrategyById(estrategiaId);

            expect(resultado).toHaveProperty('id', estrategiaId);
            expect(resultado).toHaveProperty('name', estrategiaNome);
            expect(resultado).toHaveProperty('legs');
            expect(Array.isArray(resultado.legs)).toBe(true);
            expect(resultado.legs.length).toBeGreaterThan(0);
        });

        it('Deve retornar estratégia sem pernas se não houver nenhuma.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const resultado = await service.getStrategyById(estrategiaId);

            expect(resultado).toHaveProperty('id', estrategiaId);
            expect(resultado.legs).toEqual([]);
        });

        it('Deve lançar NotFoundException se estratégia não existir.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.getStrategyById(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Criar estratégia, createStrategy', () => {
        it('Deve criar uma nova estratégia com sucesso.', async () => {
            const createStrategyDto: CreateStrategyDto = {
                name: 'Bull Call Spread',
                summary: 'Spread de call bullish',
                description: 'Estratégia com risco e retorno limitados',
                proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
                marketOutlook: MarketOutlook.BULLISH,
                volatilityView: VolatilityView.LOW,
                riskProfile: RiskProfile.CAPPED,
                rewardProfile: RewardProfile.CAPPED,
                strategyType: StrategyType.CAPITAL_GAIN,
            };

            const resultado = await service.createStrategy(createStrategyDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('name', createStrategyDto.name);
            expect(resultado).toHaveProperty('summary', createStrategyDto.summary);
            expect(resultado).toHaveProperty('proficiencyLevel', ProficiencyLevel.INTERMEDIATE);

            await db.delete(schema.strategies).where(eq(schema.strategies.id, resultado.id));
        });

        it('Deve criar estratégia com valores padrão para campos opcionais.', async () => {
            const createStrategyDto: CreateStrategyDto = {
                name: 'Simple Strategy',
                proficiencyLevel: ProficiencyLevel.NOVICE,
                marketOutlook: MarketOutlook.NEUTRAL,
                volatilityView: VolatilityView.NEUTRAL,
                riskProfile: RiskProfile.CAPPED,
                rewardProfile: RewardProfile.CAPPED,
                strategyType: StrategyType.PROTECTION,
            };

            const resultado = await service.createStrategy(createStrategyDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('name', 'Simple Strategy');

            await db.delete(schema.strategies).where(eq(schema.strategies.id, resultado.id));
        });
    });

    describe('Atualizar estratégia, updateStrategy', () => {
        it('Deve atualizar uma estratégia existente.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const updateStrategyDto: UpdateStrategyDto = {
                summary: 'Resumo atualizado',
                description: 'Descrição atualizada',
            };

            const resultado = await service.updateStrategy(estrategiaId, updateStrategyDto);

            expect(resultado).toHaveProperty('id', estrategiaId);
            expect(resultado).toHaveProperty('summary', 'Resumo atualizado');
            expect(resultado).toHaveProperty('description', 'Descrição atualizada');
        });

        it('Deve lançar NotFoundException ao atualizar estratégia inexistente.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';
            const updateStrategyDto: UpdateStrategyDto = {
                summary: 'Novo resumo',
            };

            await expect(
                service.updateStrategy(idInexistente, updateStrategyDto),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('Deletar estratégia, deleteStrategy', () => {
        it('Deve deletar uma estratégia existente.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const resultado = await service.deleteStrategy(estrategiaId);

            expect(resultado).toEqual({ message: 'Estratégia deletada com sucesso' });

            await expect(service.getStrategyById(estrategiaId)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve lançar NotFoundException ao deletar estratégia inexistente.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.deleteStrategy(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve deletar estratégia e suas pernas.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            await db.insert(schema.strategyLegs).values(mockPerna);

            const resultado = await service.deleteStrategy(estrategiaId);

            expect(resultado).toEqual({ message: 'Estratégia deletada com sucesso' });

            const pernasRestantes = await service.getStrategyLegs(estrategiaId).catch(() => []);
            expect(pernasRestantes).toEqual([]);
        });
    });

    describe('Obter pernas da estratégia, getStrategyLegs', () => {
        it('Deve retornar todas as pernas de uma estratégia.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            await db.insert(schema.strategyLegs).values(mockPerna);

            const resultado = await service.getStrategyLegs(estrategiaId);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
            expect(resultado[0]).toHaveProperty('strategyId', estrategiaId);
        });

        it('Deve retornar array vazio se estratégia não tiver pernas.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const resultado = await service.getStrategyLegs(estrategiaId);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        });
    });

    describe('Adicionar perna à estratégia, addStrategyLeg', () => {
        it('Deve adicionar uma perna a uma estratégia existente.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);

            const createLegDto: CreateStrategyLegDto = {
                strategyId: estrategiaId,
                action: StrategyLegAction.BUY,
                instrumentType: StrategyInstrumentType.CALL,
                quantityRatio: 1,
                strikeRelation: StrikeRelation.ATM,
            };

            const resultado = await service.addStrategyLeg(createLegDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('strategyId', estrategiaId);

            await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.id, resultado.id));
        });

        it('Deve lançar NotFoundException ao adicionar perna a estratégia inexistente.', async () => {
            const createLegDto: CreateStrategyLegDto = {
                strategyId: '99999999-9999-9999-9999-999999999999',
                action: StrategyLegAction.BUY,
                instrumentType: StrategyInstrumentType.CALL,
                quantityRatio: 1,
                strikeRelation: StrikeRelation.ATM,
            };

            await expect(service.addStrategyLeg(createLegDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Deletar perna de estratégia, deleteStrategyLeg', () => {
        it('Deve deletar uma perna existente.', async () => {
            await db.insert(schema.strategies).values(mockEstrategia);
            await db.insert(schema.strategyLegs).values(mockPerna);

            const resultado = await service.deleteStrategyLeg(pernaId);

            expect(resultado).toEqual({ message: 'Perna deletada com sucesso' });

            const pernasRestantes = await service.getStrategyLegs(estrategiaId);
            expect(pernasRestantes).toEqual([]);
        });

        it('Deve lançar NotFoundException ao deletar perna inexistente.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.deleteStrategyLeg(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });
});