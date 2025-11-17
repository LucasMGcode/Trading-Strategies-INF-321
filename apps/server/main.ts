/**
 * Ponto de entrada da aplicação. Inicializa o servidor NestJS e configura
 * middlewares, filtros de exceção e outras configurações globais.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Habilitar CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });

    // Validação global de DTOs
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Prefixo global de rotas
    app.setGlobalPrefix('api');

    const port = process.env.SERVER_PORT || 3001;

    await app.listen(port, () => {
        console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║   Trading Strategies API - NestJS                          ║
    ║                                                            ║
    ║   Server rodando em: http://localhost:${port}                 ║
    ║                                                            ║
    ║   Endpoints disponíveis:                                   ║
    ║   - GET    /api/strategies                                 ║
    ║   - GET    /api/strategies/:id                             ║
    ║   - GET    /api/simulations/user/:userId                   ║
    ║   - GET    /api/users/:id/profile                          ║
    ║   - GET    /api/auth/me                                    ║
    ║                                                            ║
    ║   Documentação: http://localhost:${port}/api/docs             ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    ` );
    });
}

bootstrap().catch((error) => {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
});