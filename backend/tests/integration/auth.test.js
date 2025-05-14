const { buildFastify, connectToTestDatabase, clearDatabase, closeDatabase } = require('../setup');
const supertest = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

describe('Tests API d\'authentification', () => {
  let app;
  let fastify;

  // Avant tous les tests
  beforeAll(async () => {
    // Connexion à la base de données de test
    await connectToTestDatabase();
    // Construction de l'app Fastify pour les tests
    fastify = await buildFastify();
    await fastify.ready();
    app = supertest(fastify.server);
  });

  // Après chaque test
  afterEach(async () => {
    // Nettoyage de la base de données
    await clearDatabase();
  });

  // Après tous les tests
  afterAll(async () => {
    // Fermeture de la connexion à la base de données
    await closeDatabase();
    // Fermeture de l'application Fastify
    await fastify.close();
  });

  // Test d'inscription d'utilisateur
  describe('POST /api/auth/register', () => {
    it('doit créer un nouvel utilisateur', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        RGPDConsent: true
      };

      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Vérification de la réponse
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      
      // Vérification en base de données
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(userData.email);
      expect(userInDb.firstName).toBe(userData.firstName);
      expect(userInDb.lastName).toBe(userData.lastName);
      // Le mot de passe doit être haché
      expect(userInDb.password).not.toBe(userData.password);
    });

    it('doit rejeter l\'inscription avec un email déjà utilisé', async () => {
      // Création préalable d'un utilisateur
      const existingUser = new User({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        password: await bcrypt.hash('ExistingPassword123!', 10),
        role: 'user',
        status: true,
        RGPDConsent: true
      });
      await existingUser.save();

      // Tentative d'inscription avec le même email
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'existing@example.com', // Email déjà utilisé
        password: 'NewPassword123!',
        RGPDConsent: true
      };

      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Vérification de la réponse d'erreur
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });
  });

  // Test de connexion
  describe('POST /api/auth/login', () => {
    it('doit connecter un utilisateur avec des informations valides', async () => {
      // Création d'un utilisateur pour le test
      const password = 'ValidPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const testUser = new User({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: hashedPassword,
        role: 'user',
        status: true,
        RGPDConsent: true
      });
      await testUser.save();

      // Tentative de connexion
      const response = await app
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: password
        })
        .expect(200);

      // Vérification de la réponse
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('doit refuser la connexion avec un mot de passe incorrect', async () => {
      // Création d'un utilisateur pour le test
      const password = 'ValidPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const testUser = new User({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: hashedPassword,
        role: 'user',
        status: true,
        RGPDConsent: true
      });
      await testUser.save();

      // Tentative de connexion avec un mauvais mot de passe
      const response = await app
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      // Vérification de la réponse d'erreur
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});