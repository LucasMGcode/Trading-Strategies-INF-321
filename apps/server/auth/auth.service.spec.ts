/**
 * Testes unitários - Autenticação
 */ 
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ExperienceLevel } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

jest.mock('bcrypt');

describe('Autenticação Testes Service', () => {
    let service: AuthService;
    let jwtService: JwtService;
    const usuarioId = '00000000-0000-0000-0000-000000000000';
    const usuarioNome = 'Capivaristo';
    const usuarioEmail = 'Capivaristo@ufv.br';
    const usuarioPass = 'Capivaristo123';

    const mockUser = {
        id: usuarioId,
        username: usuarioNome,
        email: usuarioEmail,
        passwordHash: usuarioPass,
        experienceLevel: ExperienceLevel.NOVICE,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('jwt_token'),
        verify: jest.fn().mockReturnValue({ sub: usuarioId, email: usuarioEmail }),
    };

    beforeEach(async () => {
        await db.delete(schema.users).where(eq(schema.users.email, usuarioEmail));
        await db.delete(schema.users).where(eq(schema.users.email, 'Capivasco@ufv.br'));
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();
        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Registro/Cadastro, register', () => {
        it('Deve registrar um novo usuário com sucesso.', async () => {
            const registerDto = {
                username: 'Capivasco',
                email: 'Capivasco@ufv.br',
                password: 'capivasco@96',
                experienceLevel: ExperienceLevel.EXPERT,
            };

            jest.spyOn<any, any>(service as any, 'getUserByEmail').mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const resultado = await service.register(registerDto);
            expect(resultado).toHaveProperty('accessToken');
            expect(resultado).toHaveProperty('refreshToken');
            expect(resultado).toHaveProperty('user');
            expect(resultado.user).toMatchObject({
                username: registerDto.username,
                email: registerDto.email,
            });
            expect(resultado.user).toHaveProperty('id');
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
        });

        it('Deve gerar um erro se o usuário já existir.', async () => {
            const registerDto = {
                username: usuarioNome,
                email: usuarioEmail,
                password: usuarioPass,
                experienceLevel: ExperienceLevel.NOVICE,
            };

            jest.spyOn<any, any>(service as any, 'getUserByEmail').mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow('Email já está em uso');
        });
    });

    describe('Login', () => {
        it('Deve retornar tokens de acesso após o login bem-sucedido.', async () => {
            const loginDto = {
                email: usuarioEmail,
                password: usuarioPass,
            };

            jest.spyOn<any, any>(service as any, 'getUserByEmail').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const resultado = await service.login(loginDto);
            expect(resultado).toHaveProperty('accessToken');
            expect(resultado).toHaveProperty('refreshToken');
            expect(resultado).toHaveProperty('user');
            expect(resultado.user).toHaveProperty('email', loginDto.email);
            expect(jwtService.sign).toHaveBeenCalled();
        });

        it('Deve lançar UnauthorizedException se a senha estiver incorreta.', async () => {
            const consoleErroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const loginDto = {
                email: usuarioEmail,
                password: 'Senha_errada!',
            };

            jest.spyOn<any, any>(service as any, 'getUserByEmail').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
            consoleErroSpy.mockRestore();
        });

        it('Deve lançar UnauthorizedException se o usuário não for encontrado.', async () => {
            const loginDto = {
                email: 'naoExiste@ufv.br',
                password: 'senha123',
            };

            jest.spyOn<any, any>(service as any, 'getUserByEmail').mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('Validação do token', () => {
        it('Deve validar um token válido.', async () => {
            const token = 'valid_jwt_token';
            const resultado = await service.validateToken(token);
            expect(resultado).toHaveProperty('sub', usuarioId);
            expect(jwtService.verify).toHaveBeenCalledWith(token, {
                secret: expect.any(String),
            });
        });

        it('Deve lançar UnauthorizedException para token inválido.', async () => {
            const consoleErroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const token = 'invalid_token';
            (jwtService.verify as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Token inválido');
            });
            await expect(service.validateToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
            consoleErroSpy.mockRestore();
        });
    });

    describe('Mudança de senha', () => {
        it('Deve alterar a senha com sucesso.', async () => {
            const changePasswordDto = {
                currentPassword: 'SenhaAntiga123',
                newPassword: 'NovaSenha321',
            };

            jest.spyOn<any, any>(service as any, 'getCurrentUser').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

            const resultado = await service.changePassword(usuarioId, changePasswordDto);
            expect(resultado).toEqual({ message: 'Senha alterada com sucesso' });
            expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
        });

        it('Deve lançar UnauthorizedException se a senha atual estiver incorreta.', async () => {
            const changePasswordDto = {
                currentPassword: 'Senha_Errada!',
                newPassword: 'NovaSenha321',
            };

            jest.spyOn<any, any>(service as any, 'getCurrentUser').mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.changePassword(usuarioId, changePasswordDto)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});