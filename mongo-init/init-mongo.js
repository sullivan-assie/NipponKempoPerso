// Cette script sera exécuté lors du premier démarrage de MongoDB
db = db.getSiblingDB('nippon-kempo');

// Création de l'utilisateur pour l'application
db.createUser({
  user: 'nippon_app',
  pwd: 'nippon_password',
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
db.createCollection('teams');
db.createCollection('tournaments');
db.createCollection('matches');
db.createCollection('poules');

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

// Création d'un utilisateur admin par défaut
// Mot de passe: 'admin123'
db.users.insertOne({
  firstName: "Admin",
  lastName: "Nippon-Kempo",
  email: "admin@nippon-kempo.com",
  // Mot de passe haché avec bcrypt 
  password: "$2b$10$X/oRorXs2C9tXjJtNc3preRyPKuKa9HCJqfE6QQ0AcLl8vsJ8Ebce",
  role: "admin",
  status: true,
  RGPDConsent: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Initialisation de MongoDB terminée avec succès !");