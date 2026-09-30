const { Client } = require('pg');

async function testConnection(region) {
  const connectionString = `postgresql://postgres.kkhnchiytqkuqextwbsq:rJ(uoPQjH+T^3LICUuJ=@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  console.log(`Trying ${region}...`);
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`SUCCESS! Connected to ${region}`);
    await client.end();
    return connectionString;
  } catch (err) {
    console.log(`Failed for ${region}`);
    return null;
  }
}

async function run() {
  const regions = ['sa-east-1', 'us-east-1', 'us-west-1', 'eu-central-1', 'eu-west-1', 'us-east-2'];
  for (const region of regions) {
    const success = await testConnection(region);
    if (success) return;
  }
}

run();
