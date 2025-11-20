/**
 * Testes de integração - Estratégias
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
} from './dto/create-strategy.dto';
import { StrategyInstrumentType, StrategyLegAction, StrikeRelation } from './dto/create-strategy-leg.dto';

describe('Estratégias Testes de Integração', () => {
    let app: INestApplication;
    let estrategiaId: string;

    const UUID_INEXISTENTE = '123e4567-e89b-12d3-a456-426614174000';
    const estrategiaSummary = 'Level 8, Ataque 3000, Defesa 2500, Tipo Condor/Light/Normal';
    const estrategiaDescription = 'Este Condor lendário é uma poderosa máquina de destruição. Praticamente invencível, muito poucos enfrentaram esta magnífica criatura e viveram para contar a história.';

    const estrategiaParaTeste = {
        name: 'Blue Eyes Iron Condor',
        summary: estrategiaSummary,
        description: estrategiaDescription,
        proficiencyLevel: ProficiencyLevel.ADVANCED,
        marketOutlook: MarketOutlook.BEARISH,
        volatilityView: VolatilityView.HIGH,
        riskProfile: RiskProfile.CAPPED,
        rewardProfile: RewardProfile.CAPPED,
        strategyType: StrategyType.PROTECTION,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule], }).compile();
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
    });

    afterAll(async () => {
        await db.delete(schema.strategies).where(eq(schema.strategies.summary, estrategiaSummary));
        await db.delete(schema.strategies).where(eq(schema.strategies.summary, 'Resumo atualizado via API'));
        await app.close();
    });

    describe('GET /api/strategies', () => {
        it('Deve retornar todas as estratégias.', () => {
            return supertest(app.getHttpServer())
                .get('/api/strategies')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBeGreaterThanOrEqual(0);
                });
        });

        it('Deve retornar estratégias filtradas por proficiencyLevel.', () => {
            return supertest(app.getHttpServer())
                .get('/api/strategies')
                .query({ proficiencyLevel: ProficiencyLevel.NOVICE })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    res.body.forEach((estrategia: any) => {
                        expect(estrategia.proficiencyLevel).toBe(ProficiencyLevel.NOVICE);
                    });
                });
        });

        it('Deve retornar estratégias filtradas por marketOutlook.', () => {
            return supertest(app.getHttpServer())
                .get('/api/strategies')
                .query({ marketOutlook: MarketOutlook.BULLISH })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    res.body.forEach((estrategia: any) => {
                        expect(estrategia.marketOutlook).toBe(MarketOutlook.BULLISH);
                    });
                });
        });

        it('Deve retornar estratégias com múltiplos filtros.', () => {
            return supertest(app.getHttpServer())
                .get('/api/strategies')
                .query({
                    proficiencyLevel: ProficiencyLevel.NOVICE,
                    marketOutlook: MarketOutlook.BULLISH,
                    volatilityView: VolatilityView.HIGH,
                })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    res.body.forEach((estrategia: any) => {
                        expect(estrategia.proficiencyLevel).toBe(ProficiencyLevel.NOVICE);
                        expect(estrategia.marketOutlook).toBe(MarketOutlook.BULLISH);
                        expect(estrategia.volatilityView).toBe(VolatilityView.HIGH);
                    });
                });
        });
    });

    describe('POST /api/strategies', () => {
        it('Deve criar uma nova estratégia com sucesso.', () => {
            return supertest(app.getHttpServer())
                .post('/api/strategies')
                .send(estrategiaParaTeste)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('name', estrategiaParaTeste.name);
                    expect(res.body).toHaveProperty('summary', estrategiaParaTeste.summary);
                    expect(res.body).toHaveProperty('proficiencyLevel', estrategiaParaTeste.proficiencyLevel);
                    estrategiaId = res.body.id;
                });
        });

        it('Deve retornar erro 400 se dados obrigatórios faltarem.', () => {
            const dadosIncompletos = {
                summary: 'Resumo sem nome',
                proficiencyLevel: ProficiencyLevel.NOVICE,
            };

            return supertest(app.getHttpServer())
                .post('/api/strategies')
                .send(dadosIncompletos)
                .expect(400);
        });

        it('Deve retornar erro 400 se enum inválido for fornecido.', () => {
            const dadosInvalidos = {
                ...estrategiaParaTeste,
                proficiencyLevel: 'INVALID_LEVEL',
            };

            return supertest(app.getHttpServer())
                .post('/api/strategies')
                .send(dadosInvalidos)
                .expect(400);
        });
    });

    describe('GET /api/strategies/:id', () => {
        beforeAll(async () => {
            const res = await supertest(app.getHttpServer())
                .post('/api/strategies')
                .send(estrategiaParaTeste);
            estrategiaId = res.body.id;
        });

        it('Deve retornar uma estratégia por ID.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/strategies/${estrategiaId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', estrategiaId);
                    expect(res.body).toHaveProperty('name', estrategiaParaTeste.name);
                    expect(res.body).toHaveProperty('legs');
                    expect(Array.isArray(res.body.legs)).toBe(true);
                });
        });

        it('Deve retornar erro 404 se estratégia não existir.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            return supertest(app.getHttpServer())
                .get(`/api/strategies/${idInexistente}`)
                .expect(404);
        });
    });

    describe('PATCH /api/strategies/:id', () => {
        it('Deve atualizar uma estratégia existente.', () => {
            const atualizacao = {
                summary: 'Resumo atualizado via API',
                description: 'Descrição atualizada via API',
            };

            return supertest(app.getHttpServer())
                .patch(`/api/strategies/${estrategiaId}`)
                .send(atualizacao)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', estrategiaId);
                    expect(res.body).toHaveProperty('summary', atualizacao.summary);
                    expect(res.body).toHaveProperty('description', atualizacao.description);
                });
        });

        it('Deve retornar erro 404 ao atualizar estratégia inexistente.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';
            const atualizacao = {
                summary: 'Novo resumo',
            };

            return supertest(app.getHttpServer())
                .patch(`/api/strategies/${idInexistente}`)
                .send(atualizacao)
                .expect(404);
        });
    });

    describe('DELETE /api/strategies/:id', () => {
        let estrategiaParaDeletar: string;

        beforeEach(async () => {
            const res = await supertest(app.getHttpServer())
                .post('/api/strategies')
                .send({
                    ...estrategiaParaTeste,
                    name: `Strategy to Delete ${Date.now()}`,
                });
            estrategiaParaDeletar = res.body.id;
        });

        it('Deve deletar uma estratégia existente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/strategies/${estrategiaParaDeletar}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Estratégia deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar estratégia inexistente.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            return supertest(app.getHttpServer())
                .delete(`/api/strategies/${idInexistente}`)
                .expect(404);
        });
    });

    describe('GET /api/strategies/:id/legs', () => {
        it('Deve retornar as pernas de uma estratégia.', () => {
            return supertest(app.getHttpServer())
                .get(`/api/strategies/${estrategiaId}/legs`)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('Deve retornar erro 404 se estratégia não existir.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            return supertest(app.getHttpServer())
                .get(`/api/strategies/${idInexistente}/legs`)
                .expect(404);
        });
    });

    describe('POST /api/strategies/legs', () => {
        it('Deve adicionar uma perna a uma estratégia.', async () => {
            const pernaParaTeste = {
                strategyId: estrategiaId,
                action: StrategyLegAction.BUY,
                instrumentType: StrategyInstrumentType.CALL,
                quantityRatio: 100,
                strikeRelation: StrikeRelation.ATM,
            };
            return supertest(app.getHttpServer())
                .post('/api/strategies/legs')
                .send(pernaParaTeste)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('strategyId', estrategiaId);
                    expect(res.body).toHaveProperty('action', pernaParaTeste.action);
                    expect(res.body).toHaveProperty('instrumentType', pernaParaTeste.instrumentType);
                    expect(res.body).toHaveProperty('quantityRatio', pernaParaTeste.quantityRatio);
                    expect(res.body).toHaveProperty('strikeRelation', pernaParaTeste.strikeRelation);
                });
        });

        it('Deve retornar erro 404 ao adicionar perna a estratégia inexistente.', () => {
            const pernaParaTesteInexistente = {
                strategyId: UUID_INEXISTENTE,
                action: StrategyLegAction.SELL,
                instrumentType: StrategyInstrumentType.PUT,
                quantityRatio: 1,
                strikeRelation: StrikeRelation.ITM,
            };

            return supertest(app.getHttpServer())
                .post('/api/strategies/legs')
                .send(pernaParaTesteInexistente)
                .expect(404);
        });

        it('Deve retornar erro 400 se dados obrigatórios faltarem.', () => {
            const pernaIncompleta = {
                strategyId: estrategiaId,
            };

            return supertest(app.getHttpServer())
                .post('/api/strategies/legs')
                .send(pernaIncompleta)
                .expect(400);
        });
    });

    describe('DELETE /api/strategies/legs/:legId', () => {
        let pernaId: string;

        beforeEach(async () => {
            const res = await supertest(app.getHttpServer())
                .post('/api/strategies/legs')
                .send({
                    strategyId: estrategiaId,
                    action: StrategyLegAction.BUY,
                    instrumentType: StrategyInstrumentType.CALL,
                    quantityRatio: 1,
                    strikeRelation: StrikeRelation.ATM,
                })
                .expect(201);

            pernaId = res.body.id;
        });

        it('Deve deletar uma perna de estratégia.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/strategies/legs/${pernaId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Perna deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar perna inexistente.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/strategies/legs/${UUID_INEXISTENTE}`)
                .expect(404);
        });
    });
});