require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');

/**
 * Audit and normalize all properties to fix rendering issues
 * - Ensures all properties have valid status field (default: 'available')
 * - Migrates old single 'image' field to 'images' array
 * - Validates and fixes image URLs
 * - Ensures all required fields have proper defaults
 */
const auditAndNormalizeProperties = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant dans les variables d\'environnement');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('✓ Connecte a MongoDB');

    // Get all properties
    const properties = await Property.find({});
    console.log(`\nAudit: ${properties.length} produits trouves\n`);

    const issues = {
      missingStatus: [],
      invalidStatus: [],
      missingImages: [],
      invalidImages: [],
      missingBedrooms: [],
      missingBathrooms: [],
      invalidUrls: [],
      updated: []
    };

    // Audit and collect issues
    for (const property of properties) {
      const updates = {};
      let hasIssues = false;

      // Check status field
      if (!property.status) {
        issues.missingStatus.push(property._id.toString());
        updates.status = 'available';
        hasIssues = true;
      } else if (!['available', 'sold', 'rented'].includes(property.status)) {
        issues.invalidStatus.push({
          id: property._id.toString(),
          status: property.status
        });
        updates.status = 'available';
        hasIssues = true;
      }

      // Check images field
      if (!property.images || !Array.isArray(property.images)) {
        issues.missingImages.push(property._id.toString());
        // Try to migrate old 'image' field if it exists
        if (property.image && typeof property.image === 'string') {
          updates.images = [property.image];
          hasIssues = true;
        } else {
          updates.images = [];
          hasIssues = true;
        }
      } else if (property.images.length === 0) {
        issues.missingImages.push(property._id.toString());
      } else {
        // Validate image URLs
        const invalidUrls = property.images.filter(url =>
          !url || typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('data:'))
        );
        if (invalidUrls.length > 0) {
          issues.invalidUrls.push({
            id: property._id.toString(),
            invalidCount: invalidUrls.length
          });
          // Filter out invalid URLs
          updates.images = property.images.filter(url =>
            url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'))
          );
          hasIssues = true;
        }
      }

      // Check required numeric fields for non-land properties
      if (property.propertyType !== 'land') {
        if (typeof property.bedrooms !== 'number' || property.bedrooms < 0) {
          issues.missingBedrooms.push(property._id.toString());
          updates.bedrooms = property.bedrooms || 1;
          hasIssues = true;
        }
        if (typeof property.bathrooms !== 'number' || property.bathrooms < 0) {
          issues.missingBathrooms.push(property._id.toString());
          updates.bathrooms = property.bathrooms || 1;
          hasIssues = true;
        }
      }

      // Apply updates if there are any issues
      if (hasIssues && Object.keys(updates).length > 0) {
        await Property.findByIdAndUpdate(property._id, updates, { runValidators: false });
        issues.updated.push({
          id: property._id.toString(),
          title: property.title,
          updates
        });
      }
    }

    // Report issues and fixes
    console.log('═══════════════════════════════════════════');
    console.log('RAPPORT D\'AUDIT ET NORMALIZATION');
    console.log('═══════════════════════════════════════════\n');

    if (issues.missingStatus.length > 0) {
      console.log(`❌ ${issues.missingStatus.length} produit(s) sans champ 'status':`);
      console.log(`   → Correction: Status defini a 'available'\n`);
    }

    if (issues.invalidStatus.length > 0) {
      console.log(`❌ ${issues.invalidStatus.length} produit(s) avec status invalide:`);
      issues.invalidStatus.forEach(item => {
        console.log(`   - ${item.id}: "${item.status}"`);
      });
      console.log(`   → Correction: Status redéfini a 'available'\n`);
    }

    if (issues.missingImages.length > 0) {
      console.log(`❌ ${issues.missingImages.length} produit(s) sans images valides:`);
      console.log(`   → Correction: Champ 'images' normalise en tableau\n`);
    }

    if (issues.invalidUrls.length > 0) {
      console.log(`❌ ${issues.invalidUrls.length} produit(s) avec URLs invalides:`);
      issues.invalidUrls.forEach(item => {
        console.log(`   - ${item.id}: ${item.invalidCount} URL(s) invalide(s)`);
      });
      console.log(`   → Correction: URLs invalides supprimees\n`);
    }

    if (issues.missingBedrooms.length > 0) {
      console.log(`❌ ${issues.missingBedrooms.length} produit(s) sans chambres valides:`);
      console.log(`   → Correction: Chambres defini par defaut\n`);
    }

    if (issues.missingBathrooms.length > 0) {
      console.log(`❌ ${issues.missingBathrooms.length} produit(s) sans salles de bain valides:`);
      console.log(`   → Correction: Salles de bain defini par defaut\n`);
    }

    console.log('═══════════════════════════════════════════');
    console.log(`✅ RESUMÉ: ${issues.updated.length} produit(s) mise a jour`);
    console.log('═══════════════════════════════════════════\n');

    if (issues.updated.length > 0) {
      console.log('Produits mis a jour:');
      issues.updated.forEach(item => {
        console.log(`\n  📦 ${item.title} (${item.id})`);
        console.log(`     Changements: ${JSON.stringify(item.updates)}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✓ Deconnecte de MongoDB');

    return {
      success: true,
      totalProducts: properties.length,
      updatedProducts: issues.updated.length,
      issues
    };
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
auditAndNormalizeProperties().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
