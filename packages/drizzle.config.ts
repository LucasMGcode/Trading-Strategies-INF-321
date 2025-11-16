import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const config: Config = {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};

export default config;
