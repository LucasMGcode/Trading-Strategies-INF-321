/**
 * Controller responsável por gerenciar as rotas relacionadas a estratégias.
 * Define os endpoints REST para CRUD de estratégias e suas pernas.
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
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { CreateStrategyLegDto } from './dto/create-strategy-leg.dto';
import { StrategiesService, StrategyFilters } from './strategies.service';

/**
 * Controller para gerenciar estratégias
 * Rota base: /api/strategies
 */
@Controller('strategies')
export class StrategiesController {
    constructor(private readonly strategiesService: StrategiesService) {
        console.log('[StrategiesController] strategiesService =', strategiesService);
    }

    /**
     * GET /api/strategies
     * Obtém todas as estratégias com filtros opcionais
     * 
     * Query Parameters:
     * - proficiencyLevel: NOVICE | INTERMEDIATE | ADVANCED | EXPERT
     * - marketOutlook: BULLISH | BEARISH | NEUTRAL
     * - volatilityView: HIGH | NEUTRAL | LOW
     * - riskProfile: CAPPED | UNCAPPED
     * - rewardProfile: CAPPED | UNCAPPED
     * - strategyType: CAPITAL_GAIN | INCOME | PROTECTION
     * 
     * Exemplo: GET /api/strategies?marketOutlook=BULLISH&proficiencyLevel=INTERMEDIATE
     */
    @Get()
    async getAllStrategies(@Query() filters?: StrategyFilters) {
        return this.strategiesService.getAllStrategies(filters);
    }

    /**
     * GET /api/strategies/:id
     * Obtém uma estratégia específica com suas pernas
     * 
     * Parâmetros:
     * - id: UUID da estratégia
     * 
     * Resposta:
     * {
     *   id: string,
     *   name: string,
     *   description: string,
     *   proficiencyLevel: string,
     *   marketOutlook: string,
     *   volatilityView: string,
     *   riskProfile: string,
     *   rewardProfile: string,
     *   strategyType: string,
     *   legs: [
     *     {
     *       id: string,
     *       strategyId: string,
     *       action: 'BUY' | 'SELL',
     *       instrumentType: 'CALL' | 'PUT' | 'STOCK',
     *       quantityRatio: number,
     *       strikeRelation: 'ATM' | 'ITM' | 'OTM'
     *     }
     *   ]
     * }
     */
    @Get(':id')
    async getStrategyById(@Param('id') id: string) {
        return this.strategiesService.getStrategyById(id);
    }

    /**
     * POST /api/strategies
     * Cria uma nova estratégia
     * 
     * Body:
     * {
     *   name: string (obrigatório),
     *   summary?: string,
     *   description?: string,
     *   proficiencyLevel: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
     *   marketOutlook: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
     *   volatilityView: 'HIGH' | 'NEUTRAL' | 'LOW',
     *   riskProfile: 'CAPPED' | 'UNCAPPED',
     *   rewardProfile: 'CAPPED' | 'UNCAPPED',
     *   strategyType: 'CAPITAL_GAIN' | 'INCOME' | 'PROTECTION'
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createStrategy(@Body() createStrategyDto: CreateStrategyDto) {
        return this.strategiesService.createStrategy(createStrategyDto);
    }

    /**
     * PATCH /api/strategies/:id
     * Atualiza uma estratégia existente
     * 
     * Parâmetros:
     * - id: UUID da estratégia
     * 
     * Body: Qualquer campo de CreateStrategyDto (todos opcionais)
     */
    @Patch(':id')
    async updateStrategy(
        @Param('id') id: string,
        @Body() updateStrategyDto: UpdateStrategyDto,
    ) {
        return this.strategiesService.updateStrategy(id, updateStrategyDto);
    }

    /**
     * DELETE /api/strategies/:id
     * Deleta uma estratégia e suas pernas (cascade)
     * 
     * Parâmetros:
     * - id: UUID da estratégia
     */
    @Delete(':id')
    async deleteStrategy(@Param('id') id: string) {
        return this.strategiesService.deleteStrategy(id);
    }

    /**
     * GET /api/strategies/:id/legs
     * Obtém todas as pernas de uma estratégia
     * 
     * Parâmetros:
     * - id: UUID da estratégia
     */
    @Get(':id/legs')
    async getStrategyLegs(@Param('id') id: string) {
        return this.strategiesService.getStrategyLegs(id);
    }

    /**
     * POST /api/strategies/legs
     * Adiciona uma perna a uma estratégia
     * 
     * Body:
     * {
     *   strategyId: string (UUID da estratégia),
     *   action: 'BUY' | 'SELL',
     *   instrumentType: 'CALL' | 'PUT' | 'STOCK',
     *   quantityRatio: number (ex: 1, 2, 3),
     *   strikeRelation: 'ATM' | 'ITM' | 'OTM'
     * }
     */
    @Post('legs')
    @HttpCode(HttpStatus.CREATED)
    async addStrategyLeg(@Body() createLegDto: CreateStrategyLegDto) {
        return this.strategiesService.addStrategyLeg(createLegDto);
    }

    /**
     * DELETE /api/strategies/legs/:legId
     * Deleta uma perna de estratégia
     * 
     * Parâmetros:
     * - legId: UUID da perna
     */
    @Delete('legs/:legId')
    async deleteStrategyLeg(@Param('legId') legId: string) {
        return this.strategiesService.deleteStrategyLeg(legId);
    }
}