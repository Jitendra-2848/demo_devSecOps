import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.POSTGRE_DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

(async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (err: any) {
    console.error("Database connection failed:", err.message);
  }
})();