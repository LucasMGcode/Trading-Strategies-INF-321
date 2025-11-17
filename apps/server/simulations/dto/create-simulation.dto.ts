/**
 * DTO para criar simulação
 */
import {
    IsString,
    IsUUID,
    IsNotEmpty,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSimulationDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsNotEmpty()
    strategyId: string;

    @IsString()
    @IsNotEmpty()
    assetSymbol: string;

    @IsString()
    @IsNotEmpty()
    simulationName: string;

    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @IsString()
    @IsNotEmpty()
    initialCapital: string;
}