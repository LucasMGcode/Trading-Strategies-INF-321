/**
 * Testes de integração - Simulações
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
        email: 'david.gilmour@rock.lsd',
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
        await db.delete(schema.simulationLegs);
        await db.delete(schema.simulations);

        simulacaoId = undefined as any;
        pernaId = undefined as any;
    });

    afterAll(async () => {
        await db.delete(schema.simulationLegs);
        await db.delete(schema.simulations);

        if (estrategiaId) {
            await db.delete(schema.strategies).where(eq(schema.strategies.id, estrategiaId));
        }
        if (usuarioId) {
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
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

            await db.delete(schema.simulations).where(eq(schema.simulations.id, res.body.id));
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

        it('Deve retornar simulações ordenadas por recente.', async () => {
            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}?orderBy=recent`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });

        it('Deve retornar simulações ordenadas por antigas.', async () => {
            const res = await supertest(app.getHttpServer())
                .get(`/api/simulations/user/${usuarioId}?orderBy=oldest`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
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

        it('Deve retornar uma simulação com suas pernas.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', simulacaoId);
                    expect(res.body).toHaveProperty('simulationName');
                    expect(res.body).toHaveProperty('legs');
                    expect(Array.isArray(res.body.legs)).toBe(true);
                });
        });

        it('Deve retornar erro 404 se simulação não existir.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/${UUID_INEXISTENTE}`)
                .expect(404);
        });

        it('Deve retornar simulação com todos os campos.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/simulations/${simulacaoId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('userId');
                    expect(res.body).toHaveProperty('strategyId');
                    expect(res.body).toHaveProperty('assetSymbol');
                    expect(res.body).toHaveProperty('simulationName');
                    expect(res.body).toHaveProperty('startDate');
                    expect(res.body).toHaveProperty('endDate');
                    expect(res.body).toHaveProperty('initialCapital');
                });
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
                .send({ simulationName: 'Simulação Atualizada' })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('simulationName', 'Simulação Atualizada');
                });
        });

        it('Deve atualizar retorno total da simulação.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({
                    totalReturn: '2000.00',
                    returnPercentage: '20.00',
                })
                .expect(200)
                .expect((res) => {
                    // compara como número, evitando "20.00" vs "20.0000"
                    expect(Number(res.body.totalReturn)).toBeCloseTo(2000, 6);
                    expect(Number(res.body.returnPercentage)).toBeCloseTo(20, 6);
                });
        });

        it('Deve atualizar múltiplos campos simultaneamente.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({
                    simulationName: 'Simulação Final',
                    totalReturn: '3000.00',
                    returnPercentage: '30.00',
                    maxDrawdown: '2.50',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('simulationName', 'Simulação Final');
                    expect(Number(res.body.totalReturn)).toBeCloseTo(3000, 6);
                    expect(Number(res.body.returnPercentage)).toBeCloseTo(30, 6);
                    expect(Number(res.body.maxDrawdown)).toBeCloseTo(2.5, 6);
                });
        });

        it('Deve retornar erro 404 ao atualizar simulação inexistente.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${UUID_INEXISTENTE}`)
                .send({ simulationName: 'Novo nome' })
                .expect(404);
        });

        it('Deve permitir atualização parcial.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}`)
                .send({ maxDrawdown: '1.50' })
                .expect(200)
                .expect((res) => {
                    expect(Number(res.body.maxDrawdown)).toBeCloseTo(1.5, 6);
                });
        });
    });

    describe('POST /api/simulations/:id/legs', () => {
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
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaParaTeste)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('simulationId');
                    expect(res.body.simulationId).toBe(simulacaoId);
                    expect(res.body).toHaveProperty('instrumentType');
                    expect(res.body.instrumentType).toBe(InstrumentType.CALL);
                    expect(res.body).toHaveProperty('action', LegAction.BUY);
                    pernaId = res.body.id;
                });
        });

        it('Deve retornar erro 404 ao adicionar perna a simulação inexistente.', () => {
            return supertest(app.getHttpServer())
                .post(`/api/simulations/${UUID_INEXISTENTE}/legs`)
                .send(pernaParaTeste)
                .expect(404);
        });

        it('Deve retornar erro 400 se dados da perna forem inválidos.', () => {
            const pernaInvalida = {
                instrumentType: 'INVALID',
                action: LegAction.BUY,
                quantity: 1,
                entryPrice: '100.00',
                entryDate: new Date('2024-01-15'),
            };

            return supertest(app.getHttpServer())
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaInvalida)
                .expect(400);
        });

        it('Deve criar perna com todos os campos opcionais.', async () => {
            const pernaCompleta = {
                ...pernaParaTeste,
                exitPrice: '110.00',
                exitDate: new Date('2024-02-15'),
                profitLoss: '10.00',
            };

            const res = await supertest(app.getHttpServer())
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaCompleta)
                .expect(201);

            expect(Number(res.body.exitPrice)).toBeCloseTo(110, 6);
            expect(Number(res.body.profitLoss)).toBeCloseTo(10, 6);

            await db.delete(schema.simulationLegs).where(eq(schema.simulationLegs.id, res.body.id));
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
            // cria pelo menos uma perna antes
            await supertest(app.getHttpServer())
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaParaTeste)
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

    describe('PATCH /api/simulations/:id/legs/:legId', () => {
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
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaParaTeste)
                .expect(201);

            pernaId = legRes.body.id;
        });

        it('Deve atualizar preço de saída da perna.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}/legs/${pernaId}`)
                .send({ exitPrice: '115.00' })
                .expect(200)
                .expect((res) => {
                    expect(Number(res.body.exitPrice)).toBeCloseTo(115, 6);
                });
        });

        it('Deve atualizar múltiplos campos da perna.', () => {
            return supertest(app.getHttpServer())
                .patch(`/api/simulations/${simulacaoId}/legs/${pernaId}`)
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
                .patch(`/api/simulations/${simulacaoId}/legs/${UUID_INEXISTENTE}`)
                .send({ exitPrice: '125.00' })
                .expect(404);
        });
    });

    describe('DELETE /api/simulations/:id/legs/:legId', () => {
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
                .post(`/api/simulations/${simulacaoId}/legs`)
                .send(pernaParaTeste)
                .expect(201);

            pernaParaDeletar = res.body.id;
        });

        it('Deve deletar uma perna existente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/${simulacaoId}/legs/${pernaParaDeletar}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Perna deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar perna inexistente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/simulations/${simulacaoId}/legs/${UUID_INEXISTENTE}`)
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

            const legRes = await supertest(app.getHttpServer())
                .post(`/api/simulations/${simId}/legs`)
                .send(pernaParaTeste)
                .expect(201);

            const legId = legRes.body.id;

            const getRes = await supertest(app.getHttpServer())
                .get(`/api/simulations/${simId}`)
                .expect(200);

            expect(getRes.body.legs.length).toBeGreaterThan(0);

            await supertest(app.getHttpServer())
                .patch(`/api/simulations/${simId}/legs/${legId}`)
                .send({
                    exitPrice: '105.00',
                    profitLoss: '5.00',
                })
                .expect(200);

            await supertest(app.getHttpServer())
                .patch(`/api/simulations/${simId}`)
                .send({
                    simulationName: 'Fluxo Completo Atualizado',
                    totalReturn: '500.00',
                    returnPercentage: '5.00',
                })
                .expect(200);

            await supertest(app.getHttpServer())
                .delete(`/api/simulations/${simId}/legs/${legId}`)
                .expect(200);

            await supertest(app.getHttpServer())
                .delete(`/api/simulations/${simId}`)
                .expect(200);

            await supertest(app.getHttpServer())
                .get(`/api/simulations/${simId}`)
                .expect(404);
        });
    });
});
