const validStatuses = ['available', 'sold', 'rented'];

const getPublicPropertyFilter = () => ({
  $and: [
    {
      $or: [
        { isPublished: true },
        { isPublished: { $exists: false } },
        { isPublished: null }
      ]
    },
    {
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    },
    {
      $or: [
        { status: 'available' },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { status: { $nin: validStatuses } }
      ]
    }
  ]
});

const isPublicProperty = (property) => {
  if (!property || property.isPublished === false || property.deletedAt) return false;

  return !property.status || property.status === 'available' || !validStatuses.includes(property.status);
};

module.exports = {
  getPublicPropertyFilter,
  isPublicProperty
};
