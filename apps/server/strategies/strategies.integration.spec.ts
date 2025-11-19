/**
 * Testes de integração - Estratégias
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

describe('Estratégias Testes de Integração', () => {
    let app: INestApplication;
    let estrategiaId: string;

    const estrategiaParaTeste = {
        name: 'Test Long Call',
        summary: 'Compra de uma call para teste',
        description: 'Estratégia bullish com risco limitado para testes',
        proficiencyLevel: ProficiencyLevel.NOVICE,
        marketOutlook: MarketOutlook.BULLISH,
        volatilityView: VolatilityView.HIGH,
        riskProfile: RiskProfile.CAPPED,
        rewardProfile: RewardProfile.UNCAPPED,
        strategyType: StrategyType.CAPITAL_GAIN,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        if (estrategiaId) {
            await db.delete(schema.strategyLegs).where(eq(schema.strategyLegs.strategyId, estrategiaId));
            await db.delete(schema.strategies).where(eq(schema.strategies.id, estrategiaId));
        }
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
                    expect(res.body).toHaveProperty('proficiencyLevel', ProficiencyLevel.NOVICE);
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

    describe('PUT /api/strategies/:id', () => {
        it('Deve atualizar uma estratégia existente.', () => {
            const atualizacao = {
                summary: 'Resumo atualizado via API',
                description: 'Descrição atualizada via API',
            };

            return supertest(app.getHttpServer())
                .put(`/api/strategies/${estrategiaId}`)
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
                .put(`/api/strategies/${idInexistente}`)
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

    describe('POST /api/strategies/:id/legs', () => {
        const pernaParaTeste = {
            legType: 'LONG_CALL',
            position: 'LONG',
            optionType: 'CALL',
            strikePrice: 100,
            quantity: 1,
        };

        it('Deve adicionar uma perna a uma estratégia.', () => {
            return supertest(app.getHttpServer())
                .post(`/api/strategies/${estrategiaId}/legs`)
                .send(pernaParaTeste)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('strategyId', estrategiaId);
                    expect(res.body).toHaveProperty('legType', pernaParaTeste.legType);
                    expect(res.body).toHaveProperty('strikePrice', pernaParaTeste.strikePrice);
                });
        });

        it('Deve retornar erro 404 ao adicionar perna a estratégia inexistente.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            return supertest(app.getHttpServer())
                .post(`/api/strategies/${idInexistente}/legs`)
                .send(pernaParaTeste)
                .expect(404);
        });

        it('Deve retornar erro 400 se dados obrigatórios faltarem.', () => {
            const pernaIncompleta = {
                legType: 'LONG_CALL',
                // Faltam outros campos obrigatórios
            };

            return supertest(app.getHttpServer())
                .post(`/api/strategies/${estrategiaId}/legs`)
                .send(pernaIncompleta)
                .expect(400);
        });
    });

    describe('DELETE /api/strategies/:strategyId/legs/:legId', () => {
        let pernaId: string;

        beforeEach(async () => {
            const res = await supertest(app.getHttpServer())
                .post(`/api/strategies/${estrategiaId}/legs`)
                .send({
                    legType: 'LONG_CALL',
                    position: 'LONG',
                    optionType: 'CALL',
                    strikePrice: 100,
                    quantity: 1,
                });
            pernaId = res.body.id;
        });

        it('Deve deletar uma perna de estratégia.', () => {
            return supertest(app.getHttpServer())
                .delete(`/api/strategies/${estrategiaId}/legs/${pernaId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Perna deletada com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar perna inexistente.', () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            return supertest(app.getHttpServer())
                .delete(`/api/strategies/${estrategiaId}/legs/${idInexistente}`)
                .expect(404);
        });
    });
});