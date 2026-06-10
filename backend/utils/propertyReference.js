const transactionReferenceLetters = {
  sale: 'V',
  rent: 'L'
};

const propertyReferenceLetters = {
  apartment: 'A',
  house: 'M',
  villa: 'V',
  land: 'T',
  commercial: 'C'
};

const getReferencePrefix = (transactionType, propertyType) => {
  const transactionLetter = transactionReferenceLetters[transactionType];
  const propertyLetter = propertyReferenceLetters[propertyType];

  if (!transactionLetter || !propertyLetter) {
    throw new Error('Type de transaction ou type de bien invalide pour la reference');
  }

  return `${transactionLetter}${propertyLetter}`;
};

const getNextReference = async (Property, transactionType, propertyType) => {
  const prefix = getReferencePrefix(transactionType, propertyType);
  const latestProperty = await Property.findOne({
    reference: { $regex: `^${prefix}\\d{3}$` }
  })
    .sort({ reference: -1 })
    .select('reference');

  const latestNumber = latestProperty?.reference
    ? Number(latestProperty.reference.slice(prefix.length))
    : 0;
  const nextNumber = latestNumber + 1;

  if (nextNumber > 999) {
    throw new Error(`Limite de references atteinte pour ${prefix}`);
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

module.exports = {
  getNextReference,
  getReferencePrefix
};
