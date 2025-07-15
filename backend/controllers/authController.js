// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Authentification d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (request, reply) => {
  try {
    console.log('====== DÉBUT CONNEXION UTILISATEUR ======');
    const { email, password } = request.body;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    console.log(`Tentative de connexion: ${email}`);

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Connexion échouée: Utilisateur ${email} introuvable`);
      if (request.securityLogger) {
        request.securityLogger.logAuthFailure(email, ip, userAgent, 'User not found');
      }
      return reply.code(401).send({ error: 'Unauthorized', message: 'Email ou mot de passe invalide' });
    }

    console.log(`Utilisateur trouvé: ${email} (ID: ${user._id})`);
    console.log(`Informations utilisateur: Prénom=${user.firstName}, Nom=${user.lastName}, Rôle=${user.role}, Statut=${user.status}`);

    // Vérifier si l'utilisateur est actif
    if (!user.status) {
      console.log(`Connexion échouée: Compte ${email} désactivé`);
      if (request.securityLogger) {
        request.securityLogger.logAuthFailure(email, ip, userAgent, 'Account disabled');
      }
      return reply.code(401).send({ error: 'Unauthorized', message: 'Compte désactivé' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Connexion échouée: Mot de passe incorrect pour ${email}`);
      if (request.securityLogger) {
        request.securityLogger.logAuthFailure(email, ip, userAgent, 'Invalid password');
      }
      return reply.code(401).send({ error: 'Unauthorized', message: 'Email ou mot de passe invalide' });
    }

    console.log(`Mot de passe valide pour ${email}`);

    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();
    console.log(`Date de dernière connexion mise à jour pour ${email}: ${new Date(user.lastLogin).toISOString()}`);

    // Logger connexion réussie
    if (request.securityLogger) {
      request.securityLogger.logAuthSuccess(user._id, user.email, ip, userAgent);
    }

    // Générer un token JWT
    const token = await reply.jwtSign({
      id: user._id,
      email: user.email,
      role: user.role
    });
    console.log(`Token JWT généré pour ${email}`);

    // Préparer la réponse
    const response = {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        fighterNumber: user.fighterNumber,
        clubName: user.clubName
      }
    };
    
    console.log(`Connexion réussie pour ${email}, rôle: ${user.role}`);
    console.log('Données de réponse:', JSON.stringify(response));
    console.log('====== FIN CONNEXION UTILISATEUR ======');

    // Retourner le token et les informations utilisateur
    return response;
  } catch (error) {
    console.error('====== ERREUR DE CONNEXION ======');
    console.error('Message d\'erreur:', error.message);
    console.error('Pile d\'appel:', error.stack);
    console.error('====== FIN ERREUR DE CONNEXION ======');
    
    if (request.securityLogger) {
      request.securityLogger.logSuspiciousActivity(
        request.ip, 
        request.headers['user-agent'], 
        'Login system error',
        { error: error.message }
      );
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (request, reply) => {
  try {
    console.log('====== DÉBUT INSCRIPTION UTILISATEUR ======');
    const { firstName, lastName, email, password, fighterNumber, clubName, RGPDConsent } = request.body;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    console.log(`Tentative d'inscription: ${email} avec numéro de combattant: ${fighterNumber} et club: ${clubName || 'non spécifié'}`);

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      console.log(`Inscription échouée: L'utilisateur ${email} existe déjà`);
      if (request.securityLogger) {
        request.securityLogger.logSuspiciousActivity(
          ip, 
          userAgent, 
          'Registration attempt with existing email',
          { email, attemptedAction: 'duplicate_registration' }
        );
      }
      return reply.code(400).send({ error: 'Bad Request', message: 'L\'utilisateur existe déjà' });
    }
    
    // Vérifier si le numéro de combattant est déjà utilisé
    if (fighterNumber) {
      const existingFighterNumber = await User.findOne({ fighterNumber });
      if (existingFighterNumber) {
        console.log(`Inscription échouée: Le numéro de combattant ${fighterNumber} est déjà utilisé`);
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Ce numéro de combattant est déjà associé à un compte' 
        });
      }
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`Mot de passe haché pour ${email}`);

    // Créer un nouvel utilisateur
    user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      fighterNumber,
      clubName,
      role: 'user', // Par défaut, le rôle est 'user'
      RGPDConsent
    });

    await user.save();
    console.log(`Utilisateur ${email} créé avec succès, rôle: ${user.role}, numéro de combattant: ${fighterNumber}, club: ${clubName || 'non spécifié'}`);

    // Logger création de compte
    if (request.securityLogger) {
      request.securityLogger.logAccountCreation(email, ip, userAgent, 'user');
    }

    // Générer un token JWT
    const token = await reply.jwtSign({
      id: user._id,
      email: user.email,
      role: user.role
    });
    console.log(`Token JWT généré pour ${email}`);

    // Préparer la réponse
    const response = {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        fighterNumber: user.fighterNumber,
        clubName: user.clubName
      }
    };
    
    console.log('Données de réponse:', JSON.stringify(response));
    console.log('====== FIN INSCRIPTION UTILISATEUR ======');

    // Retourner le token et les informations utilisateur
    return reply.code(201).send(response);
  } catch (error) {
    console.error('====== ERREUR D\'INSCRIPTION ======');
    console.error('Message d\'erreur:', error.message);
    console.error('Pile d\'appel:', error.stack);
    console.error('====== FIN ERREUR D\'INSCRIPTION ======');
    
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les informations de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (request, reply) => {
  try {
    console.log('====== DÉBUT RÉCUPÉRATION PROFIL UTILISATEUR ======');
    console.log(`Récupération du profil utilisateur avec ID: ${request.user.id}`);
    
    const user = await User.findById(request.user.id).select('-password');
    
    if (!user) {
      console.log(`Utilisateur avec ID ${request.user.id} non trouvé`);
      return reply.code(404).send({ error: 'Not Found', message: 'Utilisateur non trouvé' });
    }
    
    console.log(`Profil utilisateur récupéré: ${user.email}, rôle: ${user.role}`);
    console.log('====== FIN RÉCUPÉRATION PROFIL UTILISATEUR ======');
    
    return user;
  } catch (error) {
    console.error('====== ERREUR DE RÉCUPÉRATION PROFIL ======');
    console.error('Message d\'erreur:', error.message);
    console.error('Pile d\'appel:', error.stack);
    console.error('====== FIN ERREUR DE RÉCUPÉRATION PROFIL ======');
    
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Déconnexion (côté serveur, il suffit d'invalider le token côté client)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (request, reply) => {
  console.log(`====== DÉCONNEXION UTILISATEUR: ${request.user.email} ======`);
  return { success: true, message: 'Déconnexion réussie' };
};

// @desc    Demander une réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (request, reply) => {
  try {
    console.log('====== DÉBUT DEMANDE RÉINITIALISATION MOT DE PASSE ======');
    const { email } = request.body;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    console.log(`Demande de réinitialisation de mot de passe pour: ${email}`);
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Aucun compte trouvé avec l'email: ${email}`);
      if (request.securityLogger) {
        request.securityLogger.logSuspiciousActivity(
          ip, 
          userAgent, 
          'Password reset attempt for non-existent email',
          { email, attemptedAction: 'password_reset_invalid_email' }
        );
      }
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Aucun compte n\'est associé à cette adresse email' 
      });
    }
    
    console.log(`Utilisateur trouvé pour réinitialisation: ${email}`);
    
    // Logger demande de reset légitime
    if (request.securityLogger) {
      request.securityLogger.logPasswordReset(email, ip, userAgent, 'email');
    }
    
    // Générer un token aléatoire
    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log(`Token de réinitialisation généré pour ${email}`);
    
    // Définir la date d'expiration (1 heure)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();
    console.log(`Token enregistré pour l'utilisateur ${email}, expire le: ${new Date(user.resetPasswordExpires).toISOString()}`);
    
    // Configurer le transporteur d'email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // URL du front pour le reset du mot de passe avec prise en compte du hash mode
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:9500';
    const resetUrl = `${baseUrl}/#/reset-password/${resetToken}`;
    console.log(`URL de réinitialisation générée: ${resetUrl}`);
    
    // Contenu de l'email
    const mailOptions = {
      from: `"Nippon Kempo" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h1>Demande de réinitialisation de mot de passe</h1>
        <p>Bonjour ${user.firstName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        <p>Cordialement,</p>
        <p>L'équipe Nippon Kempo</p>
      `
    };
    
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    console.log(`Email de réinitialisation envoyé à ${email}`);
    console.log('====== FIN DEMANDE RÉINITIALISATION MOT DE PASSE ======');
    
    return {
      success: true,
      message: 'Un email de réinitialisation a été envoyé à votre adresse email'
    };
  } catch (error) {
    console.error('====== ERREUR DE DEMANDE DE RÉINITIALISATION ======');
    console.error('Message d\'erreur:', error.message);
    console.error('Pile d\'appel:', error.stack);
    console.error('====== FIN ERREUR DE DEMANDE DE RÉINITIALISATION ======');
    
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Réinitialiser le mot de passe avec le token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (request, reply) => {
  try {
    console.log('====== DÉBUT RÉINITIALISATION MOT DE PASSE ======');
    const { token } = request.params;
    const { password } = request.body;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];
    console.log(`Tentative de réinitialisation du mot de passe avec le token: ${token}`);
    
    // Rechercher l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log(`Aucun utilisateur trouvé avec le token ${token} ou token expiré`);
      if (request.securityLogger) {
        request.securityLogger.logSuspiciousActivity(
          ip, 
          userAgent, 
          'Password reset attempt with invalid token',
          { token: token.substring(0, 8) + '...', attemptedAction: 'invalid_reset_token' }
        );
      }
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Le token de réinitialisation est invalide ou expiré'
      });
    }
    
    console.log(`Utilisateur trouvé pour le token ${token}: ${user.email}`);
    
    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`Nouveau mot de passe haché pour ${user.email}`);
    
    // Mettre à jour le mot de passe et supprimer les champs de réinitialisation
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.updatedAt = Date.now();
    
    await user.save();
    console.log(`Mot de passe réinitialisé avec succès pour ${user.email}`);

    // Logger réinitialisation réussie
    if (request.securityLogger) {
      request.securityLogger.logDataModification(
        user._id, 
        user.email, 
        'user_password', 
        'password_reset', 
        ip,
        { resetMethod: 'token' }
      );
    }

    console.log('====== FIN RÉINITIALISATION MOT DE PASSE ======');
    
    return {
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès'
    };
  } catch (error) {
    console.error('====== ERREUR DE RÉINITIALISATION MOT DE PASSE ======');
    console.error('Message d\'erreur:', error.message);
    console.error('Pile d\'appel:', error.stack);
    console.error('====== FIN ERREUR DE RÉINITIALISATION MOT DE PASSE ======');
    
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};