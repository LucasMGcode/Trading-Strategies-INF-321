import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    numeric,
    timestamp,
    date,
    pgEnum,
} from 'drizzle-orm/pg-core';

// Níveis de experiência do usuário: categorizam a familiaridade do investidor.
export const experienceLevelEnum = pgEnum('experience_level', [
    'NOVICE',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT',
]);

// Complexidade de uma estratégia pré-definida.
export const proficiencyLevelEnum = pgEnum('proficiency_level', [
    'NOVICE',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT',
]);

// Perspectiva de mercado para a qual uma estratégia é projetada.
export const marketOutlookEnum = pgEnum('market_outlook', [
    'BULLISH',
    'BEARISH',
    'NEUTRAL',
]);

// Ambiente de volatilidade esperado para uma estratégia.
export const volatilityViewEnum = pgEnum('volatility_view', [
    'HIGH',
    'NEUTRAL',
    'LOW',
]);

// Exposição máxima ao risco de uma estratégia.
export const riskProfileEnum = pgEnum('risk_profile', [
    'CAPPED',
    'UNCAPPED',
]);

// Potencial de recompensa que caracteriza uma estratégia.
export const rewardProfileEnum = pgEnum('reward_profile', [
    'CAPPED',
    'UNCAPPED',
]);

// Objetivo principal de uma estratégia.
export const strategyTypeEnum = pgEnum('strategy_type', [
    'CAPITAL_GAIN',
    'INCOME',
    'PROTECTION',
]);

// Lado de compra ou venda utilizado em pernas e operações.
export const actionEnum = pgEnum('action_type', [
    'BUY',
    'SELL',
]);

// Tipo de instrumento: opção ou ação.
export const instrumentTypeEnum = pgEnum('instrument_type', [
    'CALL',
    'PUT',
    'STOCK',
]);

// Relação do preço de exercício com o ativo subjacente na entrada.
// ATM // At The Money
// No Dinheiro
// ITM // In The Money
// Dentro do Dinheiro
// OTM // Out of The Money
// Fora do Dinheiro
export const strikeRelationEnum = pgEnum('strike_relation', [
    'ATM', // At The Money
    'ITM', // In The Money
    'OTM', // Out of The Money
]);

/**
 * Tabela de usuários: representa os investidores que interagem com o sistema.
 */
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    experienceLevel: experienceLevelEnum('experience_level').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});

/**
 * Tabela de estratégias: armazena estratégias de opções pré-definidas.
 */
export const strategies = pgTable('strategies', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    summary: text('summary'),
    description: text('description'),
    proficiencyLevel: proficiencyLevelEnum('proficiency_level').notNull(),
    marketOutlook: marketOutlookEnum('market_outlook').notNull(),
    volatilityView: volatilityViewEnum('volatility_view').notNull(),
    riskProfile: riskProfileEnum('risk_profile').notNull(),
    rewardProfile: rewardProfileEnum('reward_profile').notNull(),
    strategyType: strategyTypeEnum('strategy_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});

/**
 * Tabela de pernas de estratégia: define cada perna ("leg") de uma estratégia de opções multi-perna.
 */
export const strategyLegs = pgTable('strategy_legs', {
    id: uuid('id').defaultRandom().primaryKey(),
    strategyId: uuid('strategy_id')
        .notNull()
        .references(() => strategies.id, { onDelete: 'cascade' }),
    action: actionEnum('action').notNull(),
    instrumentType: instrumentTypeEnum('instrument_type').notNull(),
    quantityRatio: integer('quantity_ratio').notNull(),
    strikeRelation: strikeRelationEnum('strike_relation').notNull(),
});

/**
 * Tabela de simulações: registra o backtest ou operação em papel de um usuário para uma determinada estratégia.
 */
export const simulations = pgTable('simulations', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    strategyId: uuid('strategy_id')
        .notNull()
        .references(() => strategies.id, { onDelete: 'cascade' }),
    assetSymbol: varchar('asset_symbol', { length: 20 }).notNull(),
    simulationName: varchar('simulation_name', { length: 255 }).notNull(),
    startDate: date('start_date', { mode: 'date'}).notNull(),
    endDate: date('end_date', { mode: 'date'}).notNull(),
    initialCapital: numeric('initial_capital', { precision: 18, scale: 2 }).notNull(),
    totalReturn: numeric('total_return', { precision: 18, scale: 2 }),
    returnPercentage: numeric('return_percentage', { precision: 18, scale: 4 }),
    maxDrawdown: numeric('max_drawdown', { precision: 18, scale: 4 }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

/**
 * Tabela de pernas de simulação: registra as operações executadas dentro de uma simulação.
 */
export const simulationLegs = pgTable('simulation_legs', {
    id: uuid('id').defaultRandom().primaryKey(),
    simulationId: uuid('simulation_id')
        .notNull()
        .references(() => simulations.id, { onDelete: 'cascade' }),
    instrumentType: instrumentTypeEnum('instrument_type').notNull(),
    action: actionEnum('action').notNull(),
    quantity: integer('quantity').notNull(),
    entryPrice: numeric('entry_price', { precision: 18, scale: 2 }).notNull(),
    exitPrice: numeric('exit_price', { precision: 18, scale: 2 }),
    entryDate: timestamp('entry_date', { withTimezone: false }).notNull(),
    exitDate: timestamp('exit_date', { withTimezone: false }),
    profitLoss: numeric('profit_loss', { precision: 18, scale: 2 }),
});

/**
 * Tabela de contas externas: armazena provedores OAuth/OpenID e tokens associados aos usuários.
 */
export const externalAccounts = pgTable('external_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
        .defaultNow()
        .notNull(),
});

// Exporta tipos de leitura - $inferSelect
export type SelectUser = typeof users.$inferSelect;
export type SelectStrategy = typeof strategies.$inferSelect;
export type SelectStrategyLeg = typeof strategyLegs.$inferSelect;
export type SelectSimulation = typeof simulations.$inferSelect;
export type SelectSimulationLeg = typeof simulationLegs.$inferSelect;
export type SelectExternalAccount = typeof externalAccounts.$inferSelect;

// Exporta tipos de inserção - $inferInsert
export type InsertUser           = typeof users.$inferInsert;
export type InsertStrategy       = typeof strategies.$inferInsert;
export type InsertStrategyLeg    = typeof strategyLegs.$inferInsert;
export type InsertSimulation     = typeof simulations.$inferInsert;
export type InsertSimulationLeg  = typeof simulationLegs.$inferInsert;
export type InsertExternalAccount= typeof externalAccounts.$inferInsert;
