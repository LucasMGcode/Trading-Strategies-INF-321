/**
 * DTO para criar perna de simulação
 */
import {
    IsString,
    IsUUID,
    IsEnum,
    IsInt,
    Min,
    IsOptional,
    IsNotEmpty,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

// Tipos de instrumento para uma perna de simulação
export enum InstrumentType {
    CALL = 'CALL',
    PUT = 'PUT',
    STOCK = 'STOCK',
}

// Ação em uma perna: compra ou venda
export enum LegAction {
    BUY = 'BUY',
    SELL = 'SELL',
}

export class CreateSimulationLegDto {
    @IsUUID()
    @IsNotEmpty()
    simulationId: string;

    @IsEnum(InstrumentType)
    instrumentType: InstrumentType;

    @IsEnum(LegAction)
    action: LegAction;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    entryPrice: string;

    @IsOptional()
    @IsString()
    exitPrice?: string;

    @Type(() => Date)
    @IsDate()
    entryDate: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    exitDate?: Date;

    @IsOptional()
    @IsString()
    profitLoss?: string;
}
