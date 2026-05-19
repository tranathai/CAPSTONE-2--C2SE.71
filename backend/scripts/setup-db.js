const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemePath = path.join(__dirname, '..', '..', 'database', 'schema_mysql.sql');
    const schema = fs.readFileSync(schemePath, 'utf8');
    
    console.log('Running database schema setup...');
    await conn.query(schema);
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

require('dotenv').config();
setupDatabase().catch(err => {
  process.exit(1);
});
