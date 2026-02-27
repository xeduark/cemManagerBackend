import pkg from 'pg';
const { Pool } = pkg;

const connectWithRetry = () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  pool.query('SELECT 1')
    .then(() => {
      console.log('✅ Conectado a PostgreSQL');
    })
    .catch(err => {
      console.error('⏳ DB no lista, reintentando en 5s...');
      setTimeout(connectWithRetry, 5000);
    });

  return pool;
};

export const pool = connectWithRetry();
