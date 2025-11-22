/**
 * Testes unitários - Simulações
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SimulationsService, PaginationOptions } from './simulations.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateSimulationLegDto, InstrumentType, LegAction } from './dto/create-simulation-leg.dto';
import { MarketOutlook, ProficiencyLevel, RewardProfile, RiskProfile, StrategyType, VolatilityView } from '../strategies/dto/create-strategy.dto';
import { ExperienceLevel } from '../users/dto/create-user.dto';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

describe('Simulações Testes Service', () => {
    let service: SimulationsService;

    const UUID_INEXISTENTE = '123e4567-e89b-12d3-a456-426614174000';
    const simulacaoId = '00000000-0000-0000-0000-000000000001';
    const usuarioId = '00000000-0000-0000-0000-000000000002';
    const estrategiaId = '00000000-0000-0000-0000-000000000003';
    const pernaId = '00000000-0000-0000-0000-000000000101';

    const mockUsuario = {
        id: usuarioId,
        username: 'John Bonham',
        email: 'fourSticks@rock.metal',
        passwordHash: bcrypt.hashSync('Groove@666', 10),
        experienceLevel: ExperienceLevel.NOVICE,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockEstrategia = {
        id: estrategiaId,
        name: 'Tester Call Iron',
        summary: 'Testa a Call',
        description: 'Estratégia bullshit com risco ilimitado',
        proficiencyLevel: ProficiencyLevel.NOVICE,
        marketOutlook: MarketOutlook.BULLISH,
        volatilityView: VolatilityView.HIGH,
        riskProfile: RiskProfile.CAPPED,
        rewardProfile: RewardProfile.UNCAPPED,
        strategyType: StrategyType.CAPITAL_GAIN,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockSimulacao = {
        id: simulacaoId,
        userId: usuarioId,
        strategyId: estrategiaId,
        assetSymbol: 'PETR4',
        simulationName: 'Simulação Long Call',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        initialCapital: '10000.00',
        totalReturn: '1500.00',
        returnPercentage: '15.00',
        maxDrawdown: '5.00',
        createdAt: new Date(),
    };

    const mockPerna = {
        id: pernaId,
        simulationId: simulacaoId,
        instrumentType: InstrumentType.CALL,
        action: LegAction.BUY,
        quantity: 1,
        entryPrice: '100.00',
        exitPrice: '110.00',
        entryDate: new Date('2024-01-15'),
        exitDate: new Date('2024-02-15'),
        profitLoss: '10.00',
    };

    beforeEach(async () => {
        await db.delete(schema.simulationLegs);
        await db.delete(schema.simulations);
        await db.delete(schema.strategies);
        await db.delete(schema.users);

        await db.insert(schema.users).values(mockUsuario);
        await db.insert(schema.strategies).values(mockEstrategia);

        const module: TestingModule = await Test.createTestingModule({
            providers: [SimulationsService],
        }).compile();

        service = module.get<SimulationsService>(SimulationsService);
    });

    afterEach(async () => {
        await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.simulationId, simulacaoId));
        await db.delete(schema.simulations).where(eq(schema.simulations.id, simulacaoId));
    });

    describe('Obter simulações do usuário, getUserSimulations', () => {
        it('Deve retornar todas as simulações de um usuário.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);

            const resultado = await service.getUserSimulations(usuarioId);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
            expect(resultado[0]).toHaveProperty('id');
            expect(resultado[0]).toHaveProperty('userId', usuarioId);
        });

        it('Deve retornar array vazio se usuário não tem simulações.', async () => {
            const resultado = await service.getUserSimulations(UUID_INEXISTENTE);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        });

        it('Deve retornar simulações ordenadas por recente (padrão).', async () => {
            const sim1 = { ...mockSimulacao, createdAt: new Date('2024-01-01') };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000004',
                createdAt: new Date('2024-02-01'),
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);

            const resultado = await service.getUserSimulations(usuarioId);

            expect(resultado[0].createdAt >= resultado[1].createdAt).toBe(true);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
        });

        it('Deve retornar simulações ordenadas por antigas.', async () => {
            const sim1 = { ...mockSimulacao, createdAt: new Date('2024-01-01') };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000005',
                createdAt: new Date('2024-02-01'),
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);

            const opcoes: PaginationOptions = { orderBy: 'oldest' };
            const resultado = await service.getUserSimulations(usuarioId, opcoes);

            expect(resultado[0].createdAt <= resultado[1].createdAt).toBe(true);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
        });

        it('Deve aplicar limite de paginação.', async () => {
            const sim1 = { ...mockSimulacao };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000006',
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);

            const opcoes: PaginationOptions = { limit: 1 };
            const resultado = await service.getUserSimulations(usuarioId, opcoes);

            expect(resultado.length).toBeLessThanOrEqual(1);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
        });

        it('Deve aplicar offset de paginação.', async () => {
            const sim1 = { ...mockSimulacao };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000007',
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);

            const opcoes: PaginationOptions = { offset: 1 };
            const resultado = await service.getUserSimulations(usuarioId, opcoes);

            expect(resultado.length).toBeLessThanOrEqual(1);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
        });
    });

    describe('Obter simulação por ID, getSimulationById', () => {
        it('Deve retornar uma simulação com suas pernas.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
            await db.insert(schema.simulationLegs).values(mockPerna);

            const resultado = await service.getSimulationById(simulacaoId);

            expect(resultado).toHaveProperty('id', simulacaoId);
            expect(resultado).toHaveProperty('simulationName', 'Simulação Long Call');
            expect(resultado).toHaveProperty('legs');
            expect(Array.isArray(resultado.legs)).toBe(true);
            expect(resultado.legs.length).toBeGreaterThan(0);
        });

        it('Deve retornar simulação sem pernas se não houver nenhuma.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);

            const resultado = await service.getSimulationById(simulacaoId);

            expect(resultado).toHaveProperty('id', simulacaoId);
            expect(resultado.legs).toEqual([]);
        });

        it('Deve lançar NotFoundException se simulação não existir.', async () => {
            await expect(service.getSimulationById(UUID_INEXISTENTE)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Criar simulação, createSimulation', () => {
        it('Deve criar uma nova simulação com sucesso.', async () => {
            const createSimulationDto: CreateSimulationDto = {
                userId: usuarioId,
                strategyId: estrategiaId,
                assetSymbol: 'VALE5',
                simulationName: 'Simulação Bull Call Spread',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                initialCapital: '5000.00',
            };

            const resultado = await service.createSimulation(createSimulationDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('simulationName', 'Simulação Bull Call Spread');
            expect(resultado).toHaveProperty('userId', usuarioId);
            expect(resultado).toHaveProperty('strategyId', estrategiaId);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, resultado.id));
        });

        it('Deve criar simulação com valores padrão para campos opcionais.', async () => {
            const createSimulationDto: CreateSimulationDto = {
                userId: usuarioId,
                strategyId: estrategiaId,
                assetSymbol: 'ITUB4',
                simulationName: 'Simulação Simples',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                initialCapital: '10000.00',
            };

            const resultado = await service.createSimulation(createSimulationDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('simulationName', 'Simulação Simples');

            await db.delete(schema.simulations).where(eq(schema.simulations.id, resultado.id));
        });
    });

    describe('Atualizar simulação, updateSimulation', () => {
        beforeEach(async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
        });

        it('Deve atualizar nome da simulação.', async () => {
            const updateSimulationDto: UpdateSimulationDto = {
                simulationName: 'Simulação Atualizada',
            };

            const resultado = await service.updateSimulation(simulacaoId, updateSimulationDto);

            expect(resultado).toHaveProperty('simulationName', 'Simulação Atualizada');
        });

        it('Deve atualizar retorno total da simulação.', async () => {
            const updateSimulationDto: UpdateSimulationDto = {
                totalReturn: '2000.00',
                returnPercentage: '20.00',
            };

            const resultado = await service.updateSimulation(simulacaoId, updateSimulationDto);

            expect(resultado).toHaveProperty('totalReturn', '2000.00');
            expect(resultado).toHaveProperty('returnPercentage', '20.0000');
        });

        it('Deve atualizar múltiplos campos simultaneamente.', async () => {
            const updateSimulationDto: UpdateSimulationDto = {
                simulationName: 'Simulação Atualizada',
                totalReturn: '2500.00',
                returnPercentage: '25.00',
                maxDrawdown: '3.00',
            };

            const resultado = await service.updateSimulation(simulacaoId, updateSimulationDto);

            expect(resultado).toHaveProperty('simulationName', 'Simulação Atualizada');
            expect(resultado).toHaveProperty('totalReturn', '2500.00');
            expect(resultado).toHaveProperty('returnPercentage', '25.0000');
            expect(resultado).toHaveProperty('maxDrawdown', '3.0000');
        });

        it('Deve lançar NotFoundException ao atualizar simulação inexistente.', async () => {
            const updateSimulationDto: UpdateSimulationDto = {
                simulationName: 'Novo nome',
            };

            await expect(
                service.updateSimulation(UUID_INEXISTENTE, updateSimulationDto),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('Deletar simulação, deleteSimulation', () => {
        it('Deve deletar uma simulação existente.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);

            const resultado = await service.deleteSimulation(simulacaoId);

            expect(resultado).toEqual({ message: 'Simulação deletada com sucesso' });

            await expect(service.getSimulationById(simulacaoId)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve lançar NotFoundException ao deletar simulação inexistente.', async () => {
            await expect(service.deleteSimulation(UUID_INEXISTENTE)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve deletar simulação e suas pernas.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
            await db.insert(schema.simulationLegs).values(mockPerna);

            const resultado = await service.deleteSimulation(simulacaoId);

            expect(resultado).toEqual({ message: 'Simulação deletada com sucesso' });

            const pernasRestantes = await service.getSimulationLegs(simulacaoId).catch(() => []);
            expect(pernasRestantes).toEqual([]);
        });
    });

    describe('Obter pernas da simulação, getSimulationLegs', () => {
        it('Deve retornar todas as pernas de uma simulação.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
            await db.insert(schema.simulationLegs).values(mockPerna);

            const resultado = await service.getSimulationLegs(simulacaoId);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
            expect(resultado[0]).toHaveProperty('simulationId', simulacaoId);
        });

        it('Deve retornar array vazio se simulação não tiver pernas.', async () => {
            await db.insert(schema.simulations).values(mockSimulacao);

            const resultado = await service.getSimulationLegs(simulacaoId);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        });
    });

    describe('Adicionar perna à simulação, addSimulationLeg', () => {
        beforeEach(async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
        });

        it('Deve adicionar uma perna a uma simulação existente.', async () => {
            const createLegDto: CreateSimulationLegDto = {
                simulationId: simulacaoId,
                instrumentType: InstrumentType.CALL,
                action: LegAction.BUY,
                quantity: 1,
                entryPrice: '100.00',
                entryDate: new Date('2024-01-15'),
            };

            const resultado = await service.addSimulationLeg(createLegDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('simulationId', simulacaoId);
            expect(resultado).toHaveProperty('instrumentType', InstrumentType.CALL);

            await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.id, resultado.id));
        });

        it('Deve lançar NotFoundException ao adicionar perna a simulação inexistente.', async () => {
            const createLegDto: CreateSimulationLegDto = {
                simulationId: UUID_INEXISTENTE,
                instrumentType: InstrumentType.PUT,
                action: LegAction.SELL,
                quantity: 2,
                entryPrice: '50.00',
                entryDate: new Date('2024-01-15'),
            };

            await expect(service.addSimulationLeg(createLegDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Adicionar múltiplas pernas, addMultipleSimulationLegs', () => {
        beforeEach(async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
        });

        it('Deve adicionar múltiplas pernas a uma simulação.', async () => {
            const legs: CreateSimulationLegDto[] = [
                {
                    simulationId: simulacaoId,
                    instrumentType: InstrumentType.CALL,
                    action: LegAction.BUY,
                    quantity: 1,
                    entryPrice: '100.00',
                    entryDate: new Date('2024-01-15'),
                },
                {
                    simulationId: simulacaoId,
                    instrumentType: InstrumentType.PUT,
                    action: LegAction.SELL,
                    quantity: 1,
                    entryPrice: '95.00',
                    entryDate: new Date('2024-01-15'),
                },
            ];

            const resultado = await service.addMultipleSimulationLegs(legs);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(2);

            for (const leg of resultado) {
                await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.id, leg.id));
            }
        });

        it('Deve retornar array vazio se nenhuma perna for fornecida.', async () => {
            const resultado = await service.addMultipleSimulationLegs([]);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        });

        it('Deve lançar NotFoundException se simulação não existir.', async () => {
            const legs: CreateSimulationLegDto[] = [
                {
                    simulationId: UUID_INEXISTENTE,
                    instrumentType: InstrumentType.CALL,
                    action: LegAction.BUY,
                    quantity: 1,
                    entryPrice: '100.00',
                    entryDate: new Date('2024-01-15'),
                },
            ];

            await expect(service.addMultipleSimulationLegs(legs)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Deletar perna de simulação, deleteSimulationLeg', () => {
        beforeEach(async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
            await db.insert(schema.simulationLegs).values(mockPerna);
        });

        it('Deve deletar uma perna existente.', async () => {
            const resultado = await service.deleteSimulationLeg(pernaId);

            expect(resultado).toEqual({ message: 'Perna deletada com sucesso' });

            const pernasRestantes = await service.getSimulationLegs(simulacaoId);
            expect(pernasRestantes).toEqual([]);
        });

        it('Deve lançar NotFoundException ao deletar perna inexistente.', async () => {
            await expect(service.deleteSimulationLeg(UUID_INEXISTENTE)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Atualizar perna de simulação, updateSimulationLeg', () => {
        beforeEach(async () => {
            await db.insert(schema.simulations).values(mockSimulacao);
            await db.insert(schema.simulationLegs).values(mockPerna);
        });

        it('Deve atualizar preço de saída da perna.', async () => {
            const updateData = {
                exitPrice: '120.00',
            };

            const resultado = await service.updateSimulationLeg(pernaId, updateData);

            expect(resultado).toHaveProperty('exitPrice', '120.00');
        });

        it('Deve atualizar múltiplos campos da perna.', async () => {
            const updateData = {
                exitPrice: '115.00',
                profitLoss: '15.00',
            };

            const resultado = await service.updateSimulationLeg(pernaId, updateData);

            expect(resultado).toHaveProperty('exitPrice', '115.00');
            expect(resultado).toHaveProperty('profitLoss', '15.00');
        });

        it('Deve lançar NotFoundException ao atualizar perna inexistente.', async () => {
            const updateData = {
                exitPrice: '120.00',
            };

            await expect(
                service.updateSimulationLeg(UUID_INEXISTENTE, updateData),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('Obter estatísticas do usuário, getUserStatistics', () => {
        it('Deve retornar estatísticas de simulações do usuário.', async () => {
            const sim1 = { ...mockSimulacao, totalReturn: '1000.00' };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000008',
                totalReturn: '-500.00',
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);

            const resultado = await service.getUserStatistics(usuarioId);

            expect(resultado).toHaveProperty('totalSimulations', 2);
            expect(resultado).toHaveProperty('profitableSimulations');
            expect(resultado).toHaveProperty('losingSimulations');
            expect(resultado).toHaveProperty('winRate');
            expect(resultado).toHaveProperty('avgReturn');

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
        });

        it('Deve retornar zeros se usuário não tem simulações.', async () => {
            const resultado = await service.getUserStatistics(UUID_INEXISTENTE);

            expect(resultado.totalSimulations).toBe(0);
            expect(resultado.profitableSimulations).toBe(0);
            expect(resultado.losingSimulations).toBe(0);
            expect(resultado.winRate).toBe('0.00');
            expect(resultado.avgReturn).toBe('0.00');
        });

        it('Deve calcular win rate corretamente.', async () => {
            const sim1 = { ...mockSimulacao, totalReturn: '1000.00', returnPercentage: '10.00' };
            const sim2 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000009',
                totalReturn: '500.00',
                returnPercentage: '5.00',
            };
            const sim3 = {
                ...mockSimulacao,
                id: '00000000-0000-0000-0000-000000000010',
                totalReturn: '-200.00',
                returnPercentage: '-2.00',
            };
            await db.insert(schema.simulations).values(sim1);
            await db.insert(schema.simulations).values(sim2);
            await db.insert(schema.simulations).values(sim3);

            const resultado = await service.getUserStatistics(usuarioId);

            expect(parseFloat(resultado.winRate)).toBeCloseTo(66.67, 1);

            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim2.id));
            await db.delete(schema.simulations).where(eq(schema.simulations.id, sim3.id));
        });
    });
});