require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');

/**
 * Migrate old product data to new schema
 * - Converts old single 'image' field to 'images' array
 * - Adds missing 'status' field (default: 'available')
 * - Validates and fixes Cloudinary URLs
 * - Normalizes numeric fields
 * - Creates comprehensive migration report
 */
const migrateOldProperties = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('✓ Connecte a MongoDB\n');

    const properties = await Property.find({});
    console.log(`Migration: ${properties.length} produit(s) detecte(s)\n`);

    if (properties.length === 0) {
      console.log('ℹ Aucun produit a migrer');
      await mongoose.disconnect();
      return;
    }

    const migrations = {
      successful: [],
      errors: [],
      statistics: {
        statusAdded: 0,
        imagesMigrated: 0,
        urlsValidated: 0,
        urlsFixed: 0,
        numericFieldsFixed: 0
      }
    };

    for (const property of properties) {
      try {
        const updates = {};
        let migrationNotes = [];

        // 1. Migrate 'image' to 'images'
        if (!Array.isArray(property.images) || !property.images.length) {
          if (property.image && typeof property.image === 'string') {
            updates.images = [property.image];
            migrationNotes.push('image→images');
            migrations.statistics.imagesMigrated++;
          } else if (!Array.isArray(property.images)) {
            updates.images = [];
            migrationNotes.push('images normalized');
          }
        }

        // 2. Validate and fix image URLs
        if (updates.images && updates.images.length > 0) {
          const validUrls = updates.images.filter(url =>
            url && typeof url === 'string' && (/^https?:\/\/.+/i.test(url) || /^data:image/.test(url))
          );
          if (validUrls.length !== updates.images.length) {
            migrations.statistics.urlsFixed += updates.images.length - validUrls.length;
            updates.images = validUrls;
            migrationNotes.push(`URLs fixed (${validUrls.length}/${updates.images.length})`);
          }
          migrations.statistics.urlsValidated += updates.images.length;
        }

        // 3. Add missing status
        if (!property.status) {
          updates.status = 'available';
          migrationNotes.push('status=available');
          migrations.statistics.statusAdded++;
        } else if (!['available', 'sold', 'rented'].includes(property.status)) {
          updates.status = 'available';
          migrationNotes.push(`status fixed (${property.status}→available)`);
          migrations.statistics.statusAdded++;
        }

        // 4. Fix numeric fields for non-land properties
        if (property.propertyType !== 'land') {
          if (typeof property.bedrooms !== 'number' || property.bedrooms < 0) {
            updates.bedrooms = Math.max(0, property.bedrooms || 0);
            migrationNotes.push('bedrooms normalized');
            migrations.statistics.numericFieldsFixed++;
          }
          if (typeof property.bathrooms !== 'number' || property.bathrooms < 0) {
            updates.bathrooms = Math.max(0, property.bathrooms || 0);
            migrationNotes.push('bathrooms normalized');
            migrations.statistics.numericFieldsFixed++;
          }
        }

        // 5. Fix garage and abri fields
        if (typeof property.garages !== 'number' || property.garages < 0) {
          updates.garages = Math.max(0, property.garages || 0);
          migrationNotes.push('garages normalized');
          migrations.statistics.numericFieldsFixed++;
        }
        if (typeof property.abris !== 'number' || property.abris < 0) {
          updates.abris = Math.max(0, property.abris || 0);
          migrationNotes.push('abris normalized');
          migrations.statistics.numericFieldsFixed++;
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await Property.findByIdAndUpdate(property._id, updates, { runValidators: false });
          migrations.successful.push({
            id: property._id.toString(),
            title: property.title,
            reference: property.reference || 'N/A',
            changes: migrationNotes.join(', ')
          });
        }
      } catch (error) {
        migrations.errors.push({
          id: property._id?.toString() || 'unknown',
          title: property.title || 'unknown',
          error: error.message
        });
      }
    }

    // Generate report
    console.log('═══════════════════════════════════════════');
    console.log('RAPPORT DE MIGRATION');
    console.log('═══════════════════════════════════════════\n');

    console.log('📊 STATISTIQUES:');
    console.log(`   Status ajoutés: ${migrations.statistics.statusAdded}`);
    console.log(`   Images converties: ${migrations.statistics.imagesMigrated}`);
    console.log(`   URLs validées: ${migrations.statistics.urlsValidated}`);
    console.log(`   URLs corrigées: ${migrations.statistics.urlsFixed}`);
    console.log(`   Champs numériques normalisés: ${migrations.statistics.numericFieldsFixed}\n`);

    console.log(`✅ MIGRATION RÉUSSIE: ${migrations.successful.length} produit(s)\n`);

    if (migrations.successful.length > 0) {
      console.log('Produits migrés:');
      migrations.successful.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.reference} - ${item.title}`);
        console.log(`      └─ ${item.changes}`);
      });
      if (migrations.successful.length > 10) {
        console.log(`   ... et ${migrations.successful.length - 10} autres`);
      }
    }

    if (migrations.errors.length > 0) {
      console.log(`\n❌ ERREURS: ${migrations.errors.length} produit(s)\n`);
      migrations.errors.forEach((item) => {
        console.log(`   ❌ ${item.title} (${item.id})`);
        console.log(`      Erreur: ${item.error}`);
      });
    }

    console.log('\n═══════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✓ Déconnecté de MongoDB');

    return migrations;
  } catch (error) {
    console.error('❌ Erreur de migration:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run migration
migrateOldProperties().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
