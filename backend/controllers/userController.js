const User = require('../models/User');

// Récupérer tous les utilisateurs (avec filtre optionnel par rôle)
exports.getAllUsers = async (request, reply) => {
  try {
    const query = {};
    
    // Filtrer par rôle si spécifié
    if (request.query.role) {
      query.role = request.query.role;
    }
    
    const users = await User.find(query).select('-password');
    reply.send(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    reply.code(500).send({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (request, reply) => {
  try {
    const userId = request.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return reply.code(404).send({ message: 'Utilisateur non trouvé' });
    }
    reply.send(user);
  } catch (error) {
    reply.code(500).send({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateProfile = async (request, reply) => {
  try {
    const userId = request.user.id;
    const updates = request.body;
    // Empêcher la modification de l'email et du mot de passe ici (optionnel)
    delete updates.email;
    delete updates.password;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return reply.code(404).send({ message: 'Utilisateur non trouvé' });
    }
    reply.send(user);
  } catch (error) {
    reply.code(500).send({ message: 'Erreur serveur', error: error.message });
  }
};
