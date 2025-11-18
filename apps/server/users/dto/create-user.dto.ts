/**
 * DTO para criar usuário
 * (usado internamente, passwordHash gerado pelo AuthService)
 */
import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsEnum,
} from 'class-validator';

/**
 * Níveis de experiência do usuário
 */
export enum ExperienceLevel {
    NOVICE = 'NOVICE',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
    EXPERT = 'EXPERT',
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    // Hash da senha
    @IsString()
    @IsNotEmpty()
    passwordHash!: string;

    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;
}
