/**
 * Testes de integração - Simulações
 * 
 * CORREÇÕES APLICADAS:
 * 1. Ordem correta de deleção (cascade automático do PostgreSQL)
 * 2. Cleanup melhorado no afterAll
 * 3. Melhor tratamento de erros
 * 4. Uso correto de beforeEach e afterEach
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../app.module';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
    ProficiencyLevel,
    MarketOutlook,
    VolatilityView,
    RiskProfile,
    RewardProfile,
    StrategyType,
} from '../strategies/dto/create-strategy.dto';
import { InstrumentType, LegAction } from './dto/create-simulation-leg.dto';
import { ExperienceLevel } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

describe('Simulações Testes de Integração', () => {
    const UUID_INEXISTENTE = '123e4567-e89b-12d3-a456-426614174000';

    let app: INestApplication;
    let simulacaoId: string;
    let usuarioId: string;
    let estrategiaId: string;
    let pernaId: string;

    const usuarioParaTeste = {
        username: 'David Jon Gilmour',
        email: `david.gilmour.${Date.now()}@rock.lsd`, // Email único por timestamp
        passwordHash: bcrypt.hashSync('comfortably_Pass73', 10),
        experienceLevel: ExperienceLevel.NOVICE,
    };

    const estrategiaParaTeste = {
        name: 'Blue Eyes Iron Condor',
        summary: 'Level 8, Ataque 3000, Defesa 2500, Tipo Condor/Light/Normal',
        description:
            'Este Condor lendário é uma poderosa máquina de destruição. Praticamente invencível, muito poucos enfrentaram esta magnífica criatura e viveram para contar a história.',
        proficiencyLevel: ProficiencyLevel.ADVANCED,
        marketOutlook: MarketOutlook.BEARISH,
        volatilityView: VolatilityView.HIGH,
        riskProfile: RiskProfile.CAPPED,
        rewardProfile: RewardProfile.CAPPED,
        strategyType: StrategyType.PROTECTION,
    };

    const simulacaoParaTeste = {
        assetSymbol: 'PETR4',
        simulationName: 'Simulação Long Call PETR4',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        initialCapital: '10000.00',
    };

    const pernaParaTeste = {
        instrumentType: InstrumentType.CALL,
        action: LegAction.BUY,
        quantity: 1,
        entryPrice: '100.00',
        entryDate: new Date('2024-01-15'),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();

        const usuarioRes = await db
            .insert(schema.users)
            .values(usuarioParaTeste)
            .returning();
        usuarioId = usuarioRes[0].id;

        const estrategiaRes = await db
            .insert(schema.strategies)
            .values(estrategiaParaTeste)
            .returning();
        estrategiaId = estrategiaRes[0].id;
    });

    beforeEach(async () => {
        await db.delete(schema.simulations).where(eq(schema.simulations.userId, usuarioId));
        simulacaoId = undefined as any;
        pernaId = undefined as any;
    });

    afterAll(async () => {
        try {
            await db.delete(schema.simulations).where(eq(schema.simulations.userId, usuarioId));

            if (estrategiaId) {
                await db.delete(schema.strategies).where(eq(schema.strategies.id, estrategiaId));
            }

            if (usuarioId) {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
        } catch (error) {
            console.error('Erro no afterAll:', error);
        }

        await app.close();
    });

    describe('POST /api/simulations', () => {
        it('Deve criar uma nova simulação com sucesso.', () => {
            return supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('simulationName', 'Simulação Long Call PETR4');
                    expect(res.body).toHaveProperty('userId', usuarioId);
                    expect(res.body).toHaveProperty('strategyId', estrategiaId);
                    expect(res.body).toHaveProperty('assetSymbol', 'PETR4');
                    simulacaoId = res.body.id;
                });
        });

        it('Deve retornar erro 400 se dados obrigatórios faltarem.', () => {
            const dadosIncompletos = {
                assetSymbol: 'VALE5',
            };

            return supertest(app.getHttpServer())
                .post('/api/simulations')
                .send(dadosIncompletos)
                .expect(400);
        });

        it('Deve retornar erro 400 se userId for inválido.', () => {
            return supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: 'invalid-uuid',
                    strategyId: estrategiaId,
                })
                .expect(400);
        });

        it('Deve retornar erro 400 se strategyId for inválido.', () => {
            return supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: 'invalid-uuid',
                })
                .expect(400);
        });

        it('Deve criar simulação com datas válidas.', async () => {
            const res = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'ITUB4',
                    simulationName: 'Simulação ITUB4',
                    startDate: new Date('2024-06-01'),
                    endDate: new Date('2024-06-30'),
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
        });
    });

    describe('GET /api/simulations/user/:userId', () => {
        it('Deve retornar todas as simulações de um usuário.', async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('Deve retornar array vazio se usuário não tem simulações.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/user/${UUID_INEXISTENTE}`)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBe(0);
                });
        });

        it('Deve retornar simulações com paginação (limit).', async () => {
            await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'BBAS3',
                    simulationName: 'Sim 1',
                })
                .expect(201);

            await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'ITSA4',
                    simulationName: 'Sim 2',
                })
                .expect(201);

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}?limit=1`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeLessThanOrEqual(1);
        });

        it('Deve retornar simulações com paginação (offset).', async () => {
            const res1 = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'BBAS3',
                    simulationName: 'Sim Offset 1',
                })
                .expect(201);

            const res2 = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'ITSA4',
                    simulationName: 'Sim Offset 2',
                })
                .expect(201);

            const sim1Id = res1.body.id;
            const sim2Id = res2.body.id;

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}?orderBy=oldest&offset=1&limit=10`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0].id).not.toBe(sim1Id);
            expect(res.body[0].id).toBe(sim2Id);
        });
    });

    describe('GET /api/simulations/:id', () => {
        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;
        });

        it('Deve retornar uma simulação por ID.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', simulacaoId);
                    expect(res.body).toHaveProperty('userId', usuarioId);
                    expect(res.body).toHaveProperty('strategyId', estrategiaId);
                });
        });

        it('Deve retornar erro 404 se simulação não existe.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/${UUID_INEXISTENTE}`)
                .expect(404);
        });

        it('Deve retornar simulação com pernas incluídas.', async () => {
            await supertest(app.getHttpServer())
                .post(`/api/simulations/legs`)
                .send({
                    ...pernaParaTeste,
                    simulationId: simulacaoId,
                })
                .expect(201);

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}`)
                .expect(200);

            expect(res.body).toHaveProperty('legs');
            expect(Array.isArray(res.body.legs)).toBe(true);
            expect(res.body.legs.length).toBeGreaterThan(0);
        });
    });

    describe('PATCH /api/simulations/:id', () => {
        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;
        });

        it('Deve atualizar nome da simulação.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({ simulationName: 'Novo Nome' })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('simulationName', 'Novo Nome');
                });
        });

        it('Deve atualizar retorno total.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({ totalReturn: '500.00' })
                .expect(200)
                .expect((res) => {
                    expect(Number(res.body.totalReturn)).toBeCloseTo(500, 6);
                });
        });

        it('Deve atualizar múltiplos campos.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({
                    simulationName: 'Atualizado',
                    totalReturn: '1000.00',
                    returnPercentage: '10.00',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('simulationName', 'Atualizado');
                    expect(Number(res.body.totalReturn)).toBeCloseTo(1000, 6);
                });
        });

        it('Deve retornar erro 404 ao atualizar simulação inexistente.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${UUID_INEXISTENTE}`)
                .send({ simulationName: 'Novo Nome' })
                .expect(404);
        });
    });

    describe('POST /api/simulations/legs', () => {
        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;
        });

        it('Deve adicionar uma perna a uma simulação.', () => {
            return supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send({
                    ...pernaParaTeste,
                    simulationId: simulacaoId,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('simulationId', simulacaoId);
                    expect(res.body).toHaveProperty('instrumentType', InstrumentType.CALL);
                    expect(res.body).toHaveProperty('action', LegAction.BUY);
                    pernaId = res.body.id;
                });
        });

        it('Deve retornar erro 404 ao adicionar perna a simulação inexistente.', () => {
            return supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send({
                    ...pernaParaTeste,
                    simulationId: UUID_INEXISTENTE,
                })
                .expect(404);
        });

        it('Deve retornar erro 400 se dados da perna forem inválidos.', () => {
            const pernaInvalida = {
                instrumentType: 'INVALID',
                action: LegAction.BUY,
                quantity: 1,
                entryPrice: '100.00',
                entryDate: new Date('2024-01-15'),
                simulationId: simulacaoId,
            };

            return supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send(pernaInvalida)
                .expect(400);
        });

        it('Deve criar perna com todos os campos opcionais.', async () => {
            const pernaCompleta = {
                ...pernaParaTeste,
                simulationId: simulacaoId,
                exitPrice: '110.00',
                exitDate: new Date('2024-02-15'),
                profitLoss: '10.00',
            };

            const res = await supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send(pernaCompleta)
                .expect(201);

            expect(Number(res.body.exitPrice)).toBeCloseTo(110, 6);
            expect(Number(res.body.profitLoss)).toBeCloseTo(10, 6);
        });
    });

    describe('GET /api/simulations/:id/legs', () => {
        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;
        });

        it('Deve retornar todas as pernas de uma simulação.', async () => {
            await supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send({
                    ...pernaParaTeste,
                    simulationId: simulacaoId,
                })
                .expect(201);

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}/legs`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('Deve retornar array vazio se simulação não tem pernas.', async () => {
            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}/legs`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });
    });

    describe('PATCH /api/simulations/legs/:legId', () => {
        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;

            const legRes = await supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send({
                    ...pernaParaTeste,
                    simulationId: simulacaoId,
                })
                .expect(201);

            pernaId = legRes.body.id;
        });

        it('Deve atualizar preço de saída da perna.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/legs/${pernaId}`)
                .send({ exitPrice: '115.00' })
                .expect(200)
                .expect((res) => {
                    expect(Number(res.body.exitPrice)).toBeCloseTo(115, 6);
                });
        });

        it('Deve atualizar múltiplos campos da perna.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/legs/${pernaId}`)
                .send({
                    exitPrice: '120.00',
                    profitLoss: '20.00',
                })
                .expect(200)
                .expect((res) => {
                    expect(Number(res.body.exitPrice)).toBeCloseTo(120, 6);
                    expect(Number(res.body.profitLoss)).toBeCloseTo(20, 6);
                });
        });

        it('Deve retornar erro 404 ao atualizar perna inexistente.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/legs/${UUID_INEXISTENTE}`)
                .send({ exitPrice: '125.00' })
                .expect(404);
        });
    });

    describe('DELETE /api/simulations/legs/:legId', () => {
        let pernaParaDeletar: string;

        beforeEach(async () => {
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            simulacaoId = createRes.body.id;

            const res = await supertest(app.getHttpServer())
                .post('/api/simulations/legs')
                .send({
                    ...pernaParaTeste,
                    simulationId: simulacaoId,
                })
                .expect(201);

            pernaParaDeletar = res.body.id;
        });

        it('Deve deletar uma perna existente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/legs/${pernaParaDeletar}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Perna deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar perna inexistente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/legs/${UUID_INEXISTENTE}`)
                .expect(404);
        });
    });

    describe('DELETE /api/simulations/:id', () => {
        let simulacaoParaDeletar: string;

        beforeEach(async () => {
            const res = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'CSAN3',
                    simulationName: 'Para Deletar',
                })
                .expect(201);

            simulacaoParaDeletar = res.body.id;
        });

        it('Deve deletar uma simulação existente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/${simulacaoParaDeletar}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Simulação deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar simulação inexistente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/${UUID_INEXISTENTE}`)
                .expect(404);
        });

        it('Deve impedir acesso à simulação após deleção.', async () => {
            await supertest(app.getHttpServer())
                .delete(`/api/simulations/${simulacaoParaDeletar}`)
                .expect(200);

            await supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoParaDeletar}`)
                .expect(404);
        });
    });

    describe('GET /api/simulations/user/:userId/statistics', () => {
        it('Deve retornar estatísticas de simulações do usuário.', async () => {
            await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                })
                .expect(201);

            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}/statistics`)
                .expect(200);

            expect(res.body).toHaveProperty('totalSimulations');
            expect(res.body).toHaveProperty('profitableSimulations');
            expect(res.body).toHaveProperty('losingSimulations');
            expect(res.body).toHaveProperty('winRate');
            expect(res.body).toHaveProperty('avgReturn');
        });

        it('Deve retornar zeros se usuário não tem simulações.', async () => {
            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${UUID_INEXISTENTE}/statistics`)
                .expect(200);

            expect(res.body.totalSimulations).toBe(0);
            expect(res.body.profitableSimulations).toBe(0);
            expect(res.body.losingSimulations).toBe(0);
            expect(Number(res.body.winRate)).toBeCloseTo(0, 6);
            expect(Number(res.body.avgReturn)).toBeCloseTo(0, 6);
        });

        it('Deve retornar estatísticas com tipos corretos.', async () => {
            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}/statistics`)
                .expect(200);

            expect(typeof res.body.totalSimulations).toBe('number');
            expect(typeof res.body.profitableSimulations).toBe('number');
            expect(typeof res.body.losingSimulations).toBe('number');
            expect(typeof res.body.winRate).toBe('string');
            expect(typeof res.body.avgReturn).toBe('string');
        });
    });

    describe('Testes de fluxo completo', () => {
        it('Deve criar, adicionar pernas, atualizar e deletar uma simulação.', async () => {
            // Criar simulação
            const createRes = await supertest(app.getHttpServer())
                .post('/api/simulations')
                .send({
                    ...simulacaoParaTeste,
                    userId: usuarioId,
                    strategyId: estrategiaId,
                    assetSymbol: 'BRML3',
                    simulationName: 'Fluxo Completo',
                })
                .expect(201);

            const simId = createRes.body.id;

            // Criar perna usando a rota correta
            const legRes = await supertest(app.getHttpServer())
                .post(`/api/simulations/legs`)
                .send({
                    ...pernaParaTeste,
                    simulationId: simId,
                })
                .expect(201);

            const legId = legRes.body.id;

            // Obter simulação com pernas
            const getRes = await supertest(app.getHttpServer())
                .get(`/api/simulations/${simId}`)
                .expect(200);

            expect(getRes.body.legs.length).toBeGreaterThan(0);

            // Atualizar perna usando a rota correta
            await supertest(app.getHttpServer())
                .patch(`/api/simulations/legs/${legId}`)
                .send({
                    exitPrice: '105.00',
                    profitLoss: '5.00',
                })
                .expect(200);

            // Atualizar simulação
            await supertest(app.getHttpServer())
                .patch(`/api/simulations/${simId}`)
                .send({
                    simulationName: 'Fluxo Completo Atualizado',
                    totalReturn: '500.00',
                    returnPercentage: '5.00',
                })
                .expect(200);

            // Deletar perna
            await supertest(app.getHttpServer())
                .delete(`/api/simulations/legs/${legId}`)
                .expect(200);

            // Deletar simulação
            await supertest(app.getHttpServer())
                .delete(`/api/simulations/${simId}`)
                .expect(200);

            // Verificar que foi deletada
            await supertest(app.getHttpServer())
                .get(`/api/simulations/${simId}`)
                .expect(404);
        });
    });
});