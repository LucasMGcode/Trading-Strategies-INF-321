/**
 * Guard para proteger rotas que requerem autenticação.
 * Valida o JWT token enviado no header Authorization.
 */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Token não fornecido');
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
            });

            // Adicionar payload ao request para uso posterior
            request.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Token inválido');
        }
    }
}