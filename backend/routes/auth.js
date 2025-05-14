// backend/routes/auth.js
const authController = require('../controllers/authController');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function authRoutes(fastify, options) {
  // Login d'un utilisateur
  fastify.post('/login', authController.login);

  // Inscription d'un nouvel utilisateur
  fastify.post('/register', authController.register);

  // Récupérer les informations de l'utilisateur connecté (nécessite authentification)
  fastify.get('/me', { 
    preHandler: fastify.authenticate 
  }, authController.getMe);

  // Déconnexion
  fastify.post('/logout', { 
    preHandler: fastify.authenticate 
  }, authController.logout);
  
  // Demande de réinitialisation de mot de passe
  fastify.post('/forgot-password', authController.forgotPassword);
  
  // Réinitialiser le mot de passe avec le token
  fastify.post('/reset-password/:token', authController.resetPassword);
  
  // Route temporaire pour créer un nouvel admin (À SUPPRIMER EN PRODUCTION)
  fastify.get('/create-admin', async (request, reply) => {
    try {
      console.log('Tentative de création d\'un nouvel administrateur');
      
      // Vérifier si l'administrateur existe déjà
      const adminExists = await User.findOne({ email: 'admin@kempo.fr' });
      if (adminExists) {
        console.log('Un administrateur avec cette adresse email existe déjà');
        return { 
          success: false, 
          message: 'Un administrateur avec cette adresse email existe déjà' 
        };
      }
      
      // Créer un mot de passe haché
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Créer le nouvel administrateur
      const admin = new User({
        firstName: "Admin",
        lastName: "Kempo",
        email: "admin@kempo.fr",
        password: hashedPassword,
        role: "admin",
        status: true,
        RGPDConsent: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await admin.save();
      console.log('Nouvel administrateur créé avec succès');
      
      return { 
        success: true, 
        message: 'Administrateur créé avec succès',
        credentials: {
          email: 'admin@kempo.fr',
          password: 'admin123'
        }
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'administrateur:', error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Server Error', 
        message: error.message 
      });
    }
  });
}

module.exports = authRoutes;