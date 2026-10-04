import postgres from 'postgres';

// We import the Sql type so we don't have to use 'any'.
import { Sql } from 'postgres';

const globalForDb = global as unknown as { sql: Sql };

export const sql = globalForDb.sql || postgres(process.env.DATABASE_URL!, {
  max: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql;
}

export default sql;