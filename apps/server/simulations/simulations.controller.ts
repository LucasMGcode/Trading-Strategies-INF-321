/**
 * Controller responsável por gerenciar as rotas relacionadas a simulações.
 * Define os endpoints REST para CRUD de simulações e suas pernas.
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    SimulationsService,
    PaginationOptions,
} from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateSimulationLegDto } from './dto/create-simulation-leg.dto';

/**
 * Controller para gerenciar simulações
 * Rota base: /api/simulations
 */
@Controller('simulations')
export class SimulationsController {
    constructor(private readonly simulationsService: SimulationsService) { }

    /**
     * GET /api/simulations/user/:userId
     * Obtém todas as simulações de um usuário com paginação
     * 
     * Parâmetros:
     * - userId: UUID do usuário
     * 
     * Query Parameters:
     * - limit: número de resultados (padrão: sem limite)
     * - offset: número de registros a pular (padrão: 0)
     * - orderBy: 'recent' | 'oldest' (padrão: 'recent')
     * 
     * Exemplo: GET /api/simulations/user/123?limit=10&offset=0&orderBy=recent
     */
    @Get('user/:userId')
    async getUserSimulations(
        @Param('userId') userId: string,
        @Query() options?: PaginationOptions,
    ) {
        return this.simulationsService.getUserSimulations(userId, options);
    }

    /**
     * GET /api/simulations/:id
     * Obtém uma simulação específica com suas pernas
     * 
     * Parâmetros:
     * - id: UUID da simulação
     * 
     * Resposta:
     * {
     *   id: string,
     *   userId: string,
     *   strategyId: string,
     *   assetSymbol: string,
     *   simulationName: string,
     *   startDate: Date,
     *   endDate: Date,
     *   initialCapital: string,
     *   totalReturn: string,
     *   returnPercentage: string,
     *   maxDrawdown: string,
     *   createdAt: Date,
     *   legs: [...]
     * }
     */
    @Get(':id')
    async getSimulationById(@Param('id') id: string) {
        return this.simulationsService.getSimulationById(id);
    }

    /**
     * POST /api/simulations
     * Cria uma nova simulação
     * 
     * Body:
     * {
     *   userId: string (UUID do usuário),
     *   strategyId: string (UUID da estratégia),
     *   assetSymbol: string (ex: 'AAPL'),
     *   simulationName: string,
     *   startDate: Date,
     *   endDate: Date,
     *   initialCapital: string (ex: '10000.00')
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createSimulation(@Body() createSimulationDto: CreateSimulationDto) {
        return this.simulationsService.createSimulation(createSimulationDto);
    }

    /**
     * PATCH /api/simulations/:id
     * Atualiza uma simulação existente
     * 
     * Parâmetros:
     * - id: UUID da simulação
     * 
     * Body: Qualquer campo de UpdateSimulationDto (todos opcionais)
     * {
     *   simulationName?: string,
     *   totalReturn?: string,
     *   returnPercentage?: string,
     *   maxDrawdown?: string
     * }
     */
    @Patch(':id')
    async updateSimulation(
        @Param('id') id: string,
        @Body() updateSimulationDto: UpdateSimulationDto,
    ) {
        return this.simulationsService.updateSimulation(id, updateSimulationDto);
    }

    /**
     * DELETE /api/simulations/:id
     * Deleta uma simulação e suas pernas (cascade)
     * 
     * Parâmetros:
     * - id: UUID da simulação
     */
    @Delete(':id')
    async deleteSimulation(@Param('id') id: string) {
        return this.simulationsService.deleteSimulation(id);
    }

    /**
     * GET /api/simulations/:id/legs
     * Obtém todas as pernas de uma simulação
     * 
     * Parâmetros:
     * - id: UUID da simulação
     */
    @Get(':id/legs')
    async getSimulationLegs(@Param('id') id: string) {
        return this.simulationsService.getSimulationLegs(id);
    }

    /**
     * POST /api/simulations/legs
     * Adiciona uma perna a uma simulação
     * 
     * Body:
     * {
     *   simulationId: string (UUID da simulação),
     *   instrumentType: 'CALL' | 'PUT' | 'STOCK',
     *   action: 'BUY' | 'SELL',
     *   quantity: number,
     *   entryPrice: string (ex: '150.50'),
     *   exitPrice?: string,
     *   entryDate: Date,
     *   exitDate?: Date,
     *   profitLoss?: string
     * }
     */
    @Post('legs')
    @HttpCode(HttpStatus.CREATED)
    async addSimulationLeg(@Body() createLegDto: CreateSimulationLegDto) {
        return this.simulationsService.addSimulationLeg(createLegDto);
    }

    /**
     * POST /api/simulations/legs/batch
     * Adiciona múltiplas pernas a uma simulação
     * 
     * Body: Array de CreateSimulationLegDto
     * [
     *   { simulationId, instrumentType, action, quantity, ... },
     *   { simulationId, instrumentType, action, quantity, ... }
     * ]
     */
    @Post('legs/batch')
    @HttpCode(HttpStatus.CREATED)
    async addMultipleSimulationLegs(@Body() legs: CreateSimulationLegDto[]) {
        return this.simulationsService.addMultipleSimulationLegs(legs);
    }

    /**
     * PATCH /api/simulations/legs/:legId
     * Atualiza uma perna de simulação
     * 
     * Parâmetros:
     * - legId: UUID da perna
     * 
     * Body: Qualquer campo de CreateSimulationLegDto (todos opcionais)
     */
    @Patch('legs/:legId')
    async updateSimulationLeg(
        @Param('legId') legId: string,
        @Body() updateData: Partial<CreateSimulationLegDto>,
    ) {
        return this.simulationsService.updateSimulationLeg(legId, updateData);
    }

    /**
     * DELETE /api/simulations/legs/:legId
     * Deleta uma perna de simulação
     * 
     * Parâmetros:
     * - legId: UUID da perna
     */
    @Delete('legs/:legId')
    async deleteSimulationLeg(@Param('legId') legId: string) {
        return this.simulationsService.deleteSimulationLeg(legId);
    }

    /**
     * GET /api/simulations/user/:userId/statistics
     * Obtém estatísticas de simulações de um usuário
     * 
     * Parâmetros:
     * - userId: UUID do usuário
     * 
     * Resposta:
     * {
     *   totalSimulations: number,
     *   profitableSimulations: number,
     *   losingSimulations: number,
     *   winRate: string,
     *   avgReturn: string
     * }
     */
    @Get('user/:userId/statistics')
    async getUserStatistics(@Param('userId') userId: string) {
        return this.simulationsService.getUserStatistics(userId);
    }
}