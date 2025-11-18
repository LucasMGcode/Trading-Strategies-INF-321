/**
 * DTO para atualizar estratégia
 *
 * Todos os campos são opcionais (update parcial).
 */
import {
    IsString,
    IsEnum,
    IsOptional,
} from 'class-validator';
import {
    ProficiencyLevel,
    MarketOutlook,
    VolatilityView,
    RiskProfile,
    RewardProfile,
    StrategyType,
} from './create-strategy.dto';

export class UpdateStrategyDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ProficiencyLevel)
    proficiencyLevel?: ProficiencyLevel;

    @IsOptional()
    @IsEnum(MarketOutlook)
    marketOutlook?: MarketOutlook;

    @IsOptional()
    @IsEnum(VolatilityView)
    volatilityView?: VolatilityView;

    @IsOptional()
    @IsEnum(RiskProfile)
    riskProfile?: RiskProfile;

    @IsOptional()
    @IsEnum(RewardProfile)
    rewardProfile?: RewardProfile;

    @IsOptional()
    @IsEnum(StrategyType)
    strategyType?: StrategyType;
}
