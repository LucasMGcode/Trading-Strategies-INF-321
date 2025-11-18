/**
 * DTO para criar estratégia
 */
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
} from 'class-validator';

/**
 * Enums da estratégia
 */
export enum ProficiencyLevel {
    NOVICE = 'NOVICE',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
    EXPERT = 'EXPERT',
}

export enum MarketOutlook {
    BULLISH = 'BULLISH',
    BEARISH = 'BEARISH',
    NEUTRAL = 'NEUTRAL',
}

export enum VolatilityView {
    HIGH = 'HIGH',
    NEUTRAL = 'NEUTRAL',
    LOW = 'LOW',
}

export enum RiskProfile {
    CAPPED = 'CAPPED',
    UNCAPPED = 'UNCAPPED',
}

export enum RewardProfile {
    CAPPED = 'CAPPED',
    UNCAPPED = 'UNCAPPED',
}

export enum StrategyType {
    CAPITAL_GAIN = 'CAPITAL_GAIN',
    INCOME = 'INCOME',
    PROTECTION = 'PROTECTION',
}

export class CreateStrategyDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(ProficiencyLevel)
    proficiencyLevel: ProficiencyLevel;

    @IsEnum(MarketOutlook)
    marketOutlook: MarketOutlook;

    @IsEnum(VolatilityView)
    volatilityView: VolatilityView;

    @IsEnum(RiskProfile)
    riskProfile: RiskProfile;

    @IsEnum(RewardProfile)
    rewardProfile: RewardProfile;

    @IsEnum(StrategyType)
    strategyType: StrategyType;
}