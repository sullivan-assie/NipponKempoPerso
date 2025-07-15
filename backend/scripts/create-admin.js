// Script pour créer un administrateur dans MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    console.log('🔗 Connexion à MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connecté à MongoDB Atlas');
    
    // Vérifier si un admin existe déjà
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('❌ Un administrateur existe déjà:', adminExists.email);
      process.exit(0);
    }
    
    // Créer le mot de passe haché
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Créer l'administrateur
    const admin = new User({
      firstName: "Admin",
      lastName: "Kempo",
      name: "Admin Kempo", 
      email: "admin@kempo.fr",
      password: hashedPassword,
      role: "admin",
      status: true,
      RGPDConsent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await admin.save();
    
    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email: admin@kempo.fr');
    console.log('🔑 Mot de passe: admin123');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

createAdmin();