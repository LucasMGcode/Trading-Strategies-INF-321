/**
 * DTO para atualizar perfil de usuário
 * Campos opcionais para suportar update parcial.
 */
import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { ExperienceLevel } from './create-user.dto';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;
}
