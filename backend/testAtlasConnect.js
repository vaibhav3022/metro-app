const { MongoClient } = require('mongodb');

// Direct connection string using the actual shard hostnames (bypasses SRV DNS)
const uri = 'mongodb://vaibhavdhotre682:Vaibhav%40123@ac-qerccaj-shard-00-00.1j8hafp.mongodb.net:27017,ac-qerccaj-shard-00-01.1j8hafp.mongodb.net:27017,ac-qerccaj-shard-00-02.1j8hafp.mongodb.net:27017/punemetro?tls=true&authSource=admin&retryWrites=true&w=majority';

console.log('Connecting with direct connection string...');

async function test() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  try {
    await client.connect();
    console.log('✅ Connected successfully to Atlas!');
    const db = client.db('punemetro');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

test();
