/**
 * Controller responsável por gerenciar as rotas relacionadas a usuários.
 * Define os endpoints REST para gerenciamento de perfil e dados de usuário.
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/**
 * Controller para gerenciar usuários
 * Rota base: /api/users
 */
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * GET /api/users/:id/profile
     * Obtém o perfil de um usuário
     * 
     * Parâmetros:
     * - id: UUID do usuário
     * 
     * Resposta:
     * {
     *   id: string,
     *   username: string,
     *   email: string,
     *   passwordHash: string,
     *   experienceLevel: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
     *   createdAt: Date,
     *   updatedAt: Date
     * }
     */
    @Get(':id/profile')
    async getProfile(@Param('id') userId: string) {
        return this.usersService.getProfile(userId);
    }

    /**
     * PATCH /api/users/:id/profile
     * Atualiza o perfil de um usuário
     * 
     * Parâmetros:
     * - id: UUID do usuário
     * 
     * Body:
     * {
     *   username?: string,
     *   email?: string,
     *   experienceLevel?: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
     * }
     */
    @Patch(':id/profile')
    async updateProfile(
        @Param('id') userId: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(userId, updateProfileDto);
    }

    /**
     * POST /api/users
     * Cria um novo usuário
     * 
     * Body:
     * {
     *   username: string,
     *   email: string,
     *   passwordHash: string,
     *   experienceLevel?: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto);
    }

    /**
     * DELETE /api/users/:id
     * Deleta um usuário
     * 
     * Parâmetros:
     * - id: UUID do usuário
     */
    @Delete(':id')
    async deleteUser(@Param('id') userId: string) {
        return this.usersService.deleteUser(userId);
    }

    /**
     * GET /api/users/:id/statistics
     * Obtém estatísticas de um usuário
     * 
     * Parâmetros:
     * - id: UUID do usuário
     */
    @Get(':id/statistics')
    async getUserStatistics(@Param('id') userId: string) {
        return this.usersService.getUserStatistics(userId);
    }

    /**
     * GET /api/users/:id/exists
     * Verifica se um usuário existe
     * 
     * Parâmetros:
     * - id: UUID do usuário
     * 
     * Resposta:
     * {
     *   exists: boolean
     * }
     */
    @Get(':id/exists')
    async userExists(@Param('id') userId: string) {
        const exists = await this.usersService.userExists(userId);
        return { exists };
    }
}