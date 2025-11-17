/**
 * DTO para registro de usuário
 */
import {
    IsString,
    IsEmail,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';

export enum ExperienceLevel {
    NOVICE = 'NOVICE',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
    EXPERT = 'EXPERT',
}

export class RegisterDto {
    @IsString()
    username!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;
}