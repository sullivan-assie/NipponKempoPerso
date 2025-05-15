const Club = require('../models/Club');
const User = require('../models/User');
const mongoose = require('mongoose');

// Créer un nouveau club
exports.createClub = async (request, reply) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: 'Accès refusé. Seuls les administrateurs peuvent créer des clubs.' });
    }

    // Vérifier si un club avec ce nom existe déjà
    const existingClub = await Club.findOne({ name: request.body.name });
    if (existingClub) {
      return reply.code(400).send({ message: 'Un club avec ce nom existe déjà.' });
    }

    const club = new Club({
      name: request.body.name,
      description: request.body.description,
      address: {
        street: request.body.address?.street,
        city: request.body.address?.city,
        postalCode: request.body.address?.postalCode,
        country: request.body.address?.country
      },
      contactEmail: request.body.contactEmail,
      contactPhone: request.body.contactPhone,
      members: [],
      coaches: []
    });

    await club.save();
    return reply.code(201).send(club);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

// Obtenir tous les clubs
exports.getClubs = async (request, reply) => {
  try {
    const clubs = await Club.find().select('-__v');
    return reply.send(clubs);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

// Obtenir un club par ID
exports.getClubById = async (request, reply) => {
  try {
    const club = await Club.findById(request.params.id)
      .populate('members', 'firstName lastName email fighterNumber')
      .populate('coaches', 'firstName lastName email')
      .select('-__v');

    if (!club) {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }
    
    return reply.send(club);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }
    return reply.code(500).send({ message: error.message });
  }
};

// Mettre à jour un club
exports.updateClub = async (request, reply) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier des clubs.' });
    }

    const updateData = {
      name: request.body.name,
      description: request.body.description,
      address: {
        street: request.body.address?.street,
        city: request.body.address?.city,
        postalCode: request.body.address?.postalCode,
        country: request.body.address?.country
      },
      contactEmail: request.body.contactEmail,
      contactPhone: request.body.contactPhone,
      updatedAt: Date.now()
    };

    const club = await Club.findByIdAndUpdate(
      request.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!club) {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }

    return reply.send(club);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }
    return reply.code(500).send({ message: error.message });
  }
};

// Supprimer un club
exports.deleteClub = async (request, reply) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer des clubs.' });
    }

    const club = await Club.findById(request.params.id);
    if (!club) {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }

    // Mettre à jour tous les utilisateurs qui font partie de ce club
    await User.updateMany(
      { club: request.params.id },
      { $unset: { club: 1 }, clubName: '' }
    );

    await Club.findByIdAndDelete(request.params.id);
    return reply.send({ message: 'Club supprimé avec succès' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }
    return reply.code(500).send({ message: error.message });
  }
};

// Ajouter un utilisateur à un club
exports.addUserToClub = async (request, reply) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: 'Accès refusé. Seuls les administrateurs peuvent ajouter des membres au club.' });
    }

    const { userId, isCoach } = request.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(request.params.id)) {
      return reply.code(400).send({ message: 'ID utilisateur ou ID club invalide' });
    }

    const club = await Club.findById(request.params.id);
    if (!club) {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return reply.code(404).send({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur fait déjà partie du club
    if (club.members.includes(userId)) {
      return reply.code(400).send({ message: 'Cet utilisateur fait déjà partie de ce club' });
    }

    // Ajouter l'utilisateur au club
    club.members.push(userId);
    
    // Si l'utilisateur est également un coach
    if (isCoach) {
      club.coaches.push(userId);
      // Mettre à jour le statut de coach de l'utilisateur
      user.isClubCoach = true;
    }

    // Mettre à jour les informations de l'utilisateur
    user.club = club._id;
    user.clubName = club.name;
    
    await Promise.all([club.save(), user.save()]);
    
    return reply.send({ message: 'Utilisateur ajouté au club avec succès', club });
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

// Supprimer un utilisateur d'un club
exports.removeUserFromClub = async (request, reply) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: 'Accès refusé. Seuls les administrateurs peuvent retirer des membres du club.' });
    }

    const { userId } = request.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(request.params.id)) {
      return reply.code(400).send({ message: 'ID utilisateur ou ID club invalide' });
    }

    const club = await Club.findById(request.params.id);
    if (!club) {
      return reply.code(404).send({ message: 'Club non trouvé' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return reply.code(404).send({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur fait partie du club
    if (!club.members.includes(userId)) {
      return reply.code(400).send({ message: 'Cet utilisateur ne fait pas partie de ce club' });
    }

    // Retirer l'utilisateur du club (membres et coachs)
    club.members = club.members.filter(id => id.toString() !== userId);
    club.coaches = club.coaches.filter(id => id.toString() !== userId);
    
    // Mettre à jour les informations de l'utilisateur
    user.club = undefined;
    user.clubName = '';
    user.isClubCoach = false;
    
    await Promise.all([club.save(), user.save()]);
    
    return reply.send({ message: 'Utilisateur retiré du club avec succès', club });
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};