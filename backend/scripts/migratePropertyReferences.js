require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');
const { getNextReference } = require('../utils/propertyReference');

const migrateReferences = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant');
  }

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000
  });

  const properties = await Property.find({
    $or: [{ reference: { $exists: false } }, { reference: '' }, { reference: null }]
  }).sort({ createdAt: 1 });

  let updatedProperties = 0;

  for (const property of properties) {
    property.reference = await getNextReference(
      Property,
      property.transactionType,
      property.propertyType
    );
    await property.save();
    updatedProperties += 1;
    console.log(`OK ${property.reference} - ${property.title} (${property._id})`);
  }

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        connectedDatabase: conn.connection.name,
        updatedProperties
      },
      null,
      2
    )
  );
};

migrateReferences().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
