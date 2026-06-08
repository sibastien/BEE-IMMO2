const Request = require('../models/Request');

// Creer une demande de visite depuis le site public
const createRequest = async (req, res, next) => {
  try {
    const request = await Request.create(req.body);

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// Afficher les demandes dans l'admin
const getRequests = async (req, res, next) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une demande traitee
const deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error('Demande introuvable');
    }

    res.status(200).json({
      success: true,
      message: 'Demande supprimee'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  deleteRequest
};
