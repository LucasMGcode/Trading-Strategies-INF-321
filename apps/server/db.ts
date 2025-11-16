import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';

console.log('[DB] DATABASE_URL =', process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL não definida. Verifique o arquivo .env.');
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

import type {
    SelectUser,
    InsertUser,
    SelectStrategy,
    InsertStrategy,
    SelectStrategyLeg,
    InsertStrategyLeg,
    SelectSimulation,
    InsertSimulation,
    SelectSimulationLeg,
    InsertSimulationLeg,
    SelectExternalAccount,
    InsertExternalAccount,
} from '../../drizzle/schema';

export type {
    SelectUser,
    InsertUser,
    SelectStrategy,
    InsertStrategy,
    SelectStrategyLeg,
    InsertStrategyLeg,
    SelectSimulation,
    InsertSimulation,
    SelectSimulationLeg,
    InsertSimulationLeg,
    SelectExternalAccount,
    InsertExternalAccount,
};
