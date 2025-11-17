/**
 * DTO para atualizar simulação
 *
 * Todos os campos são opcionais, update é parcial.
 */
import {
    IsString,
    IsOptional,
} from 'class-validator';

export class UpdateSimulationDto {

    @IsOptional()
    @IsString()
    simulationName?: string;

    @IsOptional()
    @IsString()
    totalReturn?: string;

    @IsOptional()
    @IsString()
    returnPercentage?: string;

    @IsOptional()
    @IsString()
    maxDrawdown?: string;
}