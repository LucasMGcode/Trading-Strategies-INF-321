/**
 * DTO para criar perna de estratégia
 */
import {
    IsString,
    IsUUID,
    IsEnum,
    IsInt,
    Min,
    IsNotEmpty,
} from 'class-validator';

/**
 * Ação de perna da estratégia
 */
export enum StrategyLegAction {
    BUY = 'BUY',
    SELL = 'SELL',
}

/**
 * Tipo de instrumento da perna
 */
export enum StrategyInstrumentType {
    CALL = 'CALL',
    PUT = 'PUT',
    STOCK = 'STOCK',
}

/**
 * Relação do strike
 */
export enum StrikeRelation {
    ATM = 'ATM',
    ITM = 'ITM',
    OTM = 'OTM',
}

export class CreateStrategyLegDto {
    @IsUUID()
    @IsNotEmpty()
    strategyId: string;

    @IsEnum(StrategyLegAction)
    action: StrategyLegAction;

    @IsEnum(StrategyInstrumentType)
    instrumentType: StrategyInstrumentType;

    @IsInt()
    @Min(1)
    quantityRatio: number;

    @IsEnum(StrikeRelation)
    strikeRelation: StrikeRelation;
}
