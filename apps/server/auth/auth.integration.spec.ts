import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../app.module';
import { ExperienceLevel } from './dto/register.dto';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

/*
- 200 OK: A requisição foi bem-sucedida.
- 201 Created: Um novo recurso foi criado com sucesso.
- 301 Moved Permanently: O recurso foi movido permanentemente para um novo endereço (redirecionamento).
- 400 Bad Request: A requisição do cliente é inválida ou malformada.
- 401 Unauthorized: O usuário não está autenticado e não tem permissão para acessar o recurso.
- 403 Forbidden: O servidor nega o acesso ao recurso, independentemente da autenticação.
- 404 Not Found: O recurso solicitado não foi encontrado no servidor.
- 500 Internal Server Error: Um erro genérico interno ocorreu no servidor.
- 503 Service Unavailable: O servidor está temporariamente indisponível (sobrecarga ou manutenção).
*/

describe('Autenticação Testes de Integração', () => {
    let app: INestApplication;
    const usuarioNome = 'Salles Magalhaes';
    const usuarioEmail = 'Salles.Magalhaes@ufv.br';
    const usuarioPass = 'FloydWarshall@123'

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
        await db.delete(schema.users).where(eq(schema.users.email, usuarioEmail));
        await db.delete(schema.users).where(eq(schema.users.email, 'EmailFake@Cobol.com'));
        await app.close();
    });

    describe('POST /api/auth/register', () => {
        it('Deve realizar um POST e registrar um novo usuário.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: usuarioNome,
                    email: usuarioEmail,
                    password: usuarioPass,
                    experienceLevel: ExperienceLevel.EXPERT,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                    expect(res.body).toHaveProperty('user');
                    expect(res.body.user).toHaveProperty('id');
                    expect(res.body.user).toHaveProperty('username', usuarioNome);
                    expect(res.body.user).toHaveProperty('email', usuarioEmail);
                    expect(res.body.user).not.toHaveProperty(usuarioPass);
                    expect(res.body.user).toHaveProperty('passwordHash');
                });
        });

        it('Deve falhar se o usuário já existir.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: usuarioNome,
                    email: usuarioEmail,
                    password: usuarioPass,
                    experienceLevel: ExperienceLevel.EXPERT,
                })
                .expect(400);
        });

        it('Deve falhar com e-mail inválido.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: 'Erdna',
                    email: '@EmailFakeCobol.com',
                    password: '******',
                    experienceLevel: ExperienceLevel.INTERMEDIATE,
                })
                .expect(400);
        });

        it('Deve falhar com senha fraca.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    username: 'Cipriano',
                    email: 'EasterEgg@ufv.br',
                    password: 'fraca',
                    experienceLevel: ExperienceLevel.NOVICE,
                })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('Deve autenticar com credenciais corretas.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: usuarioEmail,
                    password: usuarioPass,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                    expect(res.body).toHaveProperty('user');
                    expect(res.body.user).toHaveProperty('email', usuarioEmail);
                });
        });

        it('Deve falhar com senha incorreta.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: usuarioEmail,
                    password: 'Senha@Errada!_',
                })
                .expect(401);
        });

        it('Deve falhar com usuário inexistente.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'impossivelExistir@yahoo.com',
                    password: usuarioPass,
                })
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let accessToken: string;
        beforeAll(async () => {
            const loginRes = await supertest(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: usuarioEmail,
                    password: usuarioPass,
                });
            accessToken = loginRes.body.accessToken;
        });

        it('Deve retornar o usuário atual com token válido.', () => {
            return supertest(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('email', usuarioEmail);
                    expect(res.body).toHaveProperty('username', usuarioNome);
                });
        });

        it('Deve falhar sem token.', () => {
            return supertest(app.getHttpServer()).get('/api/auth/me').expect(500);
        });

        it('Deve falhar com token inválido.', () => {
            return supertest(app.getHttpServer()).get('/api/auth/me').set('Authorization', 'Bearer invalid_token').expect(401);
        });
    });

    describe('POST /api/auth/change-password', () => {
        let accessToken: string;
        beforeAll(async () => {
            const loginRes = await supertest(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: usuarioEmail,
                    password: usuarioPass,
                });
            accessToken = loginRes.body.accessToken;
        });

        it('Deve alterar a senha com sucesso.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: usuarioPass,
                    newPassword: 'ArvoreDeFenwick@321',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toEqual({ message: "Senha alterada com sucesso" });
                });
        });

        it('Deve falhar com senha atual incorreta.', () => {
            return supertest(app.getHttpServer())
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'SenhaIncorreta@404',
                    newPassword: 'QualquerOutraSenha_@777',
                })
                .expect(401);
        });

        it("Deve falhar sem autenticação.", () => {
            return supertest(app.getHttpServer())
                .post("/api/auth/change-password")
                .send({
                    currentPassword: usuarioPass,
                    newPassword: "Nov4_S3nha!@2",
                })
                .expect(401);
        });
    });
});