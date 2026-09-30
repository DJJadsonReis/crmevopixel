const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.kkhnchiytqkuqextwbsq:rJ(uoPQjH+T^3LICUuJ=@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');
    
    const sql = fs.readFileSync('supabase/schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

run();
