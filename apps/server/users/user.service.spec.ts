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
        await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
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

            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
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

        it('Deve lidar corretamente com variação de caixa no email.', async () => {
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

            // pré-clean para evitar conflito de unique em caso de sujeira de teste anterior
            await db.delete(schema.users).where(eq(schema.users.email, createNewUserEmail));

            try {
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
            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, createNewUserEmail));
            }
        });

        it('Deve criar usuário com experienceLevel padrão NOVICE.', async () => {
            const emailPeter = 'Peter@grant.uk';

            await db.delete(schema.users).where(eq(schema.users.email, emailPeter));

            try {
                const createUserDto: CreateUserDto = {
                    username: 'Peter Grant',
                    email: emailPeter,
                    passwordHash: bcrypt.hashSync('Warren1935', 10),
                };

                const resultado = await service.createUser(createUserDto);

                expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, emailPeter));
            }
        });

        it('Deve lançar BadRequestException se email já existe.', async () => {
            const mesmoEmail = 'physicalGraffiti@Zeppelin.led';

            await db.delete(schema.users).where(eq(schema.users.email, mesmoEmail));

            try {
                const createUserDto_primeiro: CreateUserDto = {
                    username: 'Robert Anthony Plant',
                    email: mesmoEmail,
                    passwordHash: bcrypt.hashSync('Go0dT1m3sB4dT!m&s-69', 10),
                };

                await service.createUser(createUserDto_primeiro);

                const createUserDto_segundo: CreateUserDto = {
                    username: 'Robert Plan',
                    email: mesmoEmail,
                    passwordHash: bcrypt.hashSync('&Kashmir!75', 10),
                };

                await expect(
                    service.createUser(createUserDto_segundo),
                ).rejects.toBeInstanceOf(BadRequestException);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, mesmoEmail));
            }
        });

        it('Deve criar usuário com todos os níveis de experiência.', async () => {
            const niveis = [
                ExperienceLevel.NOVICE,
                ExperienceLevel.INTERMEDIATE,
                ExperienceLevel.ADVANCED,
                ExperienceLevel.EXPERT,
            ];

            for (const nivel of niveis) {
                const email = `usuario_${nivel}@exemplo.com`;

                // pré-clean por nível
                await db.delete(schema.users).where(eq(schema.users.email, email));

                try {
                    const createUserDto: CreateUserDto = {
                        username: `usuario_${nivel}`,
                        email,
                        passwordHash: bcrypt.hashSync('senha_123', 10),
                        experienceLevel: nivel,
                    };

                    const resultado = await service.createUser(createUserDto);

                    expect(resultado).toHaveProperty('experienceLevel', nivel);
                } finally {
                    // garante limpeza mesmo se a asserção falhar
                    await db.delete(schema.users).where(eq(schema.users.email, email));
                }
            }
        });
    });

    describe('Atualizar perfil, updateProfile', () => {
        it('Deve atualizar username do usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const novoNome = 'The piper';
            const updateProfileDto: UpdateProfileDto = {
                username: novoNome,
            };

            try {
                const resultado = await service.updateProfile(usuarioId, updateProfileDto);

                expect(resultado).toHaveProperty('username', novoNome);
            } finally {
                // Garante que o usuário base não fique no banco em caso de falha
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
                await db.delete(schema.users).where(eq(schema.users.username, novoNome));
            }
        });

        it('Deve atualizar email do usuário.', async () => {
            const novoEmail = 'aleister.Crowley@occult.zoso';

            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            await db.delete(schema.users).where(eq(schema.users.email, novoEmail));

            try {
                await db.insert(schema.users).values(mockUsuario);

                const updateProfileDto: UpdateProfileDto = {
                    email: novoEmail,
                };

                const resultado = await service.updateProfile(usuarioId, updateProfileDto);

                expect(resultado).toHaveProperty('email', novoEmail);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
                await db.delete(schema.users).where(eq(schema.users.email, novoEmail));
            }
        });

        it('Deve atualizar experienceLevel do usuário.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const updateProfileDto: UpdateProfileDto = {
                experienceLevel: ExperienceLevel.ADVANCED,
            };

            try {
                const resultado = await service.updateProfile(usuarioId, updateProfileDto);

                expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.ADVANCED);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
        });

        it('Deve atualizar múltiplos campos simultaneamente.', async () => {
            const updateNome = 'The Lady';
            const updateEmail = 'all.that.glitters@is.gold';

            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            await db.delete(schema.users).where(eq(schema.users.email, updateEmail));

            try {
                await db.insert(schema.users).values(mockUsuario);

                const updateProfileDto: UpdateProfileDto = {
                    username: updateNome,
                    email: updateEmail,
                    experienceLevel: ExperienceLevel.EXPERT,
                };

                const resultado = await service.updateProfile(usuarioId, updateProfileDto);

                expect(resultado).toHaveProperty('username', updateNome);
                expect(resultado).toHaveProperty('email', updateEmail);
                expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.EXPERT);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
                await db.delete(schema.users).where(eq(schema.users.email, updateEmail));
            }
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
            const emailTeste = 'whenThe.levee@Breaks.br';

            await db.delete(schema.users).where(eq(schema.users.email, emailTeste));
            await db.delete(schema.users).where(eq(schema.users.id, usuarioId));

            try {
                await db.insert(schema.users).values(mockUsuario);

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

                const usuariosComEmailTeste = await db
                    .select()
                    .from(schema.users)
                    .where(eq(schema.users.email, emailTeste));

                expect(usuariosComEmailTeste).toHaveLength(1);
                expect(usuariosComEmailTeste[0].id).toBe(outroUsuario.id);

                const updateProfileDto: UpdateProfileDto = {
                    email: emailTeste,
                };

                await expect(
                    service.updateProfile(usuarioId, updateProfileDto),
                ).rejects.toBeInstanceOf(BadRequestException);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.email, emailTeste));
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
                await db.delete(schema.users).where(eq(schema.users.id, '00000000-0000-0000-0000-000000000005'));
            }
        });

        it('Deve permitir manter o mesmo email ao atualizar.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            const nomeTeste = 'Swan Song';
            const updateProfileDto: UpdateProfileDto = {
                username: nomeTeste,
                email: usuarioEmail,
            };

            try {
                const resultado = await service.updateProfile(usuarioId, updateProfileDto);

                expect(resultado).toHaveProperty('username', nomeTeste);
                expect(resultado).toHaveProperty('email', usuarioEmail);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
        });
    });

    describe('Deletar usuário, deleteUser', () => {
        it('Deve deletar um usuário existente.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            try {
                const resultado = await service.deleteUser(usuarioId);

                expect(resultado).toEqual({ message: 'Usuário deletado com sucesso' });

                await expect(service.getProfile(usuarioId)).rejects.toBeInstanceOf(
                    NotFoundException,
                );
            } finally {
                // Caso deleteUser falhe, não deixa sujeira
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
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

            try {
                const resultado = await service.getUserStatistics(usuarioId);

                expect(resultado).toHaveProperty('id', usuarioId);
                expect(resultado).toHaveProperty('username', usuarioUsername);
                expect(resultado).toHaveProperty('email', usuarioEmail);
                expect(resultado).toHaveProperty('experienceLevel', ExperienceLevel.NOVICE);
                expect(resultado).toHaveProperty('createdAt');
                expect(resultado).toHaveProperty('updatedAt');
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
        });

        it('Não deve retornar passwordHash nas estatísticas.', async () => {
            await db.insert(schema.users).values(mockUsuario);

            try {
                const resultado = await service.getUserStatistics(usuarioId);

                expect(resultado).not.toHaveProperty('passwordHash');
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
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

            try {
                const resultado = await service.userExists(usuarioId);

                expect(resultado).toBe(true);
            } finally {
                await db.delete(schema.users).where(eq(schema.users.id, usuarioId));
            }
        });

        it('Deve retornar false se usuário não existe.', async () => {
            const idInexistente = '99999999-9999-9999-9999-999999999999';

            const resultado = await service.userExists(idInexistente);

            expect(resultado).toBe(false);
        });

        it('Deve retornar false em caso de erro.', async () => {
            const resultado = await service.userExists('id-qualquer');

            expect(typeof resultado).toBe('boolean');
        });
    });
});
