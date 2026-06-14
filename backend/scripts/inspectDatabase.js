require('dotenv').config();

const mongoose = require('mongoose');

const inspectDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('✓ Connecte a MongoDB');
    console.log(`Base de donnees: ${conn.connection.db.databaseName}\n`);

    // Get all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Collections disponibles (${collections.length}):\n`);

    for (const collection of collections) {
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} document(s)`);

      // Show first document of each collection
      if (count > 0) {
        const firstDoc = await conn.connection.db.collection(collection.name).findOne({});
        console.log(`    Premier document:`);
        console.log(`    ${JSON.stringify(firstDoc).substring(0, 150)}...`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✓ Deconnecte');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

inspectDatabase();
