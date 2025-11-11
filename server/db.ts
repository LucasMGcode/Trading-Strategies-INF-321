import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

// Singleton - Pool de conexões PostgreSQL - usa DATABASE_URL do .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Instância do Drizzle ORM
export const db = drizzle(pool, { schema });

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
} from '../drizzle/schema';

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
} from '../drizzle/schema';