/**
 * Módulo que agrupa o controller e service de usuários.
 * Responsável por encapsular toda a lógica de gerenciamento de usuários.
 */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }