/**
 * Testes de integração - Usuários
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { ExperienceLevel } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

describe('Usuários Testes de Integração', () => {
    let app: INestApplication;
    let usuarioId: string;

    const UUID_INEXISTENTE = '123e4567-e89b-12d3-a456-426614174000';
    const senhaHash = bcrypt.hashSync('comfortably_Pass73', 10);

    const usuarioParaTeste = {
        username: 'David Jon Gilmour',
        email: 'david.gilmour@rock.lsd',
        passwordHash: senhaHash,
        experienceLevel: ExperienceLevel.NOVICE,
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
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/users', () => {

        it('Deve criar um novo usuário com sucesso.', () => {
            return request(app.getHttpServer())
                .post('/api/users')
                .send(usuarioParaTeste)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('username', usuarioParaTeste.username);
                    expect(res.body).toHaveProperty('email', usuarioParaTeste.email);
                    expect(res.body).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
                    usuarioId = res.body.id;
                });
        });

        it('Deve retornar erro 400 se dados obrigatórios faltarem.', () => {
            const dadosIncompletos = { username: 'Apenas Nome da Silva' };

            return request(app.getHttpServer())
                .post('/api/users')
                .send(dadosIncompletos)
                .expect(400);
        });

        it('Deve retornar erro 400 se email for inválido.', async () => {
            const dadosInvalidos = {
                username: 'Nick Manson',
                email: '@nick-manson',
                passwordHash: senhaHash,
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .send(dadosInvalidos)
                .expect(400);
        });

        it('Deve retornar erro 400 se email já existe.', async () => {
            try {
                await request(app.getHttpServer()).post('/api/users').send(usuarioParaTeste);

                const dadosDuplicados = {
                    username: 'Syd Barrett',
                    email: usuarioParaTeste.email,
                    passwordHash: senhaHash,
                };

                await request(app.getHttpServer())
                    .post('/api/users')
                    .send(dadosDuplicados)
                    .expect(400);

            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, usuarioParaTeste.email));
            }
        });

        it('Deve criar usuário com experienceLevel padrão.', async () => {
            const usuarioSemNivelEmail = 'richard.wright@ufv.com';
            const usuarioSemNivel = {
                username: 'Richard Wright',
                email: usuarioSemNivelEmail,
                passwordHash: senhaHash,
            };

            try {
                await request(app.getHttpServer())
                    .post('/api/users')
                    .send(usuarioSemNivel)
                    .expect(201)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
                    });

            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, usuarioSemNivelEmail));
            }
        });

        afterAll(async () => {
            await db.delete(schema.users).where(eq(schema.users.email, usuarioParaTeste.email));
        });
    });

    describe('GET /api/users/:id/profile', () => {

        let profileUserId: string;
        const profileEmail = `profile.${Date.now()}@ufv.br`;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    ...usuarioParaTeste,
                    email: profileEmail,
                })
                .expect(201);

            profileUserId = res.body.id;
        });

        it('Deve retornar o perfil de um usuário.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${profileUserId}/profile`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', profileUserId);
                    expect(res.body).toHaveProperty('username', usuarioParaTeste.username);
                    expect(res.body).toHaveProperty('email', profileEmail);
                    expect(res.body).toHaveProperty('experienceLevel');
                });
        });

        it('Deve retornar erro 404 se usuário não existir.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${UUID_INEXISTENTE}/profile`)
                .expect(404);
        });

        it('Deve retornar perfil com todos os campos.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${profileUserId}/profile`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('username');
                    expect(res.body).toHaveProperty('email');
                    expect(res.body).toHaveProperty('passwordHash');
                    expect(res.body).toHaveProperty('experienceLevel');
                    expect(res.body).toHaveProperty('createdAt');
                    expect(res.body).toHaveProperty('updatedAt');
                });
        });

        afterAll(async () => {
            await db.delete(schema.users).where(eq(schema.users.id, profileUserId));
        });
    });

    describe('PATCH /api/users/:id/profile', () => {

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    username: 'Bob Klose',
                    email: `bob.klose.${Date.now()}@ufv.br`,
                    passwordHash: senhaHash,
                    experienceLevel: ExperienceLevel.INTERMEDIATE
                })
                .expect(201);

            usuarioId = res.body.id;
        });

        afterEach(async () => {
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve atualizar username do usuário.', () => {
            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send({ username: 'George Roger Waters' })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('username', 'George Roger Waters');
                });
        });

        it('Deve atualizar email do usuário.', () => {
            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send({ email: 'the.dark.side@ofThe.moon' })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('email', 'the.dark.side@ofThe.moon');
                });
        });

        it('Deve atualizar experienceLevel do usuário.', () => {
            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send({ experienceLevel: ExperienceLevel.ADVANCED })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('experienceLevel', ExperienceLevel.ADVANCED);
                });
        });

        it('Deve atualizar múltiplos campos simultaneamente.', () => {
            const username = 'Roger Keith "Syd" Barrett';
            const email = 'roger.barrett@lsd.br';
            const atualizacao = {
                username,
                email,
                experienceLevel: ExperienceLevel.EXPERT,
            };

            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send(atualizacao)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('username', username);
                    expect(res.body).toHaveProperty('email', email);
                    expect(res.body).toHaveProperty('experienceLevel', ExperienceLevel.EXPERT);
                });
        });

        it('Deve retornar erro 404 ao atualizar usuário inexistente.', () => {
            return request(app.getHttpServer())
                .patch(`/api/users/${UUID_INEXISTENTE}/profile`)
                .send({ username: 'The lunatic' })
                .expect(404);
        });

        it('Deve retornar erro 400 se novo email já existe.', async () => {
            const emailDuplicado = `bob.klose.${Date.now()}@ufv.br`;

            let outroId: string | undefined;

            try {
                const resOutro = await request(app.getHttpServer())
                    .post('/api/users')
                    .send({
                        username: 'Roy Harper',
                        email: emailDuplicado,
                        passwordHash: senhaHash,
                    })
                    .expect(201);

                outroId = resOutro.body.id;

                await request(app.getHttpServer())
                    .patch(`/api/users/${usuarioId}/profile`)
                    .send({ email: emailDuplicado })
                    .expect(400);
            } finally {
                if (outroId) {
                    await db.delete(schema.users).where(eq(schema.users.id, outroId));
                }
            }
        });

        it('Deve permitir manter o mesmo email ao atualizar.', () => {
            const atualizacao = {
                username: 'Waters',
                email: 'waters@ufv.br',
            };

            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send(atualizacao)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('email', 'waters@ufv.br');
                });
        });

        it('Deve retornar erro 400 se email for inválido.', () => {
            const atualizacao = {
                email: '@gilmor-david',
            };

            return request(app.getHttpServer())
                .patch(`/api/users/${usuarioId}/profile`)
                .send(atualizacao)
                .expect(400);
        });
    });

    describe('GET /api/users/:id/statistics', () => {

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    username: 'statisticas usuário',
                    email: `statisticas.teste.${Date.now()}@ufv.br`,
                    passwordHash: senhaHash,
                    experienceLevel: ExperienceLevel.NOVICE,
                })
                .expect(201);

            usuarioId = res.body.id;
        });

        afterEach(async () => {
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve retornar estatísticas de um usuário.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${usuarioId}/statistics`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', usuarioId);
                    expect(res.body).toHaveProperty('username');
                    expect(res.body).toHaveProperty('email');
                    expect(res.body).toHaveProperty('experienceLevel');
                    expect(res.body).toHaveProperty('createdAt');
                    expect(res.body).toHaveProperty('updatedAt');
                });
        });

        it('Não deve retornar passwordHash nas estatísticas.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${usuarioId}/statistics`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).not.toHaveProperty('passwordHash');
                });
        });

        it('Deve retornar erro 404 se usuário não existir.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${UUID_INEXISTENTE}/statistics`)
                .expect(404);
        });
    });

    describe('GET /api/users/:id/exists', () => {

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    username: 'Usuário Existe',
                    email: `Existe.${Date.now()}@ufv.br`,
                    passwordHash: senhaHash,
                })
                .expect(201);

            usuarioId = res.body.id;
        });

        afterEach(async () => {
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve retornar true se usuário existe.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${usuarioId}/exists`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('exists', true);
                });
        });

        it('Deve retornar false se usuário não existe.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${UUID_INEXISTENTE}/exists`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('exists', false);
                });
        });

        it('Deve retornar objeto com propriedade exists.', () => {
            return request(app.getHttpServer())
                .get(`/api/users/${usuarioId}/exists`)
                .expect(200)
                .expect((res) => {
                    expect(typeof res.body.exists).toBe('boolean');
                });
        });
    });

    describe('DELETE /api/users/:id', () => {
        let usuarioParaDeletar: string;

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    username: `Delete usuário`,
                    email: `usuario.delete-${Date.now()}@ufv.ufv`,
                    passwordHash: senhaHash,
                })
                .expect(201);

            usuarioParaDeletar = res.body.id;
        });

        afterEach(async () => {
            await db.delete(schema.users).where(eq(schema.users.id, usuarioParaDeletar));
        });

        it('Deve deletar um usuário existente.', () => {
            return request(app.getHttpServer())
                .delete(`/api/users/${usuarioParaDeletar}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toEqual({ message: 'Usuário deletado com sucesso' });
                });
        });

        it('Deve retornar erro 404 ao deletar usuário inexistente.', () => {
            return request(app.getHttpServer())
                .delete(`/api/users/${UUID_INEXISTENTE}`)
                .expect(404);
        });

        it('Deve impedir acesso ao perfil após deleção.', () => {
            return request(app.getHttpServer())
                .delete(`/api/users/${usuarioParaDeletar}`)
                .expect(200)
                .then(() => {
                    return request(app.getHttpServer())
                        .get(`/api/users/${usuarioParaDeletar}/profile`)
                        .expect(404);
                });
        });
    });

    describe('Testes de fluxo completo', () => {
        let usuarioFluxo: string;

        afterEach(async () => {
            if (usuarioFluxo) {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioFluxo));
            }
        });

        it('Deve criar, atualizar e deletar um usuário.', async () => {
            const usuarioDoFluxo = 'Usuário do fluxo';
            const usuarioDoFluxoAtt = 'Atualizado usuário do fluxo';

            const emailFluxo = `fluxo.user.${Date.now()}@ufv.br`;

            const createRes = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    username: usuarioDoFluxo,
                    email: emailFluxo,
                    passwordHash: senhaHash,
                    experienceLevel: ExperienceLevel.NOVICE,
                })
                .expect(201);

            usuarioFluxo = createRes.body.id;

            const getRes = await request(app.getHttpServer())
                .get(`/api/users/${usuarioFluxo}/profile`)
                .expect(200);

            expect(getRes.body).toHaveProperty('username', usuarioDoFluxo);

            const updateRes = await request(app.getHttpServer())
                .patch(`/api/users/${usuarioFluxo}/profile`)
                .send({
                    username: usuarioDoFluxoAtt,
                    experienceLevel: ExperienceLevel.ADVANCED,
                })
                .expect(200);

            expect(updateRes.body).toHaveProperty('username', usuarioDoFluxoAtt);

            const statsRes = await request(app.getHttpServer())
                .get(`/api/users/${usuarioFluxo}/statistics`)
                .expect(200);

            expect(statsRes.body).toHaveProperty('username', usuarioDoFluxoAtt);

            await request(app.getHttpServer())
                .delete(`/api/users/${usuarioFluxo}`)
                .expect(200);

            await request(app.getHttpServer())
                .get(`/api/users/${usuarioFluxo}/profile`)
                .expect(404);
        });
    });
});
