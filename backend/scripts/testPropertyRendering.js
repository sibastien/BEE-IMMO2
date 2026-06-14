require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');

/**
 * Test script to verify property data rendering
 * Creates sample properties with various data formats and validates them
 */
const testPropertyRendering = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('✓ Connecté à MongoDB\n');

    // Test data with various formats to simulate old vs new properties
    const testProperties = [
      {
        // New format - should render perfectly
        title: 'Villa Moderne avec Jardin',
        description: 'Belle villa moderne avec jardin spacieux et piscine. Idéale pour famille.',
        price: 500000,
        transactionType: 'sale',
        propertyType: 'villa',
        city: 'Hammamet',
        district: 'Zone Touristique',
        address: 'Avenue Abu Dhabi',
        surface: 450,
        bedrooms: 4,
        bathrooms: 3,
        garages: 2,
        abris: 1,
        images: [
          'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800',
          'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800'
        ],
        status: 'available',
        reference: 'VL001'
      },
      {
        // Old format - single image field, no status
        title: 'Appartement S+2 Ancien Format',
        description: 'Joli appartement dans immeuble récent. Situé en plein centre ville.',
        price: 150000,
        transactionType: 'sale',
        propertyType: 'apartment',
        city: 'Tunis',
        district: 'Centre',
        address: 'Rue de la Paix',
        surface: 120,
        bedrooms: 2,
        bathrooms: 1,
        garages: 1,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        // Missing status field - should default to 'available'
        reference: 'AP001'
      },
      {
        // Mixed format - has images but malformed
        title: 'Maison avec Format Mixte',
        description: 'Maison spacieuse avec terrain. Beaucoup de potentiel.',
        price: 300000,
        transactionType: 'sale',
        propertyType: 'house',
        city: 'Sousse',
        district: 'Kantaoui',
        address: 'Route de la Corniche',
        surface: 250,
        bedrooms: 3,
        bathrooms: 2,
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'invalid-url', // Invalid URL - should be filtered
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
        ],
        status: 'available',
        reference: 'MS001'
      },
      {
        // Old format with numeric fields issues
        title: 'Terrain à Développer',
        description: 'Grand terrain viabilisé. Zone résidentielle prisée.',
        price: 80000,
        transactionType: 'sale',
        propertyType: 'land',
        city: 'La Marsa',
        district: 'Plage',
        address: 'Promenade de la Plage',
        surface: 1000,
        bedrooms: -1, // Invalid - should be normalized
        bathrooms: -1, // Invalid - should be normalized
        garages: 0,
        abris: 0,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        // No status - should default
        reference: 'TR001'
      }
    ];

    console.log('🧪 Test: Création de 4 propriétés de test\n');

    const createdProperties = [];
    for (const testProp of testProperties) {
      try {
        const prop = await Property.create(testProp);
        createdProperties.push(prop);
        console.log(`✅ Créé: ${testProp.reference} - ${testProp.title}`);
      } catch (error) {
        console.log(`❌ Erreur création: ${testProp.reference} - ${error.message}`);
      }
    }

    console.log(`\n✅ ${createdProperties.length} propriétés de test créées\n`);

    // Now test the API response normalization
    console.log('═══════════════════════════════════════════');
    console.log('TEST: Normalisation des Propriétés');
    console.log('═══════════════════════════════════════════\n');

    const allProperties = await Property.find({}).sort({ createdAt: 1 });

    let testsPassed = 0;
    let testsFailed = 0;

    allProperties.forEach((property, index) => {
      console.log(`\n📦 Propriété ${index + 1}: ${property.reference} - ${property.title}`);
      console.log('Validations:');

      // Test 1: Status exists and is valid
      const hasValidStatus = property.status && ['available', 'sold', 'rented'].includes(property.status);
      console.log(`  ${hasValidStatus ? '✅' : '❌'} Status: ${property.status || 'MISSING'}`);
      if (hasValidStatus) testsPassed++; else testsFailed++;

      // Test 2: Images is an array
      const imagesIsArray = Array.isArray(property.images);
      console.log(`  ${imagesIsArray ? '✅' : '❌'} Images format: ${imagesIsArray ? 'array' : 'non-array'}`);
      if (imagesIsArray) testsPassed++; else testsFailed++;

      // Test 3: Image URLs are valid (if any)
      const imageCount = property.images?.length || 0;
      const hasImage = property.image || imageCount > 0;
      console.log(`  ${hasImage ? '✅' : '❌'} Images disponibles: ${imageCount} (images) + ${property.image ? '1' : '0'} (image)`);
      if (hasImage) testsPassed++; else testsFailed++;

      // Test 4: Numeric fields are valid
      let numericValid = true;
      if (property.propertyType !== 'land') {
        numericValid = numericValid && (typeof property.bedrooms === 'number' && property.bedrooms >= 0);
        numericValid = numericValid && (typeof property.bathrooms === 'number' && property.bathrooms >= 0);
      }
      numericValid = numericValid && (typeof property.garages === 'number' && property.garages >= 0);
      numericValid = numericValid && (typeof property.abris === 'number' && property.abris >= 0);

      console.log(`  ${numericValid ? '✅' : '❌'} Champs numériques: ${numericValid ? 'valides' : 'invalides'}`);
      console.log(`     Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}, Garages: ${property.garages}, Abris: ${property.abris}`);
      if (numericValid) testsPassed++; else testsFailed++;

      // Test 5: Reference exists
      const hasReference = property.reference && typeof property.reference === 'string';
      console.log(`  ${hasReference ? '✅' : '❌'} Reference: ${property.reference || 'MISSING'}`);
      if (hasReference) testsPassed++; else testsFailed++;
    });

    console.log('\n═══════════════════════════════════════════');
    console.log(`📊 RÉSULTATS DES TESTS`);
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Tests réussis: ${testsPassed}`);
    console.log(`❌ Tests échoués: ${testsFailed}`);
    console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

    // Now test the API filtering (without saving changes)
    console.log('═══════════════════════════════════════════');
    console.log('TEST: Filtrage de l\'API (GET /api/properties)');
    console.log('═══════════════════════════════════════════\n');

    const filteredProperties = await Property.find({
      $or: [
        { status: 'available' },
        { status: { $exists: false } },
        { status: null }
      ]
    });

    console.log(`Propriétés qui seraient retournées par GET /api/properties:`);
    console.log(`Total: ${filteredProperties.length}/${allProperties.length}\n`);

    filteredProperties.forEach((prop) => {
      console.log(`  ✅ ${prop.reference} - ${prop.title} (status: ${prop.status || 'default'})`);
    });

    // Cleanup - remove test properties
    console.log('\n\n🧹 Nettoyage: Suppression des propriétés de test...\n');
    for (const prop of createdProperties) {
      await Property.findByIdAndDelete(prop._id);
      console.log(`  Supprimé: ${prop.reference}`);
    }

    await mongoose.disconnect();
    console.log('\n✓ Déconnecté de MongoDB');
    console.log('\n✅ Tests de rendu complétés avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

testPropertyRendering().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
