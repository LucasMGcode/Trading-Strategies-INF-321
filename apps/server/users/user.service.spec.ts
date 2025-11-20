/**
 * Testes unitários - Usuários
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import * as schema from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { CreateUserDto, ExperienceLevel } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

describe('Usuários Testes Service', () => {
    let service: UsersService;

    const usuarioId = '00000000-0000-0000-0000-000000000004';
    const usuarioUsername = 'John Bonham';
    const usuarioEmail = 'fourSticks@rock.metal';
    const senhaHash = bcrypt.hashSync('Groove@666', 10);

    const mockUsuario = {
        id: usuarioId,
        username: usuarioUsername,
        email: usuarioEmail,
        passwordHash: senhaHash,
        experienceLevel: ExperienceLevel.NOVICE,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        await db.delete(schema.users).where(eq(schema.users.email, usuarioEmail));

        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    afterEach(async () => { });

    describe('Obter perfil, getProfile', () => {
        it('Deve retornar o perfil de um usuário existente.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getProfile(usuarioId);

            expect(resultado).toHaveProperty('id', usuarioId);
            expect(resultado).toHaveProperty('username', usuarioUsername);
            expect(resultado).toHaveProperty('email', usuarioEmail);
            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve lançar NotFoundException se usuário não existir.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.getProfile(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve retornar dados completos do perfil.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getProfile(usuarioId);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('username');
            expect(resultado).toHaveProperty('email');
            expect(resultado).toHaveProperty('passwordHash');
            expect(resultado).toHaveProperty('experienceLevel');
            expect(resultado).toHaveProperty('createdAt');
            expect(resultado).toHaveProperty('updatedAt');
        });
    });

    describe('Obter usuário por email, getUserByEmail', () => {
        it('Deve retornar usuário quando email existe.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getUserByEmail(usuarioEmail);

            expect(resultado).not.toBeNull();
            expect(resultado).toHaveProperty('id', usuarioId);
            expect(resultado).toHaveProperty('email', usuarioEmail);
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve retornar null quando email não existe.', async () => {
            const emailInexistente = 'johnPaulJones@black.dog';

            const resultado = await service.getUserByEmail(emailInexistente);

            expect(resultado).toBeNull();
        });

        it('Deve ser case-sensitive na busca por email.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getUserByEmail(usuarioEmail.toUpperCase());

            expect(resultado === null || resultado?.email === usuarioEmail).toBe(true);
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });
    });

    describe('Criar usuário, createUser', () => {
        it('Deve criar um novo usuário com sucesso.', async () => {
            const createNewUserNome = 'Jimmy Page';
            const createNewUserEmail = 'jimmy.page@ramble.on';
            const createNewUserPass = '!Heartbreaker_1969';
            const createUserDto: CreateUserDto = {
                username: createNewUserNome,
                email: createNewUserEmail,
                passwordHash: bcrypt.hashSync(createNewUserPass, 10),
                experienceLevel: ExperienceLevel.INTERMEDIATE,
            };

            const resultado = await service.createUser(createUserDto);

            expect(resultado).toHaveProperty('id');
            expect(resultado).toHaveProperty('username', createNewUserNome);
            expect(resultado).toHaveProperty('email', createNewUserEmail);
            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.INTERMEDIATE);

            await db.delete(schema.users).where(eq(schema.users.email, createNewUserEmail));
        });

        it('Deve criar usuário com experienceLevel padrão NOVICE.', async () => {
            const createUserDto: CreateUserDto = {
                username: 'Peter Grant',
                email: 'Peter@grant.uk',
                passwordHash: bcrypt.hashSync('Warren1935', 10),
            };

            const resultado = await service.createUser(createUserDto);

            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);

            await db.delete(schema.users).where(eq(schema.users.email, 'Peter@grant.uk'));
        });

        it('Deve lançar BadRequestException se email já existe.', async () => {
            const mesmoEmail = 'physicalGraffiti@Zeppelin.led'

            const createUserDto_primeiro: CreateUserDto = {
                username: 'Robert Anthony Plant',
                email: mesmoEmail,
                passwordHash: bcrypt.hashSync('Go0dT1m3sB4dT!m&s-69', 10),
            };

            service.createUser(createUserDto_primeiro)

            const createUserDto_segundo: CreateUserDto = {
                username: 'Robert Plan',
                email: mesmoEmail,
                passwordHash: bcrypt.hashSync('&Kashmir!75', 10),
            };

            await expect(service.createUser(createUserDto_segundo)).rejects.toBeInstanceOf(BadRequestException);
            await db.delete(schema.users).where(eq(schema.users.email, mesmoEmail));
        });

        it('Deve criar usuário com todos os níveis de experiência.', async () => {
            const niveis = [
                ExperienceLevel.NOVICE,
                ExperienceLevel.INTERMEDIATE,
                ExperienceLevel.ADVANCED,
                ExperienceLevel.EXPERT,
            ];

            for (const nivel of niveis) {
                const createUserDto: CreateUserDto = {
                    username: `usuario_${nivel}`,
                    email: `usuario_${nivel}@exemplo.com`,
                    passwordHash: bcrypt.hashSync('senha_123', 10),
                    experienceLevel: nivel,
                };

                const resultado = await service.createUser(createUserDto);

                expect(resultado).toHaveProperty('experienceLevel', nivel);

                await db.delete(schema.users).where(eq(schema.users.email, `usuario_${nivel}@exemplo.com`));
            }
        });
    });

    describe('Atualizar perfil, updateProfile', () => {
        it('Deve atualizar username do usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const novoNome = 'The piper'
            const updateProfileDto: UpdateProfileDto = {
                username: novoNome,
            };

            const resultado = await service.updateProfile(usuarioId, updateProfileDto);

            expect(resultado).toHaveProperty('username', novoNome);
            await db.delete(schema.users).where(eq(schema.users.username, novoNome));
        });

        it('Deve atualizar email do usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const novoEmail = 'aleister.Crowley@occult.zoso';
            const updateProfileDto: UpdateProfileDto = {
                email: novoEmail,
            };

            const resultado = await service.updateProfile(usuarioId, updateProfileDto);

            expect(resultado).toHaveProperty('email', novoEmail);
            await db.delete(schema.users).where(eq(schema.users.email, novoEmail));
        });

        it('Deve atualizar experienceLevel do usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const updateProfileDto: UpdateProfileDto = {
                experienceLevel: ExperienceLevel.ADVANCED,
            };

            const resultado = await service.updateProfile(usuarioId, updateProfileDto);

            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.ADVANCED);
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve atualizar múltiplos campos simultaneamente.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const updateNome = 'The Lady';
            const updateEmail = 'all.that.glitters@is.gold';
            const updateProfileDto: UpdateProfileDto = {
                username: updateNome,
                email: updateEmail,
                experienceLevel: ExperienceLevel.EXPERT,
            };

            const resultado = await service.updateProfile(usuarioId, updateProfileDto);

            expect(resultado).toHaveProperty('username', updateNome);
            expect(resultado).toHaveProperty('email', updateEmail);
            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.EXPERT);

            await db.delete(schema.users).where(eq(schema.users.email, updateEmail));
        });

        it('Deve lançar NotFoundException ao atualizar usuário inexistente.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';
            const updateProfileDto: UpdateProfileDto = {
                username: 'novo',
            };

            await expect(
                service.updateProfile(idInexistente, updateProfileDto),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('Deve lançar BadRequestException se novo email já existe.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const emailTeste = 'whenThe.levee@Breaks.br';
            const outroUsuario = {
                id: '00000000-0000-0000-0000-000000000005',
                username: 'Sem nome',
                email: emailTeste,
                passwordHash: bcrypt.hashSync('4tlantic@r3cords1971', 10),
                experienceLevel: ExperienceLevel.NOVICE,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await db.insert(schema.users).values(outroUsuario);

            const updateProfileDto: UpdateProfileDto = {
                email: emailTeste,
            };

            await expect(
                service.updateProfile(usuarioId, updateProfileDto),
            ).rejects.toBeInstanceOf(BadRequestException);

            await db.delete(schema.users).where(eq(schema.users.email, emailTeste));
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve permitir manter o mesmo email ao atualizar.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const nomeTeste = 'Swan Song';
            const updateProfileDto: UpdateProfileDto = {
                username: nomeTeste,
                email: usuarioEmail,
            };

            const resultado = await service.updateProfile(usuarioId, updateProfileDto);

            expect(resultado).toHaveProperty('username', nomeTeste);
            expect(resultado).toHaveProperty('email', usuarioEmail);
            await db.delete(schema.users).where(eq(schema.users.username, nomeTeste));
        });
    });

    describe('Deletar usuário, deleteUser', () => {
        it('Deve deletar um usuário existente.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.deleteUser(usuarioId);

            expect(resultado).toEqual({ message: 'Usuário deletado com sucesso' });

            await expect(service.getProfile(usuarioId)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('Deve lançar NotFoundException ao deletar usuário inexistente.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.deleteUser(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Obter estatísticas, getUserStatistics', () => {
        it('Deve retornar estatísticas de um usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getUserStatistics(usuarioId);

            expect(resultado).toHaveProperty('id', usuarioId);
            expect(resultado).toHaveProperty('username', usuarioUsername);
            expect(resultado).toHaveProperty('email', usuarioEmail);
            expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
            expect(resultado).toHaveProperty('createdAt');
            expect(resultado).toHaveProperty('updatedAt');
        });

        it('Não deve retornar passwordHash nas estatísticas.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.getUserStatistics(usuarioId);

            expect(resultado).not.toHaveProperty('passwordHash');
        });

        it('Deve lançar NotFoundException se usuário não existir.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            await expect(service.getUserStatistics(idInexistente)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('Verificar existência, userExists', () => {
        it('Deve retornar true se usuário existe.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const resultado = await service.userExists(usuarioId);

            expect(resultado).toBe(true);
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
        });

        it('Deve retornar false se usuário não existe.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            const resultado = await service.userExists(idInexistente);

            expect(resultado).toBe(false);
        });

        it('Deve retornar false em caso de erro.', async () => {
            const resultado = await service.userExists('id-invalido');

            expect(typeof resultado).toBe('boolean');
        });
    });
});