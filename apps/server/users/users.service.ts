/**
 * Serviço responsável por todas as operações relacionadas a usuários.
 * Implementa a lógica de negócio para CRUD e gerenciamento de perfil.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, SelectUser, InsertUser } from '../../server/db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    /**
     * Obtém o perfil de um usuário
     */
    async getProfile(userId: string): Promise<SelectUser> {
        try {
            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, userId))
                .limit(1);

            if (!user) {
                throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
            }

            return user;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[UsersService] Erro ao obter perfil:', error);
            throw new BadRequestException('Erro ao obter perfil');
        }
    }

    /**
     * Obtém um usuário por email
     */
    async getUserByEmail(email: string): Promise<SelectUser | null> {
        try {
            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.email, email))
                .limit(1);

            return user ?? null;
        } catch (error) {
            console.error('[UsersService] Erro ao obter usuário por email:', error);
            throw new BadRequestException('Erro ao obter usuário');
        }
    }

    /**
     * Cria um novo usuário
     */
    async createUser(createUserDto: CreateUserDto): Promise<SelectUser> {
        try {
            // Verificar se email já existe
            const existingUser = await this.getUserByEmail(createUserDto.email);
            if (existingUser) {
                throw new BadRequestException('Email já está em uso');
            }

            const [user] = await db
                .insert(schema.users)
                .values({
                    ...createUserDto,
                    experienceLevel: createUserDto.experienceLevel ?? 'NOVICE',
                })
                .returning();

            console.log(`[UsersService] Novo usuário criado: ${user.id}`);
            return user;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('[UsersService] Erro ao criar usuário:', error);
            throw new BadRequestException('Erro ao criar usuário');
        }
    }

    /**
     * Atualiza o perfil de um usuário
     */
    async updateProfile(
        userId: string,
        updateProfileDto: UpdateProfileDto,
    ): Promise<SelectUser> {
        try {
            // Verificar se usuário existe
            await this.getProfile(userId);

            // Se email está sendo atualizado, verificar se já existe
            if (updateProfileDto.email) {
                const existingUser = await this.getUserByEmail(updateProfileDto.email);
                if (existingUser && existingUser.id !== userId) {
                    throw new BadRequestException('Email já está em uso');
                }
            }

            const [user] = await db
                .update(schema.users)
                .set({
                    ...updateProfileDto,
                    updatedAt: new Date(),
                })
                .where(eq(schema.users.id, userId))
                .returning();

            console.log(`[UsersService] Perfil atualizado: ${userId}`);
            return user;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('[UsersService] Erro ao atualizar perfil:', error);
            throw new BadRequestException('Erro ao atualizar perfil');
        }
    }

    /**
     * Deleta um usuário
     */
    async deleteUser(userId: string): Promise<{ message: string }> {
        try {
            // Verificar se usuário existe
            await this.getProfile(userId);

            await db.delete(schema.users).where(eq(schema.users.id, userId));

            console.log(`[UsersService] Usuário deletado: ${userId}`);
            return { message: 'Usuário deletado com sucesso' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[UsersService] Erro ao deletar usuário:', error);
            throw new BadRequestException('Erro ao deletar usuário');
        }
    }

    /**
     * Obtém estatísticas de um usuário
     */
    async getUserStatistics(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        experienceLevel: string;
        createdAt: Date;
        updatedAt: Date;
    }> {
        try {
            const user = await this.getProfile(userId);

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                experienceLevel: user.experienceLevel,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('[UsersService] Erro ao obter estatísticas:', error);
            throw new BadRequestException('Erro ao obter estatísticas');
        }
    }

    /**
     * Verifica se um usuário existe
     */
    async userExists(userId: string): Promise<boolean> {
        try {
            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, userId))
                .limit(1);

            return !!user;
        } catch (error) {
            console.error('[UsersService] Erro ao verificar existência do usuário:', error);
            return false;
        }
    }
}