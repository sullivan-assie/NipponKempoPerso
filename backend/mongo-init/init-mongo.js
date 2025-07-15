// Script d'initialisation MongoDB sécurisé
// Utilise les variables d'environnement pour éviter les credentials hardcodés

db = db.getSiblingDB('nippon-kempo');

// Récupération des credentials depuis les variables d'environnement
const dbUser = process.env.DB_USER || 'nippon_app';
const dbPassword = process.env.DB_PASSWORD;

if (!dbPassword) {
  throw new Error('DB_PASSWORD environment variable is required');
}

// Création de l'utilisateur pour l'application avec des credentials sécurisés
db.createUser({
  user: dbUser,
  pwd: dbPassword,
  roles: [
    {
      role: 'readWrite',
      db: 'nippon-kempo'
    }
  ]
});

// Création des collections
db.createCollection('users');
db.createCollection('categories');
db.createCollection('competitors');
db.createCollection('logs');
db.createCollection('poules');
db.createCollection('teams');
db.createCollection('tournaments');

// Insertion de données initiales pour les catégories
db.categories.insertMany([
  { name: "Seniors -60kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Seniors -70kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Seniors -80kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Seniors +80kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Juniors -55kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Juniors -65kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Juniors -75kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Juniors +75kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Femmes -55kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Femmes -65kg", type: "weight", createdAt: new Date(), updatedAt: new Date() },
  { name: "Femmes +65kg", type: "weight", createdAt: new Date(), updatedAt: new Date() }
]);

// Création d'un utilisateur admin sécurisé
const adminEmail = process.env.ADMIN_EMAIL || "admin@nippon-kempo.com";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error('ADMIN_PASSWORD environment variable is required');
}

// Hash du mot de passe admin (doit être généré dynamiquement en production)
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hashedAdminPassword = bcrypt.hashSync(adminPassword, salt);

db.users.insertOne({
  firstName: "Admin",
  lastName: "Nippon-Kempo", 
  email: adminEmail,
  password: hashedAdminPassword,
  role: "admin",
  status: true,
  RGPDConsent: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Ajout de quelques compétiteurs de test
db.competitors.insertMany([
  { 
    firstname: 'Jean', 
    lastname: 'Dupont', 
    clubName: 'Kempo Club Paris', 
    grade: '1 Dan', 
    gender: 'Male', 
    age: 28,
    nationality: 'France',
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    firstname: 'Marie', 
    lastname: 'Durand', 
    clubName: 'Bushido Académie', 
    grade: '1 Kyu', 
    gender: 'Female', 
    age: 22,
    nationality: 'France',
    createdAt: new Date(), 
    updatedAt: new Date() 
  }
]);

print("Initialisation sécurisée de MongoDB terminée avec succès !");