/**
 * Serviço responsável por todas as operações relacionadas a autenticação.
 * Implementa lógica de login, registro, JWT e gerenciamento de sessão.
 */
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db, SelectUser, InsertUser } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

/**
 * DTO para registro de usuário
 */
export class RegisterDto {
    username!: string;
    email!: string;
    password!: string;
    experienceLevel?: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

/**
 * DTO para login
 */
export class LoginDto {
    email!: string;
    password!: string;
}

/**
 * DTO para atualizar senha
 */
export class ChangePasswordDto {
    currentPassword!: string;
    newPassword!: string;
}

/**
 * Interface para payload do JWT
 */
export interface JwtPayload {
    sub: string;
    email: string;
    username: string;
}

/**
 * Interface para resposta de autenticação
 */
export interface AuthResponse {
    user: SelectUser;
    accessToken: string;
    refreshToken?: string;
}

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    /**
     * Registra um novo usuário
     */
    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        try {
            // Verificar se email já existe
            const existingUser = await this.getUserByEmail(registerDto.email);
            if (existingUser) {
                throw new BadRequestException('Email já está em uso');
            }

            // Hash da senha
            const passwordHash = await this.hashPassword(registerDto.password);

            // Criar usuário
            const [user] = await db
                .insert(schema.users)
                .values({
                    username: registerDto.username,
                    email: registerDto.email,
                    passwordHash,
                    experienceLevel: registerDto.experienceLevel ?? 'NOVICE',
                })
                .returning();

            console.log(`[AuthService] Novo usuário registrado: ${user.id}`);

            // Gerar tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            return {
                user,
                accessToken,
                refreshToken,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('[AuthService] Erro ao registrar usuário:', error);
            throw new BadRequestException('Erro ao registrar usuário');
        }
    }

    /**
     * Faz login de um usuário
     */
    async login(loginDto: LoginDto): Promise<AuthResponse> {
        try {
            // Buscar usuário por email
            const user = await this.getUserByEmail(loginDto.email);
            if (!user) {
                throw new UnauthorizedException('Email ou senha inválidos');
            }

            // Verificar senha
            const isPasswordValid = await this.verifyPassword(
                loginDto.password,
                user.passwordHash,
            );
            if (!isPasswordValid) {
                throw new UnauthorizedException('Email ou senha inválidos');
            }

            // Atualizar lastSignedIn
            await db
                .update(schema.users)
                .set({ updatedAt: new Date() })
                .where(eq(schema.users.id, user.id));

            console.log(`[AuthService] Usuário fez login: ${user.id}`);

            // Gerar tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            return {
                user,
                accessToken,
                refreshToken,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            console.error('[AuthService] Erro ao fazer login:', error);
            throw new BadRequestException('Erro ao fazer login');
        }
    }

    /**
     * Valida um token JWT
     */
    async validateToken(token: string): Promise<JwtPayload> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
            });
            return payload;
        } catch (error) {
            console.error('[AuthService] Token inválido:', error);
            throw new UnauthorizedException('Token inválido');
        }
    }

    /**
     * Obtém o usuário atual a partir do token
     */
    async getCurrentUser(userId: string): Promise<SelectUser> {
        try {
            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, userId))
                .limit(1);

            if (!user) {
                throw new UnauthorizedException('Usuário não encontrado');
            }

            return user;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            console.error('[AuthService] Erro ao obter usuário atual:', error);
            throw new BadRequestException('Erro ao obter usuário');
        }
    }

    /**
     * Muda a senha de um usuário
     */
    async changePassword(
        userId: string,
        changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        try {
            // Obter usuário
            const user = await this.getCurrentUser(userId);

            // Verificar senha atual
            const isPasswordValid = await this.verifyPassword(
                changePasswordDto.currentPassword,
                user.passwordHash,
            );
            if (!isPasswordValid) {
                throw new BadRequestException('Senha atual inválida');
            }

            // Hash da nova senha
            const newPasswordHash = await this.hashPassword(changePasswordDto.newPassword);

            // Atualizar senha
            await db
                .update(schema.users)
                .set({
                    passwordHash: newPasswordHash,
                    updatedAt: new Date(),
                })
                .where(eq(schema.users.id, userId));

            console.log(`[AuthService] Senha alterada para usuário: ${userId}`);

            return { message: 'Senha alterada com sucesso' };
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof UnauthorizedException
            ) {
                throw error;
            }
            console.error('[AuthService] Erro ao alterar senha:', error);
            throw new BadRequestException('Erro ao alterar senha');
        }
    }

    /**
     * Faz logout de um usuário (invalidar token no frontend)
     */
    async logout(userId: string): Promise<{ message: string }> {
        try {
            console.log(`[AuthService] Usuário fez logout: ${userId}`);
            return { message: 'Logout realizado com sucesso' };
        } catch (error) {
            console.error('[AuthService] Erro ao fazer logout:', error);
            throw new BadRequestException('Erro ao fazer logout');
        }
    }

    /**
     * ============================================================================
     * MÉTODOS AUXILIARES
     * ============================================================================
     */

    /**
     * Hash de senha com bcrypt
     */
    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    /**
     * Verifica se a senha corresponde ao hash
     */
    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Gera um access token JWT
     */
    private generateAccessToken(user: SelectUser): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };

        return this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            expiresIn: '1h',
        });
    }

    /**
     * Gera um refresh token JWT
     */
    private generateRefreshToken(user: SelectUser): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };

        return this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            expiresIn: '7d',
        });
    }

    /**
     * Busca um usuário por email
     */
    private async getUserByEmail(email: string): Promise<SelectUser | null> {
        try {
            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.email, email))
                .limit(1);

            return user ?? null;
        } catch (error) {
            console.error('[AuthService] Erro ao buscar usuário por email:', error);
            return null;
        }
    }
}