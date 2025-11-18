/**
 * Controller responsável por gerenciar as rotas relacionadas a autenticação.
 * Define os endpoints REST para registro, login, logout e gerenciamento de sessão.
 */
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from './auth.service';
import {
    Controller,
    Post,
    Get,
    Body,
    Headers,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';

/**
 * Controller para gerenciar autenticação
 * Rota base: /api/auth
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /api/auth/register
     * Registra um novo usuário
     * 
     * Body:
     * {
     *   username: string,
     *   email: string,
     *   password: string,
     *   experienceLevel?: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
     * }
     * 
     * Resposta:
     * {
     *   user: {
     *     id: string,
     *     username: string,
     *     email: string,
     *     experienceLevel: string,
     *     createdAt: Date,
     *     updatedAt: Date
     *   },
     *   accessToken: string,
     *   refreshToken: string
     * }
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        console.log('[AuthController] DTO recebido no controller:', registerDto);
        console.log('[AuthController] tipos:', {
            username: typeof (registerDto as any).username,
            email: typeof (registerDto as any).email,
            password: typeof (registerDto as any).password,
            experienceLevel: typeof (registerDto as any).experienceLevel,
        });

        return this.authService.register(registerDto);
    }

    /**
     * POST /api/auth/login
     * Faz login de um usuário
     * 
     * Body:
     * {
     *   email: string,
     *   password: string
     * }
     * 
     * Resposta:
     * {
     *   user: { ... },
     *   accessToken: string,
     *   refreshToken: string
     * }
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        console.log('[AuthController] login DTO:', loginDto);

        return this.authService.login(loginDto);
    }

    /**
     * GET /api/auth/me
     * Obtém o usuário atual (requer token no header)
     * 
     * Headers:
     * Authorization: Bearer <token>
     * 
     * Resposta:
     * {
     *   id: string,
     *   username: string,
     *   email: string,
     *   experienceLevel: string,
     *   createdAt: Date,
     *   updatedAt: Date
     * }
     */
    @Get('me')
    async getCurrentUser(@Headers('authorization') authHeader: string) {
        if (!authHeader) {
            throw new Error('Authorization header is required');
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.authService.getCurrentUser(payload.sub);
    }

    /**
     * POST /api/auth/change-password
     * Altera a senha do usuário (requer token no header)
     * 
     * Headers:
     * Authorization: Bearer <token>
     * 
     * Body:
     * {
     *   currentPassword: string,
     *   newPassword: string
     * }
     * 
     * Resposta:
     * {
     *   message: string
     * }
     */
    @Post('change-password')
    async changePassword(
        @Headers('authorization') authHeader: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        if (!authHeader) {
            throw new UnauthorizedException('Authorization header is required');
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.authService.changePassword(payload.sub, changePasswordDto);
    }

    /**
     * POST /api/auth/logout
     * Faz logout do usuário (requer token no header)
     * 
     * Headers:
     * Authorization: Bearer <token>
     * 
     * Resposta:
     * {
     *   message: string
     * }
     */
    @Post('logout')
    async logout(@Headers('authorization') authHeader: string) {
        if (!authHeader) {
            throw new Error('Authorization header is required');
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = await this.authService.validateToken(token);
        return this.authService.logout(payload.sub);
    }

    /**
     * POST /api/auth/validate-token
     * Valida um token JWT
     * 
     * Headers:
     * Authorization: Bearer <token>
     * 
     * Resposta:
     * {
     *   valid: boolean,
     *   payload: {
     *     sub: string,
     *     email: string,
     *     username: string,
     *     iat: number,
     *     exp: number
     *   }
     * }
     */
    @Post('validate-token')
    async validateToken(@Headers('authorization') authHeader: string) {
        if (!authHeader) {
            return { valid: false };
        }

        try {
            const token = authHeader.replace('Bearer ', '');
            const payload = await this.authService.validateToken(token);
            return { valid: true, payload };
        } catch (error) {
            return { valid: false };
        }
    }
}