const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.PDV7_DB_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.PDV7_DB_USER,
      password: process.env.PDV7_DB_PASS,
    },
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    database: process.env.PDV7_DB_NAME,
  },
  requestTimeout: 60000,
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = getPool;
